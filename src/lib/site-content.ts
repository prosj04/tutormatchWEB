import { prisma } from "@/lib/prisma";

export type GroupedSiteContent = Record<string, Record<string, string>>;

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

export async function getGroupedSiteContent(): Promise<GroupedSiteContent> {
  const rows = await prisma.siteContent.findMany({
    where: { isActive: true },
    orderBy: [{ section: "asc" }, { order: "asc" }],
    select: { section: true, key: true, value: true },
  });
  return groupSiteContentRows(rows);
}
