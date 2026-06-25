import crypto from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * 모바일(RN) 앱 전용 토큰 인증.
 * NextAuth 세션 쿠키는 RN에 부적합하므로, 같은 비밀번호 검증을 거친 뒤
 * HMAC-SHA256 서명 JWT를 발급한다(추가 의존성 없이 Node crypto만 사용).
 */

const ACCESS_TTL_SEC = 60 * 60 * 24 * 7; // 7d
const REFRESH_TTL_SEC = 60 * 60 * 24 * 60; // 60d

export type MobileTokenPayload = {
  sub: string; // user id
  role: string;
  typ: "access" | "refresh";
  exp: number; // epoch seconds
};

function getSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET/NEXTAUTH_SECRET is not configured");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(data: string): string {
  return base64url(
    crypto.createHmac("sha256", getSecret()).update(data).digest(),
  );
}

function signToken(
  userId: string,
  role: string,
  typ: "access" | "refresh",
): string {
  const ttl = typ === "access" ? ACCESS_TTL_SEC : REFRESH_TTL_SEC;
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: MobileTokenPayload = {
    sub: userId,
    role,
    typ,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const body = base64url(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function issueMobileTokens(userId: string, role: string) {
  return {
    accessToken: signToken(userId, role, "access"),
    refreshToken: signToken(userId, role, "refresh"),
    expiresIn: ACCESS_TTL_SEC,
  };
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  const expected = sign(`${header}.${body}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: MobileTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(body).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload?.sub || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

/** access 토큰 검증 + 사용자 id 반환 */
export function getMobileUser(request: Request): MobileTokenPayload | null {
  const token = bearerFrom(request);
  if (!token) return null;
  const payload = verifyMobileToken(token);
  if (!payload || payload.typ !== "access") return null;
  return payload;
}

/** 학생 권한 필수 — 라우트 핸들러에서 `if ("error" in r) return r.error` 패턴 */
export async function requireMobileStudent(request: Request) {
  const payload = getMobileUser(request);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (payload.role !== "STUDENT") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const student = await prisma.student.findUnique({
    where: { userId: payload.sub },
  });
  if (!student) {
    return {
      error: NextResponse.json({ error: "Student not found" }, { status: 404 }),
    } as const;
  }
  return { student, userId: payload.sub } as const;
}
