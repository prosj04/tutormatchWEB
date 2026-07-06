export const LEAD_GRADES = [
  "예비 중1",
  "중1",
  "중2",
  "중3",
  "고1",
  "고2",
  "고3",
  "N수",
] as const;

export const LEAD_SUBJECTS = ["국어", "수학", "영어", "과학", "사회"] as const;

export const LEAD_STATUSES = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"] as const;

export const LEAD_STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  NEW: "신규",
  CONTACTED: "연락 완료",
  CONVERTED: "전환",
  CLOSED: "종료",
};

export const LEAD_TIME_SLOTS = [
  "10:00~11:00",
  "11:00~12:00",
  "12:00~13:00",
  "14:00~15:00",
  "15:00~16:00",
  "16:00~17:00",
  "17:00~18:00",
  "18:00~19:00",
] as const;
