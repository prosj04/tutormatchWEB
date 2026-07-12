/**
 * 학부모 탭 공용 타입.
 * 파일명 앞의 언더스코어(_) 때문에 expo-router가 라우트로 취급하지 않음.
 */

export interface Subscription {
  plan: string;
  status: string;
  periodEnd: string | null;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
  linkedVia: "CODE" | "QR" | "MANAGER" | string;
  subscription: Subscription | null;
  latestReportMonth: string | null;
}

export interface ChildrenResponse {
  children: Child[];
}

export interface SubjectScore {
  subject: string;
  prev: number | null;
  curr: number;
}

export interface Report {
  month: string;
  summary: string;
  weakTypes: string[];
  detail: string;
  overallScore: number | null;
  prevScore: number | null;
  subjectScores: SubjectScore[];
  teacherComment: string | null;
  managerComment: string | null;
}

export interface ReportsResponse {
  reports: Report[];
}

export interface Payment {
  orderId: string;
  plan: string;
  status: string;
  amount: number;
  cashReceiptUrl: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PaymentChild {
  studentId: string;
  studentName: string;
  payments: Payment[];
}

export interface PaymentsResponse {
  children: PaymentChild[];
}

/** linkedVia → 한글 라벨 */
export function linkedViaLabel(via: string): string {
  if (via === "QR") return "QR로 연결";
  if (via === "MANAGER") return "매니저 연결";
  return "코드로 연결";
}
