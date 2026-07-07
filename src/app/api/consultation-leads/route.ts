import { NextResponse } from "next/server";

import { requireAdmin, parsePagination } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import {
  LEAD_GENDERS,
  LEAD_GRADES,
  LEAD_STATUSES,
  LEAD_SUBJECTS,
} from "@/lib/consultation-lead";

/* Simple in-memory rate limit: 5 submissions / 10 min / IP */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!/^01[016789][0-9]{7,8}$/.test(digits)) return null;
  return digits;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (!phone) {
    return NextResponse.json(
      { error: "올바른 휴대폰 번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  if (!(LEAD_GRADES as readonly string[]).includes(grade)) {
    return NextResponse.json(
      { error: "학년을 선택해 주세요." },
      { status: 400 },
    );
  }

  const subjectsInput = Array.isArray(body.subjects) ? body.subjects : [];
  const subjects = subjectsInput.filter(
    (s): s is string =>
      typeof s === "string" && (LEAD_SUBJECTS as readonly string[]).includes(s),
  );
  if (subjects.length === 0) {
    return NextResponse.json(
      { error: "과목을 1개 이상 선택해 주세요." },
      { status: 400 },
    );
  }

  const preferredTime =
    typeof body.preferredTime === "string" && body.preferredTime.trim()
      ? body.preferredTime.trim().slice(0, 50)
      : null;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 50)
      : null;
  const gender =
    typeof body.gender === "string" &&
    (LEAD_GENDERS as readonly string[]).includes(body.gender)
      ? body.gender
      : null;
  const source =
    typeof body.source === "string" && body.source.trim()
      ? body.source.trim().slice(0, 100)
      : null;
  const marketingOptIn = body.marketingOptIn === true;

  if (body.privacyAgreed !== true) {
    return NextResponse.json(
      { error: "개인정보 수집·이용에 동의해 주세요." },
      { status: 400 },
    );
  }

  const lead = await prisma.consultationLead.create({
    data: {
      name,
      gender,
      phone,
      grade,
      subjects: JSON.stringify(subjects),
      preferredTime,
      marketingOptIn,
      source,
    },
  });

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.consultationSubmitted,
    platform: "web",
    payload: { leadId: lead.id, source: source ?? "consult_page", public: true },
  });

  return NextResponse.json({ lead: { id: lead.id } }, { status: 201 });
}

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const statusParam = searchParams.get("status");
  const where =
    statusParam && (LEAD_STATUSES as readonly string[]).includes(statusParam)
      ? { status: statusParam }
      : {};

  const [leads, total] = await Promise.all([
    prisma.consultationLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.consultationLead.count({ where }),
  ]);

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      subjects: JSON.parse(l.subjects) as string[],
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const data: { status?: string; note?: string | null } = {};
  if (typeof body.status === "string") {
    if (!(LEAD_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "잘못된 상태값입니다." }, { status: 400 });
    }
    data.status = body.status;
  }
  if ("note" in body) {
    data.note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 2000)
        : null;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  try {
    const lead = await prisma.consultationLead.update({ where: { id }, data });
    return NextResponse.json({
      lead: {
        ...lead,
        subjects: JSON.parse(lead.subjects) as string[],
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }
}
