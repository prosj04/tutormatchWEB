"use client";

import { useMemo, useState } from "react";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import {
  countVisitSlots,
  formatDateKey,
  getNextWeekDates,
  VISIT_TIME_SLOTS,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

const WEEKDAY_HEADS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 선택 가능한 7일 구간을 초록 실선 박스로 표시하는 월간 미니 캘린더 */
function MiniMonthCalendar({ weekKeys }: { weekKeys: string[] }) {
  const rangeSet = useMemo(() => new Set(weekKeys), [weekKeys]);
  const todayKey = formatDateKey(new Date());

  const months = useMemo(() => {
    const first = new Date(weekKeys[0]);
    const last = new Date(weekKeys[weekKeys.length - 1]);
    const list: { year: number; month: number }[] = [
      { year: first.getFullYear(), month: first.getMonth() },
    ];
    if (last.getMonth() !== first.getMonth()) {
      list.push({ year: last.getFullYear(), month: last.getMonth() });
    }
    return list;
  }, [weekKeys]);

  return (
    <div className="flex flex-col gap-4">
      {months.map(({ year, month }) => {
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (Date | null)[] = [];
        for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
        for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div key={`${year}-${month}`}>
            <p className="text-center text-xs font-bold text-text-primary">
              {year}년 {month + 1}월
            </p>
            <div className="mt-2 grid grid-cols-7 text-center">
              {WEEKDAY_HEADS.map((w) => (
                <span key={w} className="pb-1 text-[10px] font-semibold text-text-muted">
                  {w}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={`e-${i}`} className="py-1" />;
                const key = formatDateKey(date);
                const inRange = rangeSet.has(key);
                const col = i % 7;
                const prevIn = col > 0 && cells[i - 1] && rangeSet.has(formatDateKey(cells[i - 1] as Date));
                const nextIn = col < 6 && cells[i + 1] && rangeSet.has(formatDateKey(cells[i + 1] as Date));
                const rangeCls = inRange
                  ? [
                      "border-y-2 border-primary bg-primary/5 text-text-primary font-bold",
                      prevIn ? "" : "border-l-2 rounded-l-lg",
                      nextIn ? "" : "border-r-2 rounded-r-lg",
                    ].join(" ")
                  : "text-text-secondary";
                return (
                  <span
                    key={key}
                    className={`py-1 text-[11px] leading-5 ${rangeCls} ${
                      key === todayKey ? "underline decoration-primary decoration-2 underline-offset-2" : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-center text-[11px] text-text-muted">
        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border-2 border-primary bg-primary/5 align-[-1px]" />
        선택 가능한 기간
      </p>
    </div>
  );
}

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
  const weekKeys = useMemo(() => week.map((d) => d.key), [week]);
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

      <div className="mt-4 flex flex-col gap-5 lg:flex-row">
        <div className="shrink-0 rounded-xl border border-gray-200 bg-background p-4 lg:w-[230px]">
          <MiniMonthCalendar weekKeys={weekKeys} />
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="grid min-w-[560px] gap-1 rounded-xl border border-gray-200 bg-background p-3 sm:min-w-[620px]"
            style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
          >
            <span />
            {week.map((day) => (
              <div key={day.key} className="pb-1 text-center">
                <p className="text-xs font-bold text-text-primary">{day.label}</p>
                <p className="text-[10px] font-medium text-text-muted">({day.weekday})</p>
              </div>
            ))}
            {VISIT_TIME_SLOTS.map((slot) => (
              <div key={slot} className="contents">
                <span className="flex items-center justify-end pr-2 text-[11px] font-semibold text-text-muted">
                  {slot}
                </span>
                {week.map((day) => {
                  const on = selected[day.key]?.includes(slot) ?? false;
                  return (
                    <button
                      key={`${day.key}-${slot}`}
                      type="button"
                      onClick={() => toggle(day.key, slot)}
                      aria-pressed={on}
                      aria-label={`${day.label} (${day.weekday}) ${slot}`}
                      className={`h-8 rounded-md text-[11px] font-semibold transition ${
                        on
                          ? "bg-primary text-white"
                          : "bg-white text-text-secondary hover:bg-primary/10"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
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
