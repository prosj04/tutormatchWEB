import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { FAQS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const faqs = await prisma.faqItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  let body: { question?: unknown; answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.question !== "string" || typeof body.answer !== "string") {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const maxOrder = await prisma.faqItem.aggregate({
    _max: { order: true },
  });

  const faq = await prisma.faqItem.create({
    data: {
      question: body.question,
      answer: body.answer,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePublicCms(FAQS_CACHE_TAG);
  return NextResponse.json(faq, { status: 201 });
}
