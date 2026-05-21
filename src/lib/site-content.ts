import { cache } from "react";

import { prisma } from "@/lib/prisma";

export type GroupedSiteContent = Record<string, Record<string, string>>;

const EMPTY_SITE_CONTENT: GroupedSiteContent = {};

export function groupSiteContentRows(
  rows: Array<{ section: string; key: string; value: string }>,
): GroupedSiteContent {
  const grouped: GroupedSiteContent = {};
  for (const row of rows) {
    grouped[row.section] ??= {};
    grouped[row.section][row.key] = row.value;
  }
  return grouped;
}

/** 요청당 1회만 조회 (layout·page 중복 호출 방지) */
export const getGroupedSiteContent = cache(async (): Promise<GroupedSiteContent> => {
  try {
    const rows = await prisma.siteContent.findMany({
      where: { isActive: true },
      orderBy: [{ section: "asc" }, { order: "asc" }],
      select: { section: true, key: true, value: true },
    });
    return groupSiteContentRows(rows);
  } catch (error) {
    console.error("[getGroupedSiteContent]", error);
    return EMPTY_SITE_CONTENT;
  }
});
