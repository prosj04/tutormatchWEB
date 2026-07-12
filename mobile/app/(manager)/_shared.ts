/**
 * 매니저 앱 공용 타입·헬퍼.
 * API 계약은 src/app/api/mobile/manager/** 및 src/lib/manager-portal-data.ts와 1:1.
 */

export type MatchStatus = "PENDING_STUDENT_ACCEPT" | "ACTIVE";

export interface ManagerConsultationBooking {
  id: string;
  status: "WAITING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  managerNote?: string | null;
  preferredTimes: string[];
  visitConfirmedAt?: string | null;
  createdAt: string;
  timeAgo?: string;
  assignedAt?: string | null;
  assignedAgo?: string | null;
  student: {
    id: string;
    name: string;
    grade: string;
    subjects: string;
    phone: string;
    guardianPhone: string | null;
    region: string | null;
  };
  match?: {
    teacherId: string;
    teacherName: string;
    matchStatus: MatchStatus;
  } | null;
}

export interface BookingsResponse {
  bookings: ManagerConsultationBooking[];
}

export interface ManagerMatchingStudent {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  consultationNote: string | null;
  bookingId: string;
  currentTeacherName: string | null;
}

export interface ManagerMatchingTeacher {
  id: string;
  name: string;
  subjects: string;
  photoUrl: string | null;
  activeStudentCount: number;
}

export interface MatchingResponse {
  students: ManagerMatchingStudent[];
  teachers: ManagerMatchingTeacher[];
}

export interface MonitoringOverview {
  studentCount: number;
  avgCompletionRate: number;
  staleQuestions: number;
  atRiskCount: number;
}

export interface MonitoringStudentRow {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  completionRate: number;
  unansweredStale: number;
  statusLabel: string;
  statusClassName: string;
  /** 활성 또는 일시정지 구독 1건(매니저 일시정지/재개 대상). 없으면 null */
  subscription: { id: string; status: string; pausedUntil: string | null } | null;
}

export interface MonitoringResponse {
  overview: MonitoringOverview;
  students: MonitoringStudentRow[];
  weekStart: string;
  weekEnd: string;
}

export interface PendingTeacher {
  id: string;
  name: string;
  email: string | null;
  subjects: string;
  phone: string | null;
  createdAt: string;
}

export interface TeacherApprovalResponse {
  pendingTeachers: PendingTeacher[];
}

/** studentStatusBadge().className(Tailwind) → 시안 .bst tone */
export type BadgeTone = "acc" | "mut" | "warn";

export function badgeToneFromClassName(className: string): BadgeTone {
  if (className.includes("green")) return "acc";
  if (className.includes("orange") || className.includes("amber") || className.includes("red"))
    return "warn";
  return "mut";
}

export function studentLabel(name: string, grade: string): string {
  return [name, grade].filter(Boolean).join(" · ");
}
