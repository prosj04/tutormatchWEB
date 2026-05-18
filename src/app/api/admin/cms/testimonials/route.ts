import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(testimonials);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  let body: { quote?: unknown; author?: unknown; imageUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.quote !== "string" || typeof body.author !== "string") {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const maxOrder = await prisma.testimonial.aggregate({
    _max: { order: true },
  });

  const testimonial = await prisma.testimonial.create({
    data: {
      quote: body.quote,
      author: body.author,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(testimonial, { status: 201 });
}
