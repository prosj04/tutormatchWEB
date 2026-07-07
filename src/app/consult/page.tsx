import "./consult.css";


import { ConsultRequestForm } from "@/components/consultation/ConsultRequestForm";
import { PublicShell } from "@/components/layout/PublicShell";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const metadata = {
  title: "상담 신청",
};

export const revalidate = 300;

type SearchParams = { source?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ConsultPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const siteContent = await getGroupedSiteContentBySections(["consult_page"]);
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "consult_page", key, fallback);

  const headline = get("headline", "상담 신청만 해도 학습 전문가의 1:1 학습진단 제공");
  const subtext = get("subtext", "정확한 상담 정보를 입력해 주세요.");
  const benefits = [
    get("benefit_1", "무료 학습진단 리포트"),
    get("benefit_2", "전담 매니저 1:1 상담"),
    get("benefit_3", "첫 수업 100% 환불 보장"),
  ].filter(Boolean);
  const phoneNotice = get(
    "phone_notice",
    "*신청 후 1영업일 내에 담당 매니저가 연락드립니다.",
  );

  return (
    <PublicShell>
      <main className="consult-main">
        <div className="consult-benefit">
          <div className="consult-benefit-items">
            {benefits.map((b) => (
              <div key={b} className="consult-benefit-item">
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="consult-head">
          <h1>{headline}</h1>
          <p>{subtext}</p>
        </div>

        <ConsultRequestForm
          source={first(searchParams?.source)}
          phoneNotice={phoneNotice}
        />
      </main>
    </PublicShell>
  );
}
