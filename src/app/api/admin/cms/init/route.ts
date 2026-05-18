import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { seedDefaultCmsContent } from "@/lib/cms-seed";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const [siteContentCount, testimonialCount, faqCount] = await Promise.all([
    prisma.siteContent.count(),
    prisma.testimonial.count(),
    prisma.faqItem.count(),
  ]);

  if (siteContentCount > 0 || testimonialCount > 0 || faqCount > 0) {
    return NextResponse.json({
      seeded: false,
      message: "already exists",
    });
  }

  const result = await seedDefaultCmsContent(authResult.userId);
  return NextResponse.json({
    seeded: result.siteContentSeeded || result.testimonialsSeeded || result.faqsSeeded,
  });
}
