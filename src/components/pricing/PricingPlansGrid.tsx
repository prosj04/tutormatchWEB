import { PricingPlanCard } from "@/components/pricing/PricingPlanCard";
import type { PricingPlanDefinition } from "@/lib/pricing-plans";

export const PRICING_GRID_GAP_CLASS = "gap-6";

/** 홈 2열 그리드에서 카드 1장 너비와 동일 */
export const PRICING_CARD_WIDTH_CLASS =
  "w-[min(348px,calc(100vw-2.5rem))] shrink-0 !flex sm:w-[348px]";

export type PricingPlanItem = {
  plan: PricingPlanDefinition;
  title?: string;
  subtitle?: string;
  price?: string;
  features?: string[];
};

type PricingPlansGridProps = {
  items: PricingPlanItem[];
  /** 홈: 2열 그리드 · 요금제 페이지: 동일 카드 너비 가로 스크롤 4장 */
  variant?: "home" | "page";
  activeIndex?: number;
};

export function PricingPlansGrid({
  items,
  variant = "page",
  activeIndex = 0,
}: PricingPlansGridProps) {
  if (variant === "page") {
    return (
      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
        <div className={`flex w-max ${PRICING_GRID_GAP_CLASS}`}>
          {items.map((item) => (
            <PricingPlanCard
              key={item.plan.id}
              plan={item.plan}
              title={item.title}
              subtitle={item.subtitle}
              price={item.price}
              features={item.features}
              active
              className={PRICING_CARD_WIDTH_CLASS}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid items-stretch ${PRICING_GRID_GAP_CLASS} md:grid-cols-2`}>
      {items.map((item, index) => (
        <PricingPlanCard
          key={item.plan.id}
          plan={item.plan}
          title={item.title}
          subtitle={item.subtitle}
          price={item.price}
          features={item.features}
          active={activeIndex === index}
        />
      ))}
    </div>
  );
}
