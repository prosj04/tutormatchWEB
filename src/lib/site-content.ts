import { unstable_cache } from "next/cache";
import { cache } from "react";

import { timeAsync } from "@/lib/perf-timer";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_CMS_REVALIDATE_SECONDS,
  SITE_CONTENT_CACHE_TAG,
} from "@/lib/public-cms-cache";

export type GroupedSiteContent = Record<string, Record<string, string>>;

const EMPTY_SITE_CONTENT: GroupedSiteContent = {};

function normalizeSections(sections: string[]) {
  return Array.from(
    new Set(
      sections
        .map((section) => section.trim())
        .filter(Boolean),
    ),
  ).sort();
}

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

const getCachedGroupedSiteContentBySections = cache(
  async (sectionsKey: string): Promise<GroupedSiteContent> =>
    unstable_cache(
      async () => {
        const sections = JSON.parse(sectionsKey) as string[];
        const rows = await timeAsync(
          "prisma.siteContent.findMany.sections",
          () =>
            prisma.siteContent.findMany({
              where: {
                isActive: true,
                section: { in: sections },
              },
              orderBy: [{ section: "asc" }, { order: "asc" }],
              select: { section: true, key: true, value: true },
            }),
          { sections },
        );

        return groupSiteContentRows(rows);
      },
      ["public-site-content-sections", sectionsKey],
      {
        revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
        tags: [SITE_CONTENT_CACHE_TAG],
      },
    )(),
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

export async function getGroupedSiteContentBySections(
  sections: string[],
): Promise<GroupedSiteContent> {
  const normalized = normalizeSections(sections);
  if (normalized.length === 0) return EMPTY_SITE_CONTENT;

  try {
    return await getCachedGroupedSiteContentBySections(JSON.stringify(normalized));
  } catch (error) {
    console.error("[getGroupedSiteContentBySections]", error);
    return EMPTY_SITE_CONTENT;
  }
}
