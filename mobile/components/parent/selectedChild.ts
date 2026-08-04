/**
 * 학부모 탭 간 공용 선택 자녀 상태(C2-6).
 * 파일명 앞의 언더스코어(_) 때문에 expo-router가 라우트로 취급하지 않음.
 *
 * 탭별 로컬 state 대신 모듈 스코프 store + useSyncExternalStore로 승격해,
 * 리포트/결제/상담 탭을 오가도 선택한 자녀가 유지되도록 한다.
 */
import { useCallback, useSyncExternalStore } from "react";

let selectedId: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  return selectedId;
}

/** 외부에서 선택 자녀를 설정. null이면 초기화. */
export function setSelectedChildId(id: string | null) {
  if (selectedId === id) return;
  selectedId = id;
  emit();
}

/**
 * 공용 선택 자녀 훅. availableIds를 넘기면, 현재 선택이 비어 있거나
 * 목록에 없을 때 첫 자녀로 자동 보정한다(탭 최초 진입·자녀 목록 변동 대응).
 */
export function useSelectedChildId(availableIds?: string[]): {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // 현재 선택이 유효하지 않으면 첫 유효 id로 보정(렌더 중 store 갱신은 지양, 파생값만 사용).
  const resolved =
    availableIds && availableIds.length > 0
      ? current && availableIds.includes(current)
        ? current
        : availableIds[0]!
      : current;

  // 파생 보정값이 store와 다르면 store를 동기화(다음 렌더 이전에 안정화).
  if (resolved !== current && resolved != null) {
    selectedId = resolved;
  }

  const setSelectedId = useCallback((id: string) => {
    setSelectedChildId(id);
  }, []);

  return { selectedId: resolved, setSelectedId };
}
