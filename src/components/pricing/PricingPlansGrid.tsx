import { PricingPlanCard } from "@/components/pricing/PricingPlanCard";
import type { PricingPlanDefinition } from "@/lib/pricing-plans";

export const PRICING_GRID_GAP_CLASS = "grid items-stretch gap-6";

export type PricingPlanItem = {
  plan: PricingPlanDefinition;
  title?: string;
  subtitle?: string;
  price?: string;
  features?: string[];
};

type PricingPlansGridProps = {
  items: PricingPlanItem[];
  /** 홈: 2열 · 요금제 페이지: 2열→4열 */
  variant?: "home" | "page";
  /** 홈 모바일 탭 전환 */
  activeIndex?: number;
};

export function PricingPlansGrid({
  items,
  variant = "page",
  activeIndex = 0,
}: PricingPlansGridProps) {
  const gridClass =
    variant === "home"
      ? `${PRICING_GRID_GAP_CLASS} md:grid-cols-2`
      : `${PRICING_GRID_GAP_CLASS} md:grid-cols-2 xl:grid-cols-4`;

  return (
    <div className={gridClass}>
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
  );
}
