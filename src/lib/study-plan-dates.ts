const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function parseDateKey(date: string): { year: number; month: number; day: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function formatPlanHeader(date: string): string {
  const { year, month, day } = parseDateKey(date);
  return `${year}년 ${month}월 ${day}일 학습 계획`;
}

export function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDoneTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 완료`;
}

export function formatCalendarDayLabel(date: string): string {
  const { month, day } = parseDateKey(date);
  const weekday = WEEKDAYS_KO[new Date(date + "T12:00:00").getDay()];
  return `${month}/${day} (${weekday})`;
}

export function formatConsultationDateLabel(date: string): string {
  const { year, month, day } = parseDateKey(date);
  const weekday = WEEKDAYS_KO[new Date(date + "T12:00:00").getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

export function todayDateKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return cells;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
