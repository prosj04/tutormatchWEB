import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { FAQS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  let body: {
    question?: unknown;
    answer?: unknown;
    order?: unknown;
    isActive?: unknown;
    showOnHome?: unknown;
    showOnFaqPage?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    question?: string;
    answer?: string;
    order?: number;
    isActive?: boolean;
    showOnHome?: boolean;
    showOnFaqPage?: boolean;
  } = {};

  if (typeof body.question === "string") data.question = body.question;
  if (typeof body.answer === "string") data.answer = body.answer;
  if (typeof body.order === "number" && Number.isFinite(body.order)) {
    data.order = body.order;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.showOnHome === "boolean") data.showOnHome = body.showOnHome;
  if (typeof body.showOnFaqPage === "boolean") data.showOnFaqPage = body.showOnFaqPage;

  const faq = await prisma.faqItem.update({
    where: { id },
    data,
  });

  revalidatePublicCms(FAQS_CACHE_TAG);
  return NextResponse.json(faq);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  await prisma.faqItem.delete({ where: { id } });

  revalidatePublicCms(FAQS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
