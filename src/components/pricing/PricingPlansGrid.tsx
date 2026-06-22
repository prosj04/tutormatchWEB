import { PricingPlanCard } from "@/components/pricing/PricingPlanCard";
import type { PricingPlanDefinition } from "@/lib/pricing-plans";

export const PRICING_GRID_GAP_CLASS = "gap-6";

export type PricingPlanItem = {
  plan: PricingPlanDefinition;
  title?: string;
  subtitle?: string;
  price?: string;
  features?: string[];
};

type PricingPlansGridProps = {
  items: PricingPlanItem[];
  /** 홈: 고정 그리드 · 요금제 페이지: 가로 스크롤 */
  variant?: "home" | "page";
};

export function PricingPlansGrid({
  items,
  variant = "page",
}: PricingPlansGridProps) {
  const isHome = variant === "home";

  if (isHome) {
    return (
      <div className={`grid ${PRICING_GRID_GAP_CLASS} ${items.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {items.map((item) => (
          <PricingPlanCard
            key={item.plan.id}
            plan={item.plan}
            title={item.title}
            subtitle={item.subtitle}
            price={item.price}
            features={item.features}
            active={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
      <div className={`flex w-max snap-x snap-mandatory ${PRICING_GRID_GAP_CLASS}`}>
        {items.map((item) => (
          <PricingPlanCard
            key={item.plan.id}
            plan={item.plan}
            title={item.title}
            subtitle={item.subtitle}
            price={item.price}
            features={item.features}
            active={true}
          />
        ))}
      </div>
    </div>
  );
}
