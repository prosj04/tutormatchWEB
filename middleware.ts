import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isMarketingPublicPath } from "@/lib/public-routes";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!session || role !== "ADMIN") {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|images).*)"],
};
