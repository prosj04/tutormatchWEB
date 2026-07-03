import { prisma } from "@/lib/prisma";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { parseVisitTimes, type VisitTimesByDate } from "@/lib/visit-consultation";

export type ConsultationBookingDto = {
  id: string;
  status: "WAITING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  managerNote: string | null;
  preferredTimes: string[];
  visitPreferredTimes: VisitTimesByDate;
  createdAt: string;
  assignedAt: string | null;
  manager: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
};

export async function getConsultationBookingDto(
  studentId: string,
): Promise<ConsultationBookingDto | null> {
  const booking = await prisma.consultationBooking.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      manager: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!booking) return null;

  return {
    id: booking.id,
    status: booking.status as ConsultationBookingDto["status"],
    note: booking.note,
    managerNote: booking.managerNote,
    preferredTimes: [],
    visitPreferredTimes: parseVisitTimes(booking.visitPreferredTimes),
    createdAt: booking.createdAt.toISOString(),
    assignedAt: booking.assignedAt?.toISOString() ?? null,
    manager: booking.manager
      ? {
          id: booking.manager.id,
          name: booking.manager.name,
          photoUrl: getEffectivePhotoUrl(
            booking.manager.profile?.photoUrl,
            booking.manager.gender,
          ),
        }
      : null,
  };
}
