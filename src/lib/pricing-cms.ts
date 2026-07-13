import {
  getCmsSectionValue,
  parseCmsVisibility,
  parseMultilineList,
  pricingBoxFieldKey,
  pricingMiddleBoxFieldKey,
} from "@/lib/cms-page-defaults";
import { PRICING_PLANS_V2, type PricingPlanV2, type PricingSchoolTier } from "@/lib/pricing-plans";

export type PricingPlanItem = {
  plan: PricingPlanV2;
  title?: string;
  subtitle?: string;
  /** Price is intentionally omitted — always read from plan.priceKrw. */
  price?: never;
  features?: string[];
};

/** 요금제 페이지·랜딩 — 선택된 tier의 v2 4개 플랜 (주1회2h · 주1회3h · 주2회2h · 주2회3h). */
export function buildVisiblePricingPlanItems(
  siteContent: Record<string, Record<string, string>> | undefined,
  tier: PricingSchoolTier = "high",
): PricingPlanItem[] {
  const get = (key: string) => getCmsSectionValue(siteContent, "pricing_page", key, "");

  const tierPlans = PRICING_PLANS_V2.filter((p) => p.tier === tier);

  const items: PricingPlanItem[] = [];

  tierPlans.forEach((plan, idx) => {
    const slot = idx + 1; // slots 1–4

    const highVis = pricingBoxFieldKey(slot, "visible");
    const middleVis = get(pricingMiddleBoxFieldKey(slot, "visible"));
    const visStored = tier === "high" ? get(highVis) : middleVis;
    const visFallback = tier === "middle" ? get(highVis) : middleVis;
    const effectiveVis = firstNonEmpty(visStored, visFallback);
    if (!parseCmsVisibility(effectiveVis === "" ? undefined : effectiveVis, true)) return;

    const middleTitle = get(pricingMiddleBoxFieldKey(slot, "title"));
    const highTitle = get(pricingBoxFieldKey(slot, "title"));
    const title =
      firstNonEmpty(
        tier === "middle" ? middleTitle : highTitle,
        tier === "middle" ? highTitle : middleTitle,
      ) || undefined;

    const middleSubtitle = get(pricingMiddleBoxFieldKey(slot, "subtitle"));
    const highSubtitle = get(pricingBoxFieldKey(slot, "subtitle"));
    const subtitle =
      firstNonEmpty(
        tier === "middle" ? middleSubtitle : highSubtitle,
        tier === "middle" ? highSubtitle : middleSubtitle,
      ) || undefined;

    const middleFeatures = get(pricingMiddleBoxFieldKey(slot, "features"));
    const highFeatures = get(pricingBoxFieldKey(slot, "features"));
    const featRaw = firstNonEmpty(
      tier === "middle" ? middleFeatures : highFeatures,
      tier === "middle" ? highFeatures : middleFeatures,
    );
    const features = parseMultilineList(featRaw, defaultV2Features(plan));

    items.push({ plan, title, subtitle, features });
  });

  return items;
}

function firstNonEmpty(...vals: string[]): string {
  for (const val of vals) {
    if (val !== "") return val;
  }
  return "";
}

function defaultV2Features(plan: PricingPlanV2): string[] {
  return [
    "학습·과제 관리",
    plan.weekly === 2 ? "AI 질답 횟수 2배 제공" : "AI 질답 이용 가능",
    "수시 강사 첨삭, 질답",
  ];
}
