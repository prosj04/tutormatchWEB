import { createNotification } from "@/lib/notifications";
import { getChiefManager } from "@/lib/chief-manager";
import { getDefaultManager } from "@/lib/default-manager";
import { OPEN_BOOKING_STATUSES } from "@/lib/consultation-current";
import { prisma } from "@/lib/prisma";
import { serializeVisitTimes } from "@/lib/visit-consultation";

type EnrollConsultationParams = {
  studentId: string;
  studentName: string;
  studentGrade: string;
  note?: string | null;
};

/**
 * Fetches the student's currently-open booking (WAITING/ASSIGNED) if any.
 * "Open" means an in-progress consultation. COMPLETED/CANCELLED are frozen
 * history rows and are ignored here so a new consultation can be requested.
 */
async function findOpenBookingByStudentId(studentId: string) {
  return prisma.consultationBooking.findFirst({
    where: {
      studentId,
      status: { in: [...OPEN_BOOKING_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** 상담 신청만 (매니저 미배정, 방문 시간 추후 입력) */
export async function createConsultationRequest({
  studentId,
  studentName,
  studentGrade,
  note,
}: EnrollConsultationParams) {
  // If the student already has an OPEN booking, refuse — one open at a time.
  // Historical COMPLETED/CANCELLED rows are ignored (allowing re-consultation).
  const openExisting = await findOpenBookingByStudentId(studentId);

  if (openExisting?.status === "WAITING" || openExisting?.status === "ASSIGNED") {
    throw new Error("ALREADY_ACTIVE");
  }

  // 상담이 COMPLETED로 종료돼 open booking이 없더라도, 이미 배정된(수락 대기/활성)
  // 선생님 매칭이 진행 중이면 새 상담 신청을 막는다 — 매니저 인박스에 유령 상담이
  // 생기고 진행 중인 매칭과 충돌하지 않도록.
  const liveMatch = await prisma.teacherStudent.findFirst({
    where: {
      studentId,
      matchStatus: { in: ["PENDING_STUDENT_ACCEPT", "ACTIVE"] },
    },
    select: { id: true },
  });
  if (liveMatch) {
    throw new Error("ALREADY_MATCHING");
  }

  const booking = await prisma.consultationBooking.create({
    data: {
      studentId,
      preferredTimes: "[]",
      visitPreferredTimes: serializeVisitTimes({}),
      status: "WAITING",
      note: note ?? null,
    },
  });

  const managers = await prisma.teacher.findMany({
    where: { approved: true, user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] } } },
    select: { userId: true },
  });

  await Promise.all(
    managers.map((m) =>
      createNotification({
        userId: m.userId,
        type: "NEW_STUDENT_WAITING",
        title: "새로운 상담 신청",
        body: `${studentName}(${studentGrade})님이 상담을 신청했습니다.`,
        relatedId: booking.id,
      }),
    ),
  );

  return booking;
}

/** 즉시 등록: 대표 매니저 배정 + 상담 예약 ASSIGNED */
export async function assignDefaultManagerToStudent({
  studentId,
  studentName,
  studentGrade,
  note,
}: EnrollConsultationParams) {
  const manager = await getDefaultManager();
  const now = new Date();

  const openExisting = await findOpenBookingByStudentId(studentId);

  const booking = openExisting
    ? await prisma.consultationBooking.update({
        where: { id: openExisting.id },
        data: {
          managerId: manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: openExisting.visitPreferredTimes || "{}",
          status: "ASSIGNED",
          note: note ?? openExisting.note,
          assignedAt: now,
        },
      })
    : await prisma.consultationBooking.create({
        data: {
          studentId,
          managerId: manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: serializeVisitTimes({}),
          status: "ASSIGNED",
          note: note ?? null,
          assignedAt: now,
        },
      });

  await prisma.managerStudent.upsert({
    where: {
      managerId_studentId: { managerId: manager.id, studentId },
    },
    create: { managerId: manager.id, studentId },
    update: {},
  });

  await createNotification({
    userId: manager.user.id,
    type: "BOOKING_CONFIRMED",
    title: "담당 학생 배정",
    body: `${studentName}(${studentGrade})님이 배정되었습니다.`,
    relatedId: booking.id,
  });

  return { booking, manager };
}

/**
 * 요금제 결제 완료 등 — Chief 매니저 즉시 배정.
 *
 * EC-8 semantics under the history model:
 * - If an OPEN booking exists (WAITING/ASSIGNED): update it in-place to ASSIGNED,
 *   preserving the existing managerId if any (never mutate a completed row).
 * - If NO open booking exists (latest was COMPLETED/CANCELLED, or none ever):
 *   CREATE a new booking. This is the re-consultation path — history is preserved.
 */
export async function assignChiefManagerToStudent({
  studentId,
  studentName,
  studentGrade,
  note,
}: EnrollConsultationParams) {
  const manager = await getChiefManager();
  const now = new Date();

  const openExisting = await findOpenBookingByStudentId(studentId);

  // Renewal payments must not spawn a new consultation: a student already in
  // active lessons has a manager and teacher, so keep their latest booking as-is.
  if (!openExisting) {
    const activeMatch = await prisma.teacherStudent.findFirst({
      where: { studentId, isActive: true },
      select: { id: true },
    });
    if (activeMatch) {
      const latestBooking = await prisma.consultationBooking.findFirst({
        where: { studentId },
        orderBy: { createdAt: "desc" },
      });
      if (latestBooking) {
        await prisma.managerStudent.upsert({
          where: {
            managerId_studentId: { managerId: manager.id, studentId },
          },
          create: { managerId: manager.id, studentId },
          update: {},
        });
        return { booking: latestBooking, manager };
      }
    }
  }

  const booking = openExisting
    ? await prisma.consultationBooking.update({
        where: { id: openExisting.id },
        data: {
          managerId: openExisting.managerId ?? manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: openExisting.visitPreferredTimes || "{}",
          status: "ASSIGNED",
          note: note ?? openExisting.note,
          assignedAt: now,
        },
      })
    : await prisma.consultationBooking.create({
        data: {
          studentId,
          managerId: manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: serializeVisitTimes({}),
          status: "ASSIGNED",
          note: note ?? null,
          assignedAt: now,
        },
      });

  await prisma.managerStudent.upsert({
    where: {
      managerId_studentId: { managerId: manager.id, studentId },
    },
    create: { managerId: manager.id, studentId },
    update: {},
  });

  await createNotification({
    userId: manager.user.id,
    type: "BOOKING_CONFIRMED",
    title: "담당 학생 배정",
    body: `${studentName}(${studentGrade})님이 배정되었습니다.`,
    relatedId: booking.id,
  });

  return { booking, manager };
}
