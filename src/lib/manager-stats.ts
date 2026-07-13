import { formatDateKey } from "@/lib/study-plan-dates";

export function getWeekRange(referenceDate?: string): { start: string; end: string } {
  const ref = referenceDate
    ? new Date(`${referenceDate}T12:00:00`)
    : new Date();
  const day = ref.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatDateKey(
      monday.getFullYear(),
      monday.getMonth() + 1,
      monday.getDate(),
    ),
    end: formatDateKey(
      sunday.getFullYear(),
      sunday.getMonth() + 1,
      sunday.getDate(),
    ),
  };
}

export function completionRate(done: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((done / total) * 100);
}

export function studentStatusBadge(rate: number, hasStaleQuestions: boolean) {
  if (hasStaleQuestions) {
    return { label: "답변필요", className: "bg-orange-100 text-orange-800" };
  }
  if (rate >= 70) return { label: "양호", className: "bg-green-100 text-green-800" };
  if (rate >= 50) return { label: "주의", className: "bg-amber-100 text-amber-800" };
  return { label: "위험", className: "bg-red-100 text-red-800" };
}
