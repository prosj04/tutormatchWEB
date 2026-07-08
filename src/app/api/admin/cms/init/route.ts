import { type NextRequest, NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { seedDefaultCmsContent, upsertCmsTextDefaults } from "@/lib/cms-seed";
import { revalidatePublicCms } from "@/lib/public-cms-cache";

export async function POST(req: NextRequest) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const force = req.nextUrl.searchParams.get("force") === "true";
  if (force) {
    await upsertCmsTextDefaults();
    revalidatePublicCms();
    return NextResponse.json({ seeded: true, forced: true });
  }

  const result = await seedDefaultCmsContent(authResult.userId);
  if (result.siteContentSeeded || result.testimonialsSeeded || result.faqsSeeded) {
    revalidatePublicCms();
  }
  return NextResponse.json({
    seeded: result.siteContentSeeded || result.testimonialsSeeded || result.faqsSeeded,
    result,
  });
}
