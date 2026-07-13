/**
 * 범용 요청 빈도 제한 — bucket:key 단위 고정 윈도우 카운트.
 * 인스턴스 메모리 기반 — 다중 인스턴스 분산 공격 방어는 아님 (필요 시 DB/Redis 백엔드로 교체).
 */

const MAX_ENTRIES = 10_000; // 메모리 상한

type Entry = { count: number; resetAt: number };

const entries = new Map<string, Entry>();

function prune(now: number) {
  if (entries.size < MAX_ENTRIES) return;
  entries.forEach((e, key) => {
    if (e.resetAt <= now) entries.delete(key);
  });
}

/** 윈도우 내 max회까지 허용(true), 초과 시 false. */
export function checkRateLimit(
  bucket: string,
  key: string,
  opts: { windowMs: number; max: number },
): boolean {
  const now = Date.now();
  prune(now);
  const mapKey = `${bucket}:${key}`;
  const e = entries.get(mapKey);
  if (!e || e.resetAt <= now) {
    entries.set(mapKey, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  e.count += 1;
  return e.count <= opts.max;
}

/** 프록시 뒤 클라이언트 IP — x-forwarded-for 첫 항목, 없으면 "unknown". */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
