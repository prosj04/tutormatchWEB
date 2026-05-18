"use client";

import Link from "next/link";
import { FadeSection } from "./FadeSection";

const links = [
  { href: "/#teachers", label: "강사진" },
  { href: "/pricing", label: "요금제" },
  { href: "/checkout", label: "등록 · 결제" },
];

export function Footer() {
  return (
    <FadeSection>
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-8 py-20">
          <div className="flex flex-col gap-12 border-b border-gray-100 pb-12 md:flex-row md:justify-between">
            <div>
              <p className="text-2xl font-black italic text-text-primary">Concord.</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
                전문 매니저 상담으로 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-text-secondary">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="transition hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-10 text-xs leading-relaxed text-text-muted">
            <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="min-w-0">
                <span className="font-medium text-text-secondary">상호</span> 주식회사 컨코드에듀케이션
                <span className="mx-2 text-gray-200">|</span>
                <span className="font-medium text-text-secondary">대표</span> 홍길동
              </span>
              <Link
                href="/teacher-portal"
                className="shrink-0 text-gray-400 no-underline transition hover:text-gray-500 hover:underline"
              >
                선생님이신가요?
              </Link>
            </p>
            <p className="mt-2">
              <span className="font-medium text-text-secondary">사업자등록번호</span> 123-45-67890
              <span className="mx-2 text-gray-200">|</span>
              <span className="font-medium text-text-secondary">주소</span> 서울특별시 강남구 테헤란로 000, 00층
            </p>
            <p className="mt-2">
              <span className="font-medium text-text-secondary">통신판매업 신고번호</span>{" "}
              제2024-서울강남-00000호
            </p>
            <p className="mt-8 text-text-muted">
              © {new Date().getFullYear()} Concord Private Tutoring. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </FadeSection>
  );
}
