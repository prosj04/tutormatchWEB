import { unstable_cache } from "next/cache";

import { timeAsync } from "@/lib/perf-timer";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_CMS_REVALIDATE_SECONDS,
  SITE_CONTENT_CACHE_TAG,
} from "@/lib/public-cms-cache";

export type GroupedSiteContent = Record<string, Record<string, string>>;

const EMPTY_SITE_CONTENT: GroupedSiteContent = {};

const getCachedGroupedSiteContent = unstable_cache(
  async (): Promise<GroupedSiteContent> => {
    const rows = await timeAsync("prisma.siteContent.findMany", () =>
      prisma.siteContent.findMany({
        where: { isActive: true },
        orderBy: [{ section: "asc" }, { order: "asc" }],
        select: { section: true, key: true, value: true },
      }),
    );

    return groupSiteContentRows(rows);
  },
  ["public-site-content"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [SITE_CONTENT_CACHE_TAG],
  },
);

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

/** 공개 CMS는 ISR 캐시 + 태그 무효화로 조회 비용을 줄인다. */
export async function getGroupedSiteContent(): Promise<GroupedSiteContent> {
  try {
    return await getCachedGroupedSiteContent();
  } catch (error) {
    console.error("[getGroupedSiteContent]", error);
    return EMPTY_SITE_CONTENT;
  }
}
