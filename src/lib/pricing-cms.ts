import type { PricingPlanItem } from "@/components/pricing/PricingPlansGrid";
import {
  getCmsSectionValue,
  parseCmsVisibility,
  parseMultilineList,
  pricingBoxFieldKey,
  pricingMiddleBoxFieldKey,
  pricingPlanFieldKey,
} from "@/lib/cms-page-defaults";
import { formatKRW } from "@/lib/format-won";
import { PRICING_PLAN_SLOTS, type PricingSchoolTier, formatPlanPrice } from "@/lib/pricing-plans";

const SLOT_TO_LEGACY_PLAN_ID: Record<number, string | undefined> = {
  1: "4-1",
  2: "8-1",
  3: "4-2",
  4: "8-2",
};

/** 요금제 페이지·랜딩 — 표시된 박스만, 박스 번호 순서. */
export function buildVisiblePricingPlanItems(
  siteContent: Record<string, Record<string, string>> | undefined,
  tier: PricingSchoolTier = "high",
): PricingPlanItem[] {
  const get = (key: string) => getCmsSectionValue(siteContent, "pricing_page", key, "");

  const items: PricingPlanItem[] = [];

  for (let slot = 1; slot <= PRICING_PLAN_SLOTS.length; slot++) {
    const plan = PRICING_PLAN_SLOTS[slot - 1]!;
    const highVis = pricingBoxFieldKey(slot, "visible");
    const legacyId = SLOT_TO_LEGACY_PLAN_ID[slot];
    const legacyVis = legacyId ? get(pricingPlanFieldKey(legacyId, "visible")) : "";

    const middleVis = get(pricingMiddleBoxFieldKey(slot, "visible"));
    const visStored = tier === "high" ? get(highVis) : middleVis;
    const visFallback = tier === "middle" ? get(highVis) : middleVis;
    const effectiveVis = firstNonEmpty(visStored, visFallback, legacyVis);
    if (!parseCmsVisibility(effectiveVis === "" ? undefined : effectiveVis, slot <= 4)) continue;

    const legacyPlanKey = legacyId;

    const middleTitle = get(pricingMiddleBoxFieldKey(slot, "title"));
    const highTitle = get(pricingBoxFieldKey(slot, "title"));
    const title =
      firstNonEmpty(
        tier === "middle" ? middleTitle : highTitle,
        tier === "middle" ? highTitle : middleTitle,
        legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "title")) : "",
        slot === 1 ? get("plan4_title") : "",
        slot === 2 ? get("plan8_title") : "",
      ) || plan.title;

    const middleSubtitle = get(pricingMiddleBoxFieldKey(slot, "subtitle"));
    const highSubtitle = get(pricingBoxFieldKey(slot, "subtitle"));
    const subtitle =
      firstNonEmpty(
        tier === "middle" ? middleSubtitle : highSubtitle,
        tier === "middle" ? highSubtitle : middleSubtitle,
        legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "subtitle")) : "",
        slot === 1 ? get("plan4_subtitle") : "",
        slot === 2 ? get("plan8_subtitle") : "",
      ) || plan.subtitle;

    const middlePrice = firstNonEmpty(
      get(pricingMiddleBoxFieldKey(slot, "price")),
      legacyPlanKey ? get(pricingPlanFieldKey(legacyPlanKey, "price")) : "",
      slot === 1 ? get("plan4_price") : "",
      slot === 2 ? get("plan8_price") : "",
    );
    const highPrice = get(pricingBoxFieldKey(slot, "price"));
    const price =
      tier === "middle"
        ? firstNonEmpty(middlePrice, highPrice) || formatPlanPrice(plan.sessions, plan.subjects)
        : firstNonEmpty(highPrice, addPriceDelta(middlePrice, 50_000), middlePrice) ||
          formatPlanPrice(plan.sessions, plan.subjects);

    const middleFeatures = get(pricingMiddleBoxFieldKey(slot, "features"));
    const highFeatures = get(pricingBoxFieldKey(slot, "features"));
    const featRaw = firstNonEmpty(
      tier === "middle" ? middleFeatures : highFeatures,
      tier === "middle" ? highFeatures : middleFeatures,
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

function addPriceDelta(priceText: string, delta: number): string {
  const amount = Number(priceText.replace(/[^\d]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return formatKRW(amount + delta);
}
