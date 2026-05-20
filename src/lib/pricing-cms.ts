import type { PricingPlanItem } from "@/components/pricing/PricingPlansGrid";
import {
  getCmsSectionValue,
  parseCmsVisibility,
  parseMultilineList,
  pricingPlanFieldKey,
} from "@/lib/cms-page-defaults";
import { formatPlanPrice, PRICING_PLANS } from "@/lib/pricing-plans";

/** 요금제 페이지·랜딩 공통 — 표시로 설정된 카드만, PRICING_PLANS 순서 유지 */
export function buildVisiblePricingPlanItems(
  siteContent: Record<string, Record<string, string>> | undefined,
): PricingPlanItem[] {
  const get = (key: string) => getCmsSectionValue(siteContent, "pricing_page", key, "");

  const items: PricingPlanItem[] = [];

  for (const plan of PRICING_PLANS) {
    const vk = pricingPlanFieldKey(plan.id, "visible");
    const visStored = get(vk);
    if (!parseCmsVisibility(visStored === "" ? undefined : visStored)) continue;

    const title =
      firstNonEmpty(
        get(pricingPlanFieldKey(plan.id, "title")),
        plan.id === "4-1" ? get("plan4_title") : "",
        plan.id === "8-1" ? get("plan8_title") : "",
      ) || plan.title;

    const subtitle =
      firstNonEmpty(
        get(pricingPlanFieldKey(plan.id, "subtitle")),
        plan.id === "4-1" ? get("plan4_subtitle") : "",
        plan.id === "8-1" ? get("plan8_subtitle") : "",
      ) || plan.subtitle;

    const priceRaw = firstNonEmpty(
      get(pricingPlanFieldKey(plan.id, "price")),
      plan.id === "4-1" ? get("plan4_price") : "",
      plan.id === "8-1" ? get("plan8_price") : "",
    );
    const price = priceRaw || formatPlanPrice(plan.sessions, plan.subjects);

    const featRaw = firstNonEmpty(
      get(pricingPlanFieldKey(plan.id, "features")),
      plan.id === "4-1" ? get("plan4_features") : "",
      plan.id === "8-1" ? get("plan8_features") : "",
    );
    const features = parseMultilineList(featRaw, plan.features);

    items.push({ plan, title, subtitle, price, features });
  }

  return items;
}

function firstNonEmpty(...vals: string[]): string {
  for (const val of vals) {
    if (val !== "") return val;
  }
  return "";
}

export const ADMIN_PRICING_PLAN_SUMMARY_LABEL: Record<string, string> = {
  "4-1": "월 4회 · 1과목",
  "8-1": "월 8회 · 1과목 · 추천",
  "4-2": "월 4회 · 2과목",
  "8-2": "월 8회 · 2과목",
};
