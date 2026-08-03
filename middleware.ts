import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isMarketingPublicPath } from "@/lib/public-routes";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // 어드민 패널은 ADMIN·CHIEF_MANAGER 공용 — layout.tsx·admin API 가드
  // (requireChiefManagerOrAdmin)와 동일 범위. 치프 전용 제한이 필요한 동작은
  // 라우트별 requireAdmin이 막는다(예: 강사 역할 변경).
  if (pathname.startsWith("/admin")) {
    if (!session || (role !== "ADMIN" && role !== "CHIEF_MANAGER")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  if (session && role === "STUDENT") {
    const allowed =
      isMarketingPublicPath(pathname) ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api");
    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (session && role === "PARENT") {
    const allowed =
      isMarketingPublicPath(pathname) ||
      pathname.startsWith("/parent") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/success") ||
      pathname.startsWith("/pricing") ||
      pathname.startsWith("/consult") ||
      pathname.startsWith("/api");
    if (!allowed) {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
  }

  if (session && (role === "TEACHER" || role === "MANAGER")) {
    const allowed =
      isMarketingPublicPath(pathname) ||
      pathname.startsWith("/teacher-portal") ||
      pathname.startsWith("/api");
    if (!allowed) {
      return NextResponse.redirect(new URL("/teacher-portal/dashboard", req.url));
    }
  }

  if (session && role === "ADMIN") {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/teacher-portal/dashboard")) {
      return NextResponse.redirect(new URL("/teacher-portal", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // NextAuth 쿠키/CSRF와 충돌 방지: /api/auth 는 미들웨어에서 제외
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|fonts|images).*)"],
};
