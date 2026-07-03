import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import {
  PUBLIC_CMS_REVALIDATE_SECONDS,
  PUBLIC_TEACHERS_CACHE_TAG,
} from "@/lib/public-cms-cache";
import { timeAsync } from "@/lib/perf-timer";
import { prisma } from "@/lib/prisma";

type TeacherListRow = {
  id: string;
  name: string;
  subjects: string;
  bio: string;
  education: string;
  experience: string;
  gender: string | null;
  profile: {
    photoUrl: string | null;
    intro: string | null;
  } | null;
};

type TeacherDetailRow = {
  id: string;
  name: string;
  subjects: string;
  bio: string;
  education: string;
  experience: string;
  gender: string | null;
  profile: {
    photoUrl: string | null;
    intro: string | null;
    career: string | null;
    education: string | null;
    certificates: string | null;
  } | null;
};

const listTeacherSelect = {
  id: true,
  name: true,
  subjects: true,
  bio: true,
  education: true,
  experience: true,
  gender: true,
  profile: { select: { photoUrl: true, intro: true } },
} as const;

const detailTeacherSelect = {
  id: true,
  name: true,
  subjects: true,
  bio: true,
  education: true,
  experience: true,
  gender: true,
  profile: {
    select: {
      photoUrl: true,
      intro: true,
      career: true,
      education: true,
      certificates: true,
    },
  },
} as const;

/** 공개 강사진 목록: 수업 담당인 TEACHER만 노출, 데모용 [sample] 계정 제외 (상세 조회는 매니저 딥링크 호환을 위해 기존 role 유지) */
const publicTeacherListWhere: Prisma.TeacherWhereInput = {
  approved: true,
  user: { role: "TEACHER" },
  NOT: { name: { startsWith: "[sample]" } },
};

const getCachedPublicTeacherIds = unstable_cache(
  async () =>
    timeAsync("prisma.teacher.findMany.publicTeacherIds", () =>
      prisma.teacher.findMany({
        where: publicTeacherListWhere,
        orderBy: { name: "asc" },
        select: { id: true },
      }),
    ),
  ["public-teacher-ids"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [PUBLIC_TEACHERS_CACHE_TAG],
  },
);

const getCachedPublicTeachers = unstable_cache(
  async (): Promise<TeacherListRow[]> =>
    timeAsync("prisma.teacher.findMany.publicTeachers", () =>
      prisma.teacher.findMany({
        where: publicTeacherListWhere,
        orderBy: { name: "asc" },
        select: listTeacherSelect,
      }),
    ),
  ["public-teachers-list"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [PUBLIC_TEACHERS_CACHE_TAG],
  },
);

const getPublicTeacherByIdCached = cache(async (id: string): Promise<TeacherDetailRow | null> =>
  unstable_cache(
    async () =>
      timeAsync("prisma.teacher.findFirst.publicTeacherById", () =>
        prisma.teacher.findFirst({
          where: {
            id,
            approved: true,
            user: { role: { in: ["TEACHER", "MANAGER", "CHIEF_MANAGER"] } },
          },
          select: detailTeacherSelect,
        }),
      ),
    ["public-teacher-detail", id],
    {
      revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
      tags: [PUBLIC_TEACHERS_CACHE_TAG],
    },
  )(),
);

export async function getPublicTeacherIds() {
  const rows = await getCachedPublicTeacherIds();
  return rows.map((row) => row.id);
}

export async function getPublicTeachers() {
  return getCachedPublicTeachers();
}

export async function getPublicTeacherById(id: string) {
  return getPublicTeacherByIdCached(id);
}
