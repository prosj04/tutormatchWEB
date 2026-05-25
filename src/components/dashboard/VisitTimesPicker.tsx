"use client";

import { useMemo, useState } from "react";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import {
  countVisitSlots,
  getNextWeekDates,
  VISIT_TIME_SLOTS,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

type VisitTimesPickerProps = {
  initial?: VisitTimesByDate;
  onSubmit: (times: VisitTimesByDate) => Promise<void>;
  submitting?: boolean;
  compact?: boolean;
};

export function VisitTimesPicker({
  initial = {},
  onSubmit,
  submitting = false,
  compact = false,
}: VisitTimesPickerProps) {
  const week = useMemo(() => getNextWeekDates(), []);
  const [selected, setSelected] = useState<VisitTimesByDate>(initial);

  const title = usePortalCopy("visit_picker", "title", "방문 상담 희망 시간대 입력");
  const desc = usePortalCopy(
    "visit_picker",
    "desc",
    "방문 상담 가능 시간대를 입력해주시면 참고하여 연락드리겠습니다.",
  );
  const hintDays = usePortalCopy("visit_picker", "hint_days", "오늘부터 7일간 선택 가능합니다.");
  const selectedTpl = usePortalCopy("visit_picker", "selected_count", "선택한 시간대: {count}개");
  const btnSave = usePortalCopy("visit_picker", "btn_save", "방문 상담 희망 시간 저장");
  const btnSubmitting = usePortalCopy("visit_picker", "btn_submitting", "저장 중...");

  function toggle(date: string, slot: string) {
    setSelected((prev) => {
      const daySlots = prev[date] ?? [];
      const next = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      const copy = { ...prev };
      if (next.length === 0) delete copy[date];
      else copy[date] = next;
      return copy;
    });
  }

  const total = countVisitSlots(selected);

  return (
    <div className={compact ? "" : "rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm"}>
      {!compact ? (
        <>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{desc}</p>
          <p className="mt-1 text-xs text-text-muted">{hintDays}</p>
        </>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[560px] gap-2 sm:min-w-[640px] sm:gap-3">
          {week.map((day) => (
            <div
              key={day.key}
              className="flex-1 rounded-xl border border-gray-200 bg-background p-3"
            >
              <p className="text-center text-xs font-bold text-text-primary">
                {day.label}
              </p>
              <p className="text-center text-[10px] font-medium text-text-muted">
                ({day.weekday})
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {VISIT_TIME_SLOTS.map((slot) => {
                  const on = selected[day.key]?.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggle(day.key, slot)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                        on
                          ? "bg-primary text-white"
                          : "bg-white text-text-secondary hover:bg-primary/10"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        {selectedTpl.replace(/\{count\}/g, String(total))}
      </p>

      <button
        type="button"
        disabled={submitting || total === 0}
        onClick={() => void onSubmit(selected)}
        className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? btnSubmitting : btnSave}
      </button>
    </div>
  );
}
