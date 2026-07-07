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
    title?: unknown;
    quote?: unknown;
    author?: unknown;
    imageUrl?: unknown;
    gradeFrom?: unknown;
    gradeTo?: unknown;
    category?: unknown;
    tags?: unknown;
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
    title?: string | null;
    quote?: string;
    author?: string;
    imageUrl?: string | null;
    gradeFrom?: string | null;
    gradeTo?: string | null;
    category?: string | null;
    tags?: string | null;
    order?: number;
    isActive?: boolean;
    showOnHome?: boolean;
    showOnReviewsPage?: boolean;
  } = {};

  if (typeof body.title === "string") data.title = body.title;
  if (body.title === null) data.title = null;
  if (typeof body.quote === "string") data.quote = body.quote;
  if (typeof body.author === "string") data.author = body.author;
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
  if (body.imageUrl === null) data.imageUrl = null;
  if (typeof body.gradeFrom === "string") data.gradeFrom = body.gradeFrom;
  if (body.gradeFrom === null) data.gradeFrom = null;
  if (typeof body.gradeTo === "string") data.gradeTo = body.gradeTo;
  if (body.gradeTo === null) data.gradeTo = null;
  if (typeof body.category === "string") data.category = body.category;
  if (body.category === null) data.category = null;
  if (typeof body.tags === "string") data.tags = body.tags;
  if (body.tags === null) data.tags = null;
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
