import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { seedDefaultCmsContent } from "@/lib/cms-seed";

export async function POST() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const result = await seedDefaultCmsContent(authResult.userId);
  return NextResponse.json({
    seeded: result.siteContentSeeded || result.testimonialsSeeded || result.faqsSeeded,
    result,
  });
}
