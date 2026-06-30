import { createNotification } from "@/lib/notifications";
import { getChiefManager } from "@/lib/chief-manager";
import { getDefaultManager } from "@/lib/default-manager";
import { prisma } from "@/lib/prisma";
import { serializeVisitTimes } from "@/lib/visit-consultation";

type EnrollConsultationParams = {
  studentId: string;
  studentName: string;
  studentGrade: string;
  note?: string | null;
};

/** 상담 신청만 (매니저 미배정, 방문 시간 추후 입력) */
export async function createConsultationRequest({
  studentId,
  studentName,
  studentGrade,
  note,
}: EnrollConsultationParams) {
  const existing = await prisma.consultationBooking.findUnique({
    where: { studentId },
  });

  if (existing?.status === "WAITING" || existing?.status === "ASSIGNED") {
    throw new Error("ALREADY_ACTIVE");
  }
  if (existing?.status === "COMPLETED") {
    throw new Error("ALREADY_COMPLETED");
  }

  const booking = existing
    ? await prisma.consultationBooking.update({
        where: { id: existing.id },
        data: {
          managerId: null,
          preferredTimes: "[]",
          visitPreferredTimes: serializeVisitTimes({}),
          status: "WAITING",
          note: note ?? null,
          managerNote: null,
          assignedAt: null,
        },
      })
    : await prisma.consultationBooking.create({
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

  const existing = await prisma.consultationBooking.findUnique({
    where: { studentId },
  });

  const booking = existing
    ? await prisma.consultationBooking.update({
        where: { id: existing.id },
        data: {
          managerId: manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: existing.visitPreferredTimes || "{}",
          status: "ASSIGNED",
          note: note ?? existing.note,
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

/** 요금제 결제 완료 등 — Chief 매니저 즉시 배정 (없으면 getChiefManager 폴백) */
export async function assignChiefManagerToStudent({
  studentId,
  studentName,
  studentGrade,
  note,
}: EnrollConsultationParams) {
  const manager = await getChiefManager();
  const now = new Date();

  const existing = await prisma.consultationBooking.findUnique({
    where: { studentId },
  });

  const booking = existing
    ? await prisma.consultationBooking.update({
        where: { id: existing.id },
        data: {
          managerId: manager.id,
          preferredTimes: "[]",
          visitPreferredTimes: existing.visitPreferredTimes || "{}",
          status: "ASSIGNED",
          note: note ?? existing.note,
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
