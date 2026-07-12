import { Suspense } from "react";

import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

import { LoginForm } from "./LoginForm";

function LoginFallback() {
  return (
    <main>
      <div className="auth-wrap">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="brand">
            Concord<span>.</span>
          </div>
          <h1>다시 오신 것을 환영해요</h1>
          <p className="sub">학습 플래너와 상담 내역을 확인하세요.</p>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "로그인",
};

export const revalidate = 300;

type SearchParams = { cms_edit?: string | string[]; setup?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const siteContent = await getGroupedSiteContentBySections(["login_page", "footer"]);
  const title = getCmsSectionValue(siteContent, "login_page", "title", "다시 오신 것을 환영해요");
  const subtext = getCmsSectionValue(
    siteContent,
    "login_page",
    "subtext",
    "학습 플래너와 상담 내역을 확인하세요.",
  );
  // 비밀번호 찾기 안내에 재사용할 기존 상담 전화(푸터 CMS 값).
  const contactPhone = getCmsSectionValue(siteContent, "footer", "phone_number", "010-0000-0000");

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm
        siteContent={siteContent}
        isEditMode={isEditMode}
        defaultTitle={title}
        defaultSubtext={subtext}
        contactPhone={contactPhone}
      />
    </Suspense>
  );
}
