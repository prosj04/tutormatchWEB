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
      include: { student: true, teacher: true },
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
    }
  });
}
