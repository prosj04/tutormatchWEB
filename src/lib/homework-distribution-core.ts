// Pure (prisma-free) homework distribution helpers. Safe to import from client
// components for previews. Server logic re-exports these from
// `@/lib/homework-distribution`.

export function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day + offset, 12, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function distributeTasks(tasks: string[], days: 4 | 7) {
  const buckets = Array.from({ length: days }, () => [] as string[]);
  if (tasks.length === 0) return buckets;

  const activeDays = Math.min(days, tasks.length);
  // 균등 분배 후 나머지를 앞쪽 날짜부터 하나씩 얹어 "앞쪽이 살짝 더 많은" 단조 비증가
  // 분포를 보장한다. 각 활성 날짜에는 최소 1개씩 배분된다(base >= 1).
  const base = Math.floor(tasks.length / activeDays);
  const remainder = tasks.length % activeDays;

  let cursor = 0;
  for (let dayIndex = 0; dayIndex < activeDays; dayIndex += 1) {
    const count = base + (dayIndex < remainder ? 1 : 0);
    buckets[dayIndex].push(...tasks.slice(cursor, cursor + count));
    cursor += count;
  }

  return buckets;
}

/**
 * Parses a raw homework-tasks input (newline-separated string or string array)
 * into a cleaned task list. Mirrors the server route parser so previews match
 * what the API will actually distribute.
 */
export function parseTasks(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}
