import { NextResponse } from "next/server";

import { auth } from "@/auth";

/** Protected routes: STUDENT-only checkout; TEACHER-only dashboard. All other paths pass through. */
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
