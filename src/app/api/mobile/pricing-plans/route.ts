import { NextResponse } from "next/server";

import { PRICING_PLANS_V2 } from "@/lib/pricing-plans";

/** GET /api/mobile/pricing-plans — 공개 v2 요금제 목록 (인증 불필요) */
export async function GET() {
  const plans = PRICING_PLANS_V2.map((p) => ({
    id: p.id,
    tier: p.tier,
    title: p.title,
    subtitle: p.subtitle,
    monthlyHours: p.monthlyHours,
    priceKrw: p.priceKrw,
    listPriceKrw: p.listPriceKrw,
    discountRate: p.discountRate,
  }));
  return NextResponse.json({ plans });
}
