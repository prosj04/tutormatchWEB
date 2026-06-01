export const PROCESS_PAGINATION_SLOT_COUNT = 5;
const CENTER_OFFSET = 2;

export type ProcessPaginationSlot =
  | { kind: "step"; stepIndex: number }
  | { kind: "empty"; key: string };

/** 5칸 고정: 가운데 강조, 범위 밖은 빈 칸(0), total≤5면 좌우 패딩으로 중앙 정렬 */
export function buildProcessPaginationSlots(
  activeIndex: number,
  total: number,
): ProcessPaginationSlot[] {
  if (total <= 0) return [];
  if (total === 1) return [{ kind: "step", stepIndex: 0 }];

  const slots: ProcessPaginationSlot[] = [];

  if (total <= PROCESS_PAGINATION_SLOT_COUNT) {
    // 예: 1단계 → ∅∅123, 5단계 → 12345 (활성은 가운데 정렬 우선, 끝에서는 창이 밀림)
    const leftPad = Math.max(
      0,
      Math.min(CENTER_OFFSET - activeIndex, total - 1 - activeIndex),
    );

    for (let slot = 0; slot < PROCESS_PAGINATION_SLOT_COUNT; slot += 1) {
      const stepIndex = slot - leftPad;
      if (stepIndex < 0 || stepIndex >= total) {
        slots.push({ kind: "empty", key: `pad-${slot}` });
      } else {
        slots.push({ kind: "step", stepIndex });
      }
    }
    return slots;
  }

  const start = Math.min(
    Math.max(activeIndex - CENTER_OFFSET, 0),
    total - PROCESS_PAGINATION_SLOT_COUNT,
  );

  for (let slot = 0; slot < PROCESS_PAGINATION_SLOT_COUNT; slot += 1) {
    slots.push({ kind: "step", stepIndex: start + slot });
  }

  return slots;
}

export function processPaginationSizeClass(distance: number, isActive: boolean): string {
  if (isActive) {
    return "text-xl text-neutral-100 sm:text-2xl md:text-3xl";
  }
  if (distance <= 1) {
    return "text-sm text-neutral-40 sm:text-base";
  }
  if (distance === 2) {
    return "text-xs text-neutral-50 sm:text-sm";
  }
  return "text-[10px] text-neutral-50 sm:text-xs";
}
