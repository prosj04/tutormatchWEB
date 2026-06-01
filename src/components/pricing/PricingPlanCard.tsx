import Link from "next/link";

import { PublicCardLine } from "@/components/landing/PublicCardText";
import { PUBLIC_CARD } from "@/lib/public-card-sizes";
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
      className={`${active ? "flex" : "hidden md:flex"} h-full ${PUBLIC_CARD.pricingWidth} max-w-[348px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] bg-neutral-10 ${className}`}
    >
      <div
        className={`relative flex ${PUBLIC_CARD.pricingMinHeight} flex-1 flex-col rounded-[28px] bg-neutral-100 p-8 pb-10 text-white`}
      >
        {plan.recommended ? (
          <span className="absolute right-7 top-7 rounded-xl bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            추천
          </span>
        ) : null}
        <p className="text-xs font-black uppercase tracking-wider text-neutral-30">1:1 맞춤 과외</p>
        <PublicCardLine className="mt-4 text-2xl font-black">{displayTitle}</PublicCardLine>
        <PublicCardLine className="mt-4 text-4xl font-black tracking-tight">{displayPrice}</PublicCardLine>
        <PublicCardLine className="mt-2 text-sm text-neutral-30">{displaySubtitle}</PublicCardLine>
        <ul className="mt-8 min-w-0 space-y-3.5 text-sm font-medium text-neutral-30">
          {displayFeatures.map((f) => (
            <li key={f} className="flex min-w-0 gap-3">
              <span className="shrink-0 text-primary">·</span>
              <PublicCardLine className="min-w-0 flex-1">{f}</PublicCardLine>
            </li>
          ))}
        </ul>
        <Link
          href={buildCheckoutHref(plan.sessions, plan.subjects)}
          className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
          style={{ marginTop: "auto", paddingTop: "1rem" }}
        >
          이 플랜으로 시작
        </Link>
      </div>
    </article>
  );
}
