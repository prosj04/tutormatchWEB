import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";

function groupContent(
  rows: Array<{ section: string; key: string; value: string }>,
): Record<string, Record<string, string>> {
  const grouped: Record<string, Record<string, string>> = {};

  for (const row of rows) {
    grouped[row.section] ??= {};
    grouped[row.section][row.key] = row.value;
  }

  return grouped;
}

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const rows = await prisma.siteContent.findMany({
    orderBy: [{ section: "asc" }, { order: "asc" }, { key: "asc" }],
    select: { section: true, key: true, value: true },
  });

  return NextResponse.json(groupContent(rows));
}

export async function PATCH(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  let body: { section?: unknown; key?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.section !== "string" ||
    typeof body.key !== "string" ||
    typeof body.value !== "string"
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const row = await prisma.siteContent.upsert({
    where: {
      section_key: {
        section: body.section,
        key: body.key,
      },
    },
    create: {
      section: body.section,
      key: body.key,
      value: body.value,
      updatedBy: authResult.userId,
    },
    update: {
      value: body.value,
      updatedBy: authResult.userId,
    },
  });

  revalidatePublicCms(SITE_CONTENT_CACHE_TAG);
  return NextResponse.json(row);
}
