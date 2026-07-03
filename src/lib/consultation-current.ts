import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ConsultationBooking history model helpers.
 *
 * After the drop of `@unique` on `ConsultationBooking.studentId`, a student may
 * have many bookings over time. Two concepts replace the old singleton:
 *
 * - "Open" booking:   the (at most one) row whose status is WAITING or ASSIGNED.
 *                     Application code enforces the "at most one open per
 *                     student" invariant at creation time.
 * - "Current" booking: the open one if any, else the most recent by createdAt.
 *                     Used for display purposes (dashboard cards, DTOs, etc.).
 *
 * Both helpers accept an optional include/select shape so callers preserve
 * their existing query shapes.
 */

/** Statuses that count as "open" (in-progress) for a student. */
export const OPEN_BOOKING_STATUSES = ["WAITING", "ASSIGNED"] as const;
export type OpenBookingStatus = (typeof OPEN_BOOKING_STATUSES)[number];

type Extras = {
  include?: Prisma.ConsultationBookingInclude;
  select?: Prisma.ConsultationBookingSelect;
};

/**
 * Returns the student's open (WAITING/ASSIGNED) booking, or null.
 * There must be at most one; if multiple exist due to a data anomaly, the most
 * recent by createdAt is returned so callers still make forward progress.
 */
export async function getOpenBooking(
  studentId: string,
  extras: Extras = {},
) {
  const { include, select } = extras;
  const args = {
    where: {
      studentId,
      status: { in: OPEN_BOOKING_STATUSES as unknown as string[] },
    },
    orderBy: { createdAt: "desc" as const },
    ...(select ? { select } : include ? { include } : {}),
  } as Prisma.ConsultationBookingFindFirstArgs;
  return prisma.consultationBooking.findFirst(args);
}

/**
 * Returns the student's "current" booking: the open one if any, else the most
 * recent booking (any status). Returns null if the student has never had one.
 */
export async function getCurrentBooking(
  studentId: string,
  extras: Extras = {},
) {
  const { include, select } = extras;
  const args = {
    where: { studentId },
    orderBy: { createdAt: "desc" as const },
    ...(select ? { select } : include ? { include } : {}),
  } as Prisma.ConsultationBookingFindFirstArgs;
  return prisma.consultationBooking.findFirst(args);
}
