/** 로그인한 학생·강사도 둘러볼 수 있는 마케팅·공개 페이지 */
export function isMarketingPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = [
    "/pricing",
    "/tutors",
    "/faq",
    "/reviews",
    "/login",
    "/register",
    "/checkout",
    "/success",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
