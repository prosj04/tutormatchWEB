import type { ConsultationBookingDto } from "@/lib/consultation-booking-dto";
import { prisma } from "@/lib/prisma";

/** 학생 학습 단계 (웹/앱 공통) */
export type StudentJourneyStage =
  | "PRE_SIGNUP"
  | "ONBOARDED"
  | "WAITING"
  | "ASSIGNED"
  | "MATCHING"
  | "MATCH_PENDING_ACCEPT"
  | "FIRST_LESSON_PENDING"
  | "ACTIVE";

export type ConsultationBookingStatus = ConsultationBookingDto["status"];

/** 상담 예약 DB 상태 → 학습 단계 매핑 */
export const CONSULTATION_STATUS_TO_STAGE: Record<
  ConsultationBookingStatus,
  StudentJourneyStage
> = {
  WAITING: "WAITING",
  ASSIGNED: "ASSIGNED",
  COMPLETED: "MATCHING",
  CANCELLED: "ONBOARDED",
};

/** 상담 상태 라벨·설명 (웹 CMS fallback / 앱 공통 카피) */
export const CONSULTATION_STATUS_COPY: Record<
  ConsultationBookingStatus,
  { label: string; body: string }
> = {
  WAITING: {
    label: "상담 접수·배정 대기",
    body: "매니저 배정 후 방문 상담 희망 시간을 안내해 주세요.",
  },
  ASSIGNED: {
    label: "매니저 배정 완료",
    body: "담당 매니저가 입력하신 방문 시간을 참고하여 연락드립니다.",
  },
  COMPLETED: {
    label: "선생님 매칭 진행",
    body: "상담이 완료되었어요. 곧 맞춤 선생님을 추천해 드릴게요.",
  },
  CANCELLED: {
    label: "상담 취소",
    body: "상담 신청이 취소되었습니다. 다시 신청하실 수 있어요.",
  },
};

/** 학습 단계 라벨 (타임라인·상태 카드용) */
export const JOURNEY_STAGE_COPY: Record<
  StudentJourneyStage,
  { label: string; body: string }
> = {
  PRE_SIGNUP: {
    label: "시작 전",
    body: "상담 신청 후 맞춤 학습을 시작할 수 있어요.",
  },
  ONBOARDED: {
    label: "상담 신청 전",
    body: "무료 상담을 신청하면 매니저가 연락드려요.",
  },
  WAITING: CONSULTATION_STATUS_COPY.WAITING,
  ASSIGNED: CONSULTATION_STATUS_COPY.ASSIGNED,
  MATCHING: {
    label: "선생님 매칭 진행",
    body: "상담 결과를 바탕으로 가장 잘 맞는 선생님을 찾고 있어요.",
  },
  MATCH_PENDING_ACCEPT: {
    label: "선생님 수락 대기",
    body: "배정된 선생님을 확인하고 수락 버튼을 눌러주세요. 수락 후 선생님이 첫 수업 일정을 설정합니다.",
  },
  FIRST_LESSON_PENDING: {
    label: "첫 수업 일정 조율 중",
    body: "선생님이 첫 수업 날짜를 설정하면 수업이 시작돼요.",
  },
  ACTIVE: {
    label: "수업 진행 중",
    body: "배정된 선생님과 함께 학습을 이어가고 있어요.",
  },
};

/** 빈 값 표준 문구 (웹/앱 동일) */
export const EMPTY_STATE_COPY = {
  noTodayLesson: {
    title: "오늘 예정된 수업이 없어요",
    description: "아직 배정된 수업이 없어요. 상담 진행 상태를 확인해 보세요.",
    cta: "상담 진행 상태 보기",
  },
  noUpcoming: {
    title: "예정된 일정이 아직 없어요",
    description: "다가오는 일정이 없어요. 매니저 배정 후 자동으로 표시됩니다.",
  },
  noWeekTasks: {
    title: "이번 주 과제가 아직 등록되지 않았어요",
    description: "선생님이 곧 학습 계획을 올려드립니다.",
  },
  noReport: {
    title: "첫 리포트 생성 전입니다",
    description: "보통 첫 수업 이후 월간 리포트가 생성돼요.",
  },
  noTeacher: {
    title: "아직 배정된 선생님이 없어요",
    description:
      "상담 후 선생님이 매칭되면 이곳에서 바로 질문하고 AI·선생님 답변을 받을 수 있어요.",
    cta: "상담 진행 상태 보기",
  },
  noQuestions: {
    title: "첫 질문을 남겨보세요",
    description: "모르는 문제를 내면 AI가 먼저 즉답하고, 선생님이 이어서 확인해 드려요.",
  },
  noPlan: {
    title: "오늘 계획이 아직 없습니다",
    description: "계획 추가 버튼을 눌러 시작하거나, 이전 날짜에서 복사해 보세요.",
    cta: "계획 추가",
  },
  tokensExhausted: {
    title: "이번 달 AI 즉답 토큰을 모두 사용했어요",
    description: "답변은 선생님이 직접 드려요.",
  },
} as const;

export type StudentJourneySnapshot = {
  stage: StudentJourneyStage;
  activeTeacherCount: number;
  consultation: {
    status: ConsultationBookingStatus;
    label: string;
    body: string;
    managerName: string | null;
    assignedAt: string | null;
  } | null;
};

/** DB 기준 학생 학습 단계 산출 */
export async function resolveStudentJourneyStage(
  studentId: string,
): Promise<StudentJourneyStage> {
  const [activeTeacherCount, pendingAcceptCount, firstLessonCount, booking] = await Promise.all([
    prisma.teacherStudent.count({
      where: { studentId, isActive: true },
    }),
    prisma.teacherStudent.count({
      where: {
        studentId,
        OR: [{ matchStatus: "PENDING_STUDENT_ACCEPT" }, { isActive: false }],
      },
    }),
    prisma.lesson.count({
      where: { studentId, status: { not: "CANCELLED" } },
    }),
    prisma.consultationBooking.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  if (activeTeacherCount > 0 && firstLessonCount > 0) return "ACTIVE";
  if (activeTeacherCount > 0) return "FIRST_LESSON_PENDING";
  if (pendingAcceptCount > 0) return "MATCH_PENDING_ACCEPT";
  if (!booking) return "ONBOARDED";
  return CONSULTATION_STATUS_TO_STAGE[booking.status as ConsultationBookingStatus];
}

/** 모바일·웹 상태 화면용 스냅샷 */
export async function getStudentJourneySnapshot(
  studentId: string,
): Promise<StudentJourneySnapshot> {
  const [stage, booking] = await Promise.all([
    resolveStudentJourneyStage(studentId),
    prisma.consultationBooking.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        assignedAt: true,
        manager: { select: { name: true } },
      },
    }),
  ]);

  const activeTeacherCount = await prisma.teacherStudent.count({
    where: { studentId, isActive: true },
  });

  const consultationStatus = booking?.status as ConsultationBookingStatus | undefined;

  return {
    stage,
    activeTeacherCount,
    consultation: consultationStatus
      ? {
          status: consultationStatus,
          label: CONSULTATION_STATUS_COPY[consultationStatus].label,
          body: CONSULTATION_STATUS_COPY[consultationStatus].body,
          managerName: booking?.manager?.name ?? null,
          assignedAt: booking?.assignedAt?.toISOString() ?? null,
        }
      : null,
  };
}
