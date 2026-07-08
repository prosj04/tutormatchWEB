/**
 * 로그인 브루트포스 방어 — 식별자(이메일/전화번호) 기준 시도 제한.
 * 인스턴스 메모리 기반: Vercel Fluid Compute는 인스턴스를 재사용하므로 단순
 * 무차별 대입은 충분히 차단되지만, 다중 인스턴스 분산 공격까지 막지는 못한다
 * (그 수준이 필요해지면 DB/Redis 백엔드로 교체).
 */

const WINDOW_MS = 10 * 60_000; // 실패 집계 윈도우
const MAX_FAILURES = 5; // 윈도우 내 허용 실패 횟수
const LOCK_MS = 15 * 60_000; // 초과 시 잠금 시간
const MAX_ENTRIES = 10_000; // 메모리 상한

type Entry = { count: number; windowStart: number; lockedUntil: number };

const entries = new Map<string, Entry>();

function prune(now: number) {
  if (entries.size < MAX_ENTRIES) return;
  entries.forEach((e, key) => {
    if (e.lockedUntil < now && now - e.windowStart > WINDOW_MS) entries.delete(key);
  });
}

export function loginRateLimitKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/** 잠금 상태면 true — 로그인 시도 자체를 거부한다. */
export function isLoginBlocked(key: string, now = Date.now()): boolean {
  const e = entries.get(key);
  if (!e) return false;
  if (e.lockedUntil > now) return true;
  if (now - e.windowStart > WINDOW_MS) {
    entries.delete(key);
    return false;
  }
  return false;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  prune(now);
  const e = entries.get(key);
  if (!e || now - e.windowStart > WINDOW_MS) {
    entries.set(key, { count: 1, windowStart: now, lockedUntil: 0 });
    return;
  }
  e.count += 1;
  if (e.count >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
  }
}

export function clearLoginFailures(key: string): void {
  entries.delete(key);
}
