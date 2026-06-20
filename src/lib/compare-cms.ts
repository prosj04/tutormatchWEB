import { getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";

export const COMPARE_ROW_COUNT = 9;

export type CompareTableRow = {
  rowIndex: number;
  feature: string;
  concord: string;
  other: string;
};

type CompareRowFallback = Omit<CompareTableRow, "rowIndex">;

const COMPARE_ROW_FALLBACKS: CompareRowFallback[] = [
  { feature: "선생님 자격 검증", other: "✗", concord: "✓ 서류·면접" },
  { feature: "선생님 실력 확인", other: "수업 후에야 파악", concord: "✓ 사전 검증" },
  { feature: "학생 맞춤 매칭", other: "직접 알아봐야 함", concord: "✓ 매니저가 성향·과목 맞춰 연결" },
  { feature: "선생님 교체 리스크", other: "맞지 않으면 1~2달 낭비", concord: "✓ 처음부터 핏 맞는 선생님" },
  { feature: "학생 관리", other: "선생님 개인 역량 의존", concord: "✓ 관리 매뉴얼 기반" },
  { feature: "매일 학습 점검", other: "✗", concord: "✓ 일별 플랜" },
  { feature: "질문 답변", other: "수업 시간에만", concord: "✓ 상시 (강사·AI)" },
  { feature: "문제 발생 대응", other: "학부모가 직접 해결", concord: "✓ 전담 매니저 조율" },
  { feature: "학습 기록 공유", other: "✗", concord: "✓ 플랜·기록 공유" },
];

export function buildVisibleCompareRows(
  siteContent: Record<string, Record<string, string>> | undefined,
): CompareTableRow[] {
  const rows: CompareTableRow[] = [];

  for (let n = 1; n <= COMPARE_ROW_COUNT; n++) {
    const fallback = COMPARE_ROW_FALLBACKS[n - 1]!;
    const vis = getCmsSectionValue(siteContent, "compare", `row${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) continue;

    const feature = getCmsSectionValue(siteContent, "compare", `row${n}_feature`, fallback.feature);
    if (!feature.trim()) continue;

    rows.push({
      rowIndex: n,
      feature,
      concord: getCmsSectionValue(siteContent, "compare", `row${n}_concord`, fallback.concord),
      other: getCmsSectionValue(siteContent, "compare", `row${n}_other`, fallback.other),
    });
  }

  return rows;
}

export function getCompareTableTitle(
  siteContent: Record<string, Record<string, string>> | undefined,
): string {
  return getCmsSectionValue(siteContent, "compare", "table_title", "서비스 비교");
}
