import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  FAQS_CACHE_TAG,
  SITE_CONTENT_CACHE_TAG,
  TESTIMONIALS_CACHE_TAG,
  revalidatePublicCms,
} from "@/lib/public-cms-cache";

type SiteContentInput = {
  id?: unknown;
  section?: unknown;
  key?: unknown;
  value?: unknown;
  type?: unknown;
  order?: unknown;
  isActive?: unknown;
};

type TestimonialInput = {
  id?: unknown;
  quote?: unknown;
  author?: unknown;
  imageUrl?: unknown;
  order?: unknown;
  isActive?: unknown;
};

type FaqInput = {
  id?: unknown;
  question?: unknown;
  answer?: unknown;
  order?: unknown;
  isActive?: unknown;
};

function parseOrder(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseActive(value: unknown): boolean {
  return typeof value === "boolean" ? value : true;
}

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const [siteContent, testimonials, faqs] = await Promise.all([
    prisma.siteContent.findMany({
      orderBy: [{ section: "asc" }, { order: "asc" }, { key: "asc" }],
    }),
    prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.faqItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);

  return NextResponse.json({ siteContent, testimonials, faqs });
}

export async function PATCH(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  let body: {
    siteContent?: unknown;
    testimonials?: unknown;
    faqs?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const siteContent = Array.isArray(body.siteContent)
    ? (body.siteContent as SiteContentInput[])
    : [];
  const testimonials = Array.isArray(body.testimonials)
    ? (body.testimonials as TestimonialInput[])
    : [];
  const faqs = Array.isArray(body.faqs) ? (body.faqs as FaqInput[]) : [];

  await prisma.$transaction([
    ...siteContent
      .filter(
        (item) =>
          typeof item.section === "string" &&
          typeof item.key === "string" &&
          typeof item.value === "string",
      )
      .map((item) =>
        prisma.siteContent.upsert({
          where: {
            section_key: {
              section: item.section as string,
              key: item.key as string,
            },
          },
          create: {
            section: item.section as string,
            key: item.key as string,
            value: item.value as string,
            type: typeof item.type === "string" ? item.type : "text",
            order: parseOrder(item.order),
            isActive: parseActive(item.isActive),
            updatedBy: authResult.userId,
          },
          update: {
            value: item.value as string,
            type: typeof item.type === "string" ? item.type : "text",
            order: parseOrder(item.order),
            isActive: parseActive(item.isActive),
            updatedBy: authResult.userId,
          },
        }),
      ),
    ...testimonials
      .filter((item) => typeof item.id === "string")
      .map((item) =>
        prisma.testimonial.update({
          where: { id: item.id as string },
          data: {
            quote: typeof item.quote === "string" ? item.quote : "",
            author: typeof item.author === "string" ? item.author : "",
            imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
            order: parseOrder(item.order),
            isActive: parseActive(item.isActive),
          },
        }),
      ),
    ...faqs
      .filter((item) => typeof item.id === "string")
      .map((item) =>
        prisma.faqItem.update({
          where: { id: item.id as string },
          data: {
            question: typeof item.question === "string" ? item.question : "",
            answer: typeof item.answer === "string" ? item.answer : "",
            order: parseOrder(item.order),
            isActive: parseActive(item.isActive),
          },
        }),
      ),
  ]);

  revalidatePublicCms(
    SITE_CONTENT_CACHE_TAG,
    TESTIMONIALS_CACHE_TAG,
    FAQS_CACHE_TAG,
  );
  return GET();
}

export async function POST(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  let body: { kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.kind === "testimonial") {
    const created = await prisma.testimonial.create({
      data: { quote: "새 후기 내용을 입력하세요.", author: "작성자", order: 999 },
    });
    revalidatePublicCms(TESTIMONIALS_CACHE_TAG);
    return NextResponse.json({ testimonial: created }, { status: 201 });
  }

  if (body.kind === "faq") {
    const created = await prisma.faqItem.create({
      data: { question: "새 질문을 입력하세요.", answer: "답변을 입력하세요.", order: 999 },
    });
    revalidatePublicCms(FAQS_CACHE_TAG);
    return NextResponse.json({ faq: created }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (kind === "testimonial") {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePublicCms(TESTIMONIALS_CACHE_TAG);
    return NextResponse.json({ ok: true });
  }

  if (kind === "faq") {
    await prisma.faqItem.delete({ where: { id } });
    revalidatePublicCms(FAQS_CACHE_TAG);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
