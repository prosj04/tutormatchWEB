import Link from "next/link";

import { buildCheckoutHref, formatPlanPrice, type PricingPlanDefinition } from "@/lib/pricing-plans";

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
      className={`${active ? "flex" : "hidden md:flex"} h-full min-w-0 flex-col overflow-hidden rounded-[28px] bg-neutral-10 ${className}`}
    >
      <div className="relative flex flex-1 flex-col rounded-[28px] bg-neutral-100 p-7 pb-8 text-white md:p-8 md:pb-10">
        {plan.recommended ? (
          <span className="absolute right-7 top-7 rounded-xl bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            추천
          </span>
        ) : null}
        <p className="text-xs font-black uppercase tracking-wider text-neutral-30">1:1 맞춤 과외</p>
        <h3 className="mt-4 text-2xl font-black">{displayTitle}</h3>
        <p className="mt-4 whitespace-nowrap text-4xl font-black tracking-tight md:text-5xl">{displayPrice}</p>
        <p className="mt-2 text-sm text-neutral-40">{displaySubtitle}</p>
        <ul className="mt-7 space-y-3 text-sm font-medium leading-relaxed text-neutral-30">
          {displayFeatures.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-primary">·</span>
              {f}
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
