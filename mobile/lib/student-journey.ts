/** 학생 학습 단계 (웹 student-journey.ts 와 동일) */
export type StudentJourneyStage =
  | "PRE_SIGNUP"
  | "ONBOARDED"
  | "WAITING"
  | "ASSIGNED"
  | "MATCHING"
  | "ACTIVE";

export type ConsultationBookingStatus =
  | "WAITING"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

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
  ACTIVE: {
    label: "수업 진행 중",
    body: "배정된 선생님과 함께 학습을 이어가고 있어요.",
  },
};

/** 빈 값 표준 문구 (src/lib/student-journey.ts 와 동일) */
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
  tokensExhausted: {
    title: "이번 달 AI 즉답 토큰을 모두 사용했어요",
    description: "답변은 선생님이 직접 드려요.",
  },
} as const;

export type JourneySnapshot = {
  stage: StudentJourneyStage;
  activeTeacherCount: number;
  stageCopy: { label: string; body: string };
  consultation: {
    status: ConsultationBookingStatus;
    label: string;
    body: string;
    managerName: string | null;
    assignedAt: string | null;
  } | null;
};

/** 상담 추적 화면이 필요한 단계 */
export function needsConsultationTracking(stage: StudentJourneyStage): boolean {
  return stage === "WAITING" || stage === "ASSIGNED" || stage === "MATCHING";
}
