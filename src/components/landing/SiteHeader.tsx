"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function sectionMeta(pathname: string): { label: string; title: string } {
  if (pathname === "/") return { label: "01", title: "홈" };
  if (pathname.startsWith("/tutors/")) return { label: "02", title: "강사 프로필" };
  if (pathname === "/tutors") return { label: "02", title: "강사진" };
  if (pathname === "/pricing") return { label: "03", title: "요금제" };
  if (pathname === "/checkout") return { label: "04", title: "결제" };
  if (pathname === "/success") return { label: "05", title: "완료" };
  return { label: "—", title: "Concord" };
}

export function SiteHeader() {
  const pathname = usePathname();
  const { label, title } = sectionMeta(pathname);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-8">
        <p className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wider text-text-mid">
          <span className="text-text-light">{label}</span> {title}
        </p>
        <div className="flex items-center gap-5 sm:gap-8">
          <nav className="hidden items-center gap-6 text-xs font-medium uppercase tracking-wider text-text-mid sm:flex">
            <Link href="/tutors" className="transition hover:text-primary">
              강사진
            </Link>
            <Link href="/pricing" className="transition hover:text-primary">
              요금제
            </Link>
            <Link
              href="/checkout"
              className="rounded-full border border-gray-200 px-3 py-1.5 transition hover:border-primary hover:text-primary"
            >
              등록
            </Link>
          </nav>
          <Link href="/" className="text-lg font-bold italic text-text-dark">
            Concord.
          </Link>
        </div>
      </div>
    </header>
  );
}
