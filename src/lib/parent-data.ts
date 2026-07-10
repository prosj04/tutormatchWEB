import { prisma } from "@/lib/prisma";
import { createConsultationRequest } from "@/lib/student-enrollment";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** 학부모에 연결된 자녀 목록 + 요약(구독 상태·최신 리포트). 삭제된 학생 제외. */
export async function listParentChildren(parentId: string) {
  const links = await prisma.parentStudent.findMany({
    where: { parentId, student: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
    select: {
      linkedVia: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          grade: true,
          subjects: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { plan: true, status: true, periodEnd: true },
          },
          monthlyReports: {
            orderBy: { month: "desc" },
            take: 1,
            select: { month: true },
          },
        },
      },
    },
  });

  return links.map((link) => {
    const sub = link.student.subscriptions[0] ?? null;
    return {
      id: link.student.id,
      name: link.student.name,
      grade: link.student.grade,
      subjects: link.student.subjects,
      linkedVia: link.linkedVia,
      subscription: sub
        ? { plan: sub.plan, status: sub.status, periodEnd: sub.periodEnd }
        : null,
      latestReportMonth: link.student.monthlyReports[0]?.month ?? null,
    };
  });
}

/** 자녀 월간 리포트 목록(읽기). 호출부에서 연결 검증 선행. */
export async function listChildReports(studentId: string) {
  const reports = await prisma.monthlyReport.findMany({
    where: { studentId },
    orderBy: { month: "desc" },
    select: { month: true, summary: true, weakTypes: true, detail: true },
  });
  return reports.map((r) => ({
    month: r.month,
    summary: r.summary,
    weakTypes: parseJsonArray(r.weakTypes),
    detail: r.detail,
  }));
}

/** 자녀 결제/청구 이력(완료·환불 기록). 호출부에서 연결 검증 선행. */
export async function listChildPayments(studentId: string) {
  const payments = await prisma.paymentCompletion.findMany({
    where: { studentId, status: { in: ["COMPLETED", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      orderId: true,
      plan: true,
      status: true,
      amount: true,
      cashReceiptUrl: true,
      completedAt: true,
      createdAt: true,
    },
  });
  return payments;
}

export type ChildConsultationResult =
  | { ok: true; status: string; alreadyOpen: boolean }
  | { ok: false; status: number; error: string };

/**
 * 학부모가 특정 자녀 상담을 신청. 학생 조회 후 createConsultationRequest 위임.
 * 진행 중 상담/매칭이 있으면 alreadyOpen 처리(멱등).
 */
export async function requestChildConsultation(
  studentId: string,
  note: string,
): Promise<ChildConsultationResult> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, name: true, grade: true },
  });
  if (!student) {
    return { ok: false, status: 404, error: "학생을 찾을 수 없습니다." };
  }

  try {
    const booking = await createConsultationRequest({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      note,
    });
    return { ok: true, status: booking.status, alreadyOpen: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_ACTIVE" || msg === "ALREADY_MATCHING") {
      return { ok: true, status: "WAITING", alreadyOpen: true };
    }
    if (msg === "ALREADY_COMPLETED") {
      return { ok: true, status: "COMPLETED", alreadyOpen: true };
    }
    throw e;
  }
}

/** 학부모의 모든 연결 자녀 결제 이력을 자녀별로 묶어 반환. */
export async function listParentPayments(parentId: string) {
  const children = await listParentChildren(parentId);
  const result = [];
  for (const child of children) {
    result.push({
      studentId: child.id,
      studentName: child.name,
      payments: await listChildPayments(child.id),
    });
  }
  return result;
}
