/** 방문 상담 희망 시간대 (일자별) */
export const VISIT_TIME_SLOTS = [
  "09-11시",
  "11-13시",
  "13-15시",
  "15-17시",
  "17-19시",
  "19-21시",
] as const;

export type VisitTimesByDate = Record<string, string[]>;

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 오늘 포함 7일 */
export function getNextWeekDates(from = new Date()): { key: string; label: string; weekday: string }[] {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"] as const;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const key = formatDateKey(d);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return { key, label, weekday: weekdays[d.getDay()] };
  });
}

export function parseVisitTimes(value: string | null | undefined): VisitTimesByDate {
  if (!value || value === "[]") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: VisitTimesByDate = {};
    for (const [date, slots] of Object.entries(parsed)) {
      if (Array.isArray(slots)) {
        out[date] = slots.filter((s): s is string => typeof s === "string");
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeVisitTimes(map: VisitTimesByDate): string {
  return JSON.stringify(map);
}

export function countVisitSlots(map: VisitTimesByDate): number {
  return Object.values(map).reduce((sum, slots) => sum + slots.length, 0);
}

export function isValidVisitTimesPayload(
  map: VisitTimesByDate,
  allowedDates: string[],
): boolean {
  const allowed = new Set(allowedDates);
  const allowedSlots = new Set<string>(VISIT_TIME_SLOTS);
  for (const [date, slots] of Object.entries(map)) {
    if (!allowed.has(date)) return false;
    if (!Array.isArray(slots)) return false;
    for (const slot of slots) {
      if (!allowedSlots.has(slot)) return false;
    }
  }
  return true;
}

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "2026-07-11" | Date → "2026-7-11(토)". 문자열 입력은 서버 타임존과 무관하게 계산한다. */
export function formatDateWithWeekday(input: string | Date): string {
  if (typeof input === "string") {
    const d = new Date(`${input.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return input;
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}(${KO_WEEKDAYS[d.getUTCDay()]})`;
  }
  if (Number.isNaN(input.getTime())) return "";
  return `${input.getFullYear()}-${input.getMonth() + 1}-${input.getDate()}(${KO_WEEKDAYS[input.getDay()]})`;
}
