import { prisma } from "@/lib/prisma";

/**
 * Soft-delete a user account per App Store requirement 5.1.1(v).
 * Sets deletedAt on User and Student, anonymizes PII, deactivates related state.
 * Preserves payment/subscription records per retention law (onDelete: Restrict).
 */
export async function softDeleteUser(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Find the user
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { student: true, teacher: true, parent: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Anonymize User record
    const anonymizedEmail = `deleted-${userId}@removed.local`;
    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        deletedAt: new Date(),
      },
    });

    // If student record exists, anonymize and soft-delete it
    if (user.student) {
      await tx.student.update({
        where: { id: user.student.id },
        data: {
          name: "탈퇴회원",
          phone: "",
          guardianPhone: null,
          gender: null,
          deletedAt: new Date(),
        },
      });

      // Deactivate active matches and cancel ones still awaiting acceptance
      await tx.teacherStudent.updateMany({
        where: {
          studentId: user.student.id,
          OR: [{ isActive: true }, { matchStatus: "PENDING_STUDENT_ACCEPT" }],
        },
        data: {
          isActive: false,
          matchStatus: "CANCELLED",
        },
      });

      // Cancel active subscriptions
      await tx.subscription.updateMany({
        where: { studentId: user.student.id, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });

      // 예정된 수업도 취소 — 앱에 유령 수업/참여 링크가 남지 않도록.
      await tx.lesson.updateMany({
        where: { studentId: user.student.id, status: "SCHEDULED" },
        data: { status: "CANCELLED", cancelledBy: "STUDENT" },
      });

      // 대기/배정 상담 booking도 취소 — 매니저 인박스에 유령 상담이 남지 않도록.
      await tx.consultationBooking.updateMany({
        where: {
          studentId: user.student.id,
          status: { in: ["WAITING", "ASSIGNED"] },
        },
        data: { status: "CANCELLED" },
      });
    }

    // If teacher record exists, anonymize it
    if (user.teacher) {
      await tx.teacher.update({
        where: { id: user.teacher.id },
        data: {
          name: "탈퇴한강사",
          phone: "",
          bio: "",
          education: "",
          experience: "",
          gender: null,
          approved: false,
        },
      });

      // 학생 branch와 대칭: 탈퇴 강사의 활성/수락대기 매칭을 정리해
      // 학생이 '탈퇴한강사'와의 매칭에 묶이지 않도록 한다.
      await tx.teacherStudent.updateMany({
        where: {
          teacherId: user.teacher.id,
          OR: [{ isActive: true }, { matchStatus: "PENDING_STUDENT_ACCEPT" }],
        },
        data: {
          isActive: false,
          matchStatus: "CANCELLED",
        },
      });

      // 탈퇴 강사의 예정된 수업도 취소 — 학생 앱에 '탈퇴한강사' 수업이 남지 않도록.
      await tx.lesson.updateMany({
        where: { teacherId: user.teacher.id, status: "SCHEDULED" },
        data: { status: "CANCELLED", cancelledBy: "TEACHER" },
      });
    }

    // If parent record exists, anonymize and soft-delete it
    if (user.parent) {
      await tx.parent.update({
        where: { id: user.parent.id },
        data: {
          name: "탈퇴 학부모",
          phone: "", // 스키마상 non-null이므로 빈 문자열로 익명화
          deletedAt: new Date(),
        },
      });

      // 자녀 연결 해제 — 탈퇴 학부모가 자녀 데이터에 계속 접근하지 않도록.
      await tx.parentStudent.deleteMany({
        where: { parentId: user.parent.id },
      });
    }
  });
}
