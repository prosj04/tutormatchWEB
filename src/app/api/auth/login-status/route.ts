import { NextResponse } from "next/server";

import { isLoginBlocked, loginRateLimitKey } from "@/lib/login-rate-limit";

/**
 * 로그인 사전 체크 — 식별자가 브루트포스 잠금 상태인지만 알려준다.
 * NextAuth Credentials는 authorize에서 null/throw 시 클라이언트에 잠금과 오답을
 * 구분 가능한 신호를 전달하기 어렵다(에러 코드가 `CredentialsSignin`으로 일반화됨).
 * auth.ts와 동일한 인메모리 스토어를 공유하므로, 로그인 폼이 signIn 이전에 이 값을
 * 조회해 "잠김" 안내와 "비밀번호 오류"를 구분해 표시할 수 있다.
 * 계정 존재 여부는 노출하지 않는다(잠금 상태만 반환).
 */
export async function POST(request: Request) {
  let body: { identifier?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ locked: false }, { status: 200 });
  }

  const invisible = new RegExp("[\\u200B-\\u200D\\uFEFF]", "g");
  const identifier =
    typeof body.identifier === "string"
      ? body.identifier.replace(invisible, "").trim()
      : "";

  if (!identifier) {
    return NextResponse.json({ locked: false }, { status: 200 });
  }

  const locked = isLoginBlocked(loginRateLimitKey(identifier));
  return NextResponse.json({ locked }, { status: 200 });
}
