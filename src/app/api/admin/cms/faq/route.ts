import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const faqs = await prisma.faqItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
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

  return NextResponse.json(faq, { status: 201 });
}
