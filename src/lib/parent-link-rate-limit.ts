/**
 * 학부모 링크코드 시도 브루트포스 방어 — parentId 기준 시도 제한.
 * login-rate-limit.ts와 동일한 인스턴스 메모리 패턴(다중 인스턴스 분산 공격은
 * 막지 못하며, 그 수준이 필요해지면 DB/Redis 백엔드로 교체).
 */

const WINDOW_MS = 15 * 60_000; // 시도 집계·차단 윈도우
const MAX_ATTEMPTS = 10; // 윈도우 내 허용 시도 횟수
const MAX_ENTRIES = 10_000; // 메모리 상한

type Entry = { count: number; windowStart: number };

const entries = new Map<string, Entry>();

function prune(now: number) {
  if (entries.size < MAX_ENTRIES) return;
  entries.forEach((e, key) => {
    if (now - e.windowStart > WINDOW_MS) entries.delete(key);
  });
}

/**
 * 시도를 1회 기록하고, 윈도우 내 허용치를 초과하면 true(차단) 반환.
 * 초과 시 호출부에서 429 응답을 반환한다.
 */
export function parentLinkRateLimited(parentId: string, now = Date.now()): boolean {
  prune(now);
  const e = entries.get(parentId);
  if (!e || now - e.windowStart > WINDOW_MS) {
    entries.set(parentId, { count: 1, windowStart: now });
    return false;
  }
  e.count += 1;
  return e.count > MAX_ATTEMPTS;
}
