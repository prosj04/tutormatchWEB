import Link from "next/link";

import {
  buildCheckoutHref,
  formatPlanPrice,
  type PricingPlanDefinition,
} from "@/lib/pricing-plans";

type PricingPlanCardProps = {
  plan: PricingPlanDefinition;
  title?: string;
  subtitle?: string;
  price?: string;
  features?: string[];
  active?: boolean;
  className?: string;
};

export function PricingPlanCard({
  plan,
  title,
  subtitle,
  price,
  features,
  active = true,
  className = "",
}: PricingPlanCardProps) {
  const displayTitle = title ?? plan.title;
  const displaySubtitle = subtitle ?? plan.subtitle;
  const displayPrice = price ?? formatPlanPrice(plan.sessions, plan.subjects);
  const displayFeatures = features ?? plan.features;

  return (
    <article
      className={`pricing-plan-card ${active ? "flex" : "hidden md:flex"} shrink-0 snap-center flex-col overflow-hidden rounded-[28px] bg-neutral-10 ${className}`}
    >
      <div className="pricing-plan-card__top shrink-0 rounded-t-[28px] bg-neutral-10" aria-hidden />
      <div className="pricing-plan-card__body relative flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-neutral-100 text-white">
        {plan.recommended ? (
          <span className="absolute right-[clamp(1.25rem,6cqi,1.75rem)] top-[clamp(1.25rem,6cqi,1.75rem)] rounded-xl bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            추천
          </span>
        ) : null}
        <p className="pricing-plan-card__kicker pricing-plan-card__line font-black uppercase tracking-wider text-neutral-30">
          1:1 맞춤 과외
        </p>
        <h3 className="pricing-plan-card__title pricing-plan-card__line mt-4 font-black">{displayTitle}</h3>
        <p className="pricing-plan-card__price pricing-plan-card__line mt-4 font-black tracking-tight">
          {displayPrice}
        </p>
        <p className="pricing-plan-card__subtitle pricing-plan-card__line mt-2 text-neutral-40">
          {displaySubtitle}
        </p>
        <ul className="pricing-plan-card__features mt-7 min-h-0 flex-1 space-y-3 font-medium text-neutral-30">
          {displayFeatures.map((f) => (
            <li key={f} className="flex min-w-0 gap-3">
              <span className="shrink-0 text-primary">·</span>
              <span className="pricing-plan-card__feature pricing-plan-card__line min-w-0 flex-1">{f}</span>
            </li>
          ))}
        </ul>
        <Link
          href={buildCheckoutHref(plan.sessions, plan.subjects)}
          className="pricing-plan-card__cta pricing-plan-card__line mt-auto inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-primary py-4 font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
        >
          이 플랜으로 시작
        </Link>
      </div>
    </article>
  );
}
