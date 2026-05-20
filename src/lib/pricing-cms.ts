import type { PricingPlanItem } from "@/components/pricing/PricingPlansGrid";
import {
  getCmsSectionValue,
  parseCmsVisibility,
  parseMultilineList,
  pricingBoxFieldKey,
  pricingPlanFieldKey,
} from "@/lib/cms-page-defaults";
import { PRICING_PLAN_SLOTS, formatPlanPrice } from "@/lib/pricing-plans";

const SLOT_TO_LEGACY_PLAN_ID: Record<number, string | undefined> = {
  1: "4-1",
  2: "8-1",
  3: "4-2",
  4: "8-2",
};

/** 요금제 페이지·랜딩 — 표시된 박스만, 박스 번호 순서 */
export function buildVisiblePricingPlanItems(
  siteContent: Record<string, Record<string, string>> | undefined,
): PricingPlanItem[] {
  const get = (key: string) => getCmsSectionValue(siteContent, "pricing_page", key, "");

  const items: PricingPlanItem[] = [];

  for (let slot = 1; slot <= PRICING_PLAN_SLOTS.length; slot++) {
    const plan = PRICING_PLAN_SLOTS[slot - 1]!;
    const visKey = pricingBoxFieldKey(slot, "visible");
    const visStored = get(visKey);
    const legacyId = SLOT_TO_LEGACY_PLAN_ID[slot];
    const legacyVis = legacyId ? get(pricingPlanFieldKey(legacyId, "visible")) : "";

    const effectiveVis = firstNonEmpty(visStored, legacyVis);
    if (!parseCmsVisibility(effectiveVis === "" ? undefined : effectiveVis, slot <= 4)) continue;

    const legacyPlanKey = legacyId;

    const title =
      firstNonEmpty(
        get(pricingBoxFieldKey(slot, "title")),
        legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "title")) : "",
        slot === 1 ? get("plan4_title") : "",
        slot === 2 ? get("plan8_title") : "",
      ) || plan.title;

    const subtitle =
      firstNonEmpty(
        get(pricingBoxFieldKey(slot, "subtitle")),
        legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "subtitle")) : "",
        slot === 1 ? get("plan4_subtitle") : "",
        slot === 2 ? get("plan8_subtitle") : "",
      ) || plan.subtitle;

    const priceRaw = firstNonEmpty(
      get(pricingBoxFieldKey(slot, "price")),
      legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "price")) : "",
      slot === 1 ? get("plan4_price") : "",
      slot === 2 ? get("plan8_price") : "",
    );
    const price = priceRaw || formatPlanPrice(plan.sessions, plan.subjects);

    const featRaw = firstNonEmpty(
      get(pricingBoxFieldKey(slot, "features")),
      legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "features")) : "",
      slot === 1 ? get("plan4_features") : "",
      slot === 2 ? get("plan8_features") : "",
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
