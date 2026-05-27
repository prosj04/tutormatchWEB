import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { TESTIMONIALS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  let body: {
    quote?: unknown;
    author?: unknown;
    imageUrl?: unknown;
    order?: unknown;
    isActive?: unknown;
    showOnHome?: unknown;
    showOnReviewsPage?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    quote?: string;
    author?: string;
    imageUrl?: string | null;
    order?: number;
    isActive?: boolean;
    showOnHome?: boolean;
    showOnReviewsPage?: boolean;
  } = {};

  if (typeof body.quote === "string") data.quote = body.quote;
  if (typeof body.author === "string") data.author = body.author;
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
  if (body.imageUrl === null) data.imageUrl = null;
  if (typeof body.order === "number" && Number.isFinite(body.order)) {
    data.order = body.order;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.showOnHome === "boolean") data.showOnHome = body.showOnHome;
  if (typeof body.showOnReviewsPage === "boolean") data.showOnReviewsPage = body.showOnReviewsPage;

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data,
  });

  revalidatePublicCms(TESTIMONIALS_CACHE_TAG);
  return NextResponse.json(testimonial);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  await prisma.testimonial.delete({ where: { id } });

  revalidatePublicCms(TESTIMONIALS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
