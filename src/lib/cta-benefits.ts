import { getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";

export type CtaBenefitCard = {
  slot: number;
  title: string;
  desc: string;
  detail: string;
};

const CTA_BENEFIT_DEFAULTS: { title: string; desc: string; detail: string }[] = [
  {
    title: "무료 상담 1회",
    desc: "매니저가 직접 학생 상황을 파악합니다.",
    detail: "현재 성적·목표·일정을 함께 정리하고, 가장 현실적인 학습 방향을 제안해 드립니다.",
  },
  {
    title: "매니저 직접 배정",
    desc: "전문 매니저가 처음부터 함께합니다.",
    detail: "수업 외에도 진도·숙제·질문을 챙기며 학부모님께도 정기적으로 공유합니다.",
  },
  {
    title: "학습 리포트 무료",
    desc: "첫 달 학습 리포트를 무료로 제공합니다.",
    detail: "출결, 과제 수행률, 취약 단원을 한눈에 볼 수 있는 리포트를 받아보세요.",
  },
  {
    title: "맞춤 강사 매칭",
    desc: "성향과 목표에 맞는 선생님을 연결합니다.",
    detail: "무작위 배정이 아니라 상담 내용을 바탕으로 후보를 추천하고 일정까지 조율합니다.",
  },
  { title: "", desc: "", detail: "" },
  { title: "", desc: "", detail: "" },
];

/** 홈 CMS `cta` 섹션 — 요금제 등 다른 페이지와 동일 데이터 */
export function buildCtaBenefitCards(
  siteContent: Record<string, Record<string, string>> | undefined,
): CtaBenefitCard[] {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "cta", key, fallback);

  return [1, 2, 3, 4, 5, 6].flatMap((n) => {
    const vis = get(`cta_box_${n}_visible`, n <= 4 ? "1" : "0");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 4)) {
      return [];
    }
    const def = CTA_BENEFIT_DEFAULTS[n - 1]!;
    const title = get(`cta_box_${n}_title`, def.title);
    const desc = get(`cta_box_${n}_desc`, def.desc);
    const detail = get(`cta_box_${n}_detail`, def.detail);
    if (!title.trim()) return [];
    return [{ slot: n, title, desc, detail }];
  });
}
