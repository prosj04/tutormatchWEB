"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useDesignTheme } from "@/hooks/useDesignTheme";

/**
 * Concord 웹 포털 공용 셸 — 시안 "Concord - 웹 포털.html"/"웹 학부모.html"의
 * .shell > aside.side + main.main 구조 그대로 (concord-portal.css).
 * 시안의 역할 미리보기 seg는 쇼케이스 크롬이므로 버리고 실제 세션 역할을 쓴다.
 */

export type PortalNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  cnt?: string | number;
  /** 경로 prefix 매칭(하위 라우트 포함) 여부. 기본은 정확 일치. */
  prefix?: boolean;
};

function isActive(pathname: string, item: PortalNavItem): boolean {
  if (item.prefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}

export function PortalShell({
  roleBadge,
  nav,
  userName,
  userMeta,
  children,
}: {
  /** 사이드바 상단 역할 배지 텍스트 (예: "Parent · /parent") */
  roleBadge: string;
  nav: PortalNavItem[];
  userName: string;
  userMeta: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { color, setColor, toggleMode } = useDesignTheme();

  return (
    <div className="shell">
      <aside className="side">
        {/* 공개 페이지로는 풀 로드 이동(포털 CSS가 공개 페이지를 오염하지 않도록) */}
        <a className="dotw logo" href="/">
          Concord<span className="d"></span>
        </a>
        <span className="role">{roleBadge}</span>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-i"
            aria-current={isActive(pathname, item) ? "true" : "false"}
          >
            {item.icon}
            {item.label}
            {item.cnt != null && item.cnt !== 0 && item.cnt !== "0" ? (
              <span className="cnt">{item.cnt}</span>
            ) : null}
          </Link>
        ))}
        <div className="foot">
          <div className="user">
            <span className="av">{userName.slice(0, 1)}</span>
            <span>
              <b>{userName}</b>
              <p>{userMeta}</p>
            </span>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="seg" role="group" aria-label="색 테마">
            <button
              type="button"
              className="g"
              aria-label="그린"
              aria-pressed={color === "green"}
              onClick={() => setColor("green")}
            >
              <span className="dot"></span>
            </button>
            <button
              type="button"
              className="b"
              aria-label="블루"
              aria-pressed={color === "blue"}
              onClick={() => setColor("blue")}
            >
              <span className="dot"></span>
            </button>
          </div>
          <button type="button" className="tog" aria-label="다크 모드 전환" onClick={toggleMode}>
            <svg className="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            <svg className="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
