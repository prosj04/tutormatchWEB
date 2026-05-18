/**
 * React request-level cache for Teacher lookups.
 *
 * The teacher-portal layout, dashboard page, and students page each call
 * prisma.teacher.findUnique for the same userId within a single request.
 * Wrapping the query with React's cache() means only the first call hits
 * Postgres; subsequent calls within the same server-render return the cached
 * promise instantly.
 */
import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getTeacherByUserId = cache(async (userId: string) => {
  return prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      phone: true,
      subjects: true,
      approved: true,
      user: { select: { email: true } },
    },
  });
});
