import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Protected routes:
 * - /checkout → STUDENT only → else /login?redirect=/checkout
 * - /teacher-portal/dashboard → TEACHER only → else /teacher-portal (로그인)
 * - /teacher-portal, /teacher-portal/apply → 공개 (미들웨어 제외)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/checkout")) {
    const role = session?.user?.role;
    if (!session?.user?.id || role !== "STUDENT") {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("redirect", "/checkout");
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/teacher-portal/dashboard")) {
    const role = session?.user?.role;
    if (!session?.user?.id || role !== "TEACHER") {
      return NextResponse.redirect(new URL("/teacher-portal", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/checkout/:path*", "/teacher-portal/dashboard/:path*"],
};
