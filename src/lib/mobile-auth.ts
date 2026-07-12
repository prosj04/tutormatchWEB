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

/**
 * access 토큰 검증 + 사용자 id 반환.
 *
 * P2-8: 서명·만료만으로는 소프트삭제/역할변경을 반영하지 못해 토큰이 최대 7일간
 * 유효했다. 웹 auth.ts의 deletedAt 가드와 동일하게, 서명 통과 후 user를 재조회해
 * deletedAt≠null 또는 role 불일치 시 무효(null) 처리한다.
 */
export async function getMobileUser(
  request: Request,
): Promise<MobileTokenPayload | null> {
  const token = bearerFrom(request);
  if (!token) return null;
  const payload = verifyMobileToken(token);
  if (!payload || payload.typ !== "access") return null;

  // 소프트삭제·역할변경 즉시 반영을 위해 user 재조회
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, deletedAt: true },
  });
  if (!user || user.deletedAt !== null || user.role !== payload.role) {
    return null;
  }
  return payload;
}

/**
 * 역할 무관 인증(모바일). Bearer access JWT 서명·만료·소프트삭제만 검증하고
 * 역할은 제한하지 않는다. 알림처럼 "자기 userId 데이터만" 다루는 라우트용 —
 * STUDENT/TEACHER/MANAGER/CHIEF_MANAGER/PARENT 모두 자기 알림 조회·읽음 처리 가능.
 */
export async function requireMobileUser(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { userId: payload.sub, role: payload.role } as const;
}

/** 학생 권한 필수 — 라우트 핸들러에서 `if ("error" in r) return r.error` 패턴 */
export async function requireMobileStudent(request: Request) {
  const payload = await getMobileUser(request);
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

/** 학부모 권한 필수. */
export async function requireMobileParent(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (payload.role !== "PARENT") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const parent = await prisma.parent.findUnique({
    where: { userId: payload.sub },
  });
  if (!parent) {
    return {
      error: NextResponse.json({ error: "Parent not found" }, { status: 404 }),
    } as const;
  }
  return { parent, userId: payload.sub } as const;
}

/**
 * 강사 신원만 확인(모바일, 승인 여부 무관). 웹 requireTeacherAllowPending 대응.
 * 승인 대기 강사도 접근하는 온보딩 라우트(프로필/사진/서류)용.
 */
export async function requireMobileTeacherAllowPending(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (
    payload.role !== "TEACHER" &&
    payload.role !== "MANAGER" &&
    payload.role !== "CHIEF_MANAGER"
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const teacher = await prisma.teacher.findUnique({
    where: { userId: payload.sub },
  });
  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Teacher not found" }, { status: 404 }),
    } as const;
  }
  return { teacher, userId: payload.sub, role: payload.role } as const;
}

/**
 * 강사 권한 필수(모바일). 웹 requireTeacher와 동일 정책:
 * TEACHER/MANAGER/CHIEF_MANAGER 통과, 단 TEACHER는 승인(approved)된 경우만.
 */
export async function requireMobileTeacher(request: Request) {
  const result = await requireMobileTeacherAllowPending(request);
  if ("error" in result) return result;
  if (result.role === "TEACHER" && !result.teacher.approved) {
    return {
      error: NextResponse.json(
        { error: "승인 대기 중입니다. 관리자 승인 후 이용할 수 있습니다." },
        { status: 403 },
      ),
    } as const;
  }
  return result;
}

/**
 * 매니저 권한 필수(모바일). 웹 requireManager와 동일 정책:
 * MANAGER/CHIEF_MANAGER/ADMIN이 Teacher 레코드를 가진 경우 통과.
 */
export async function requireMobileManager(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (
    payload.role !== "MANAGER" &&
    payload.role !== "CHIEF_MANAGER" &&
    payload.role !== "ADMIN"
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const teacher = await prisma.teacher.findUnique({
    where: { userId: payload.sub },
  });
  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Manager not found" }, { status: 404 }),
    } as const;
  }
  return { teacher, userId: payload.sub, role: payload.role } as const;
}

/**
 * 학부모가 특정 자녀(studentId)에 접근할 권한이 있는지 확인.
 * ParentStudent 링크가 없으면 null 반환(호출부에서 403/404 처리).
 */
export async function parentChildOrNull(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { studentId: true },
  });
  return link ? studentId : null;
}
