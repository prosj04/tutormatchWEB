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
  /** 홈: 탭으로 1장 표시 · 요금제 페이지: 전부 표시 */
  variant?: "home" | "page";
  activeIndex?: number;
};

export function PricingPlansGrid({
  items,
  variant = "page",
  activeIndex = 0,
}: PricingPlansGridProps) {
  return (
    <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
      <div className={`flex w-max snap-x snap-mandatory ${PRICING_GRID_GAP_CLASS}`}>
        {items.map((item, index) => (
          <PricingPlanCard
            key={item.plan.id}
            plan={item.plan}
            title={item.title}
            subtitle={item.subtitle}
            price={item.price}
            features={item.features}
            active={variant === "page" ? true : activeIndex === index}
          />
        ))}
      </div>
    </div>
  );
}
