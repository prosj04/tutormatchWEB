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

export function shiftWeekStart(weekStart: string, deltaWeeks: number): string {
  const d = new Date(`${weekStart}T12:00:00`);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
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

export function generateRepeatSlotDates(
  anchorDate: string,
  weekdays: number[],
  weeks: number,
): string[] {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const day = anchor.getDay();
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - day);

  const dates = new Set<string>();
  for (let w = 0; w < weeks; w++) {
    for (const wd of weekdays) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + w * 7 + wd);
      dates.add(
        formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      );
    }
  }
  return Array.from(dates).sort();
}
