import Link from "next/link";

import {
  buildCheckoutHref,
  CONSULTATION_HREF,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/pricing-plans";

type PricingPlanActionsProps = {
  sessions: SessionPlan;
  subjects: SubjectCount;
  compact?: boolean;
};

export function PricingPlanActions({ sessions, subjects, compact }: PricingPlanActionsProps) {
  const checkoutClass = compact
    ? "inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
    : "inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90";

  const consultClass = compact
    ? "inline-flex w-full items-center justify-center rounded-2xl border border-white/30 bg-transparent py-3.5 text-sm font-black text-white transition hover:border-white hover:bg-white/10"
    : "inline-flex w-full items-center justify-center rounded-2xl border border-neutral-20 bg-white py-3.5 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary";

  return (
    <div className="mt-auto flex flex-col gap-2.5 pt-8">
      <Link href={buildCheckoutHref(sessions, subjects)} className={checkoutClass}>
        이 플랜으로 시작
      </Link>
      <Link href={CONSULTATION_HREF} className={consultClass}>
        상담 먼저 신청하기
      </Link>
    </div>
  );
}
