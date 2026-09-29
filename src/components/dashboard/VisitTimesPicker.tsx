"use client";

import { Fragment, useMemo, useState } from "react";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import {
  countVisitSlots,
  formatDateKey,
  getNextWeekDates,
  VISIT_TIME_SLOTS,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

const WEEKDAY_HEADS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 선택 가능한 7일 구간을 옅은 액센트 면으로 표시하는 월간 미니 캘린더 */
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
    <div className="st-mini">
      {months.map(({ year, month }) => {
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (Date | null)[] = [];
        for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
        for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div key={`${year}-${month}`}>
            <p className="m">
              {year}년 {month + 1}월
            </p>
            <div className="st-mini-grid">
              {WEEKDAY_HEADS.map((w) => (
                <span key={w} className="wd">
                  {w}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={`e-${i}`} className="d" />;
                const key = formatDateKey(date);
                const inRange = rangeSet.has(key);
                const col = i % 7;
                const prevIn =
                  col > 0 && cells[i - 1] && rangeSet.has(formatDateKey(cells[i - 1] as Date));
                const nextIn =
                  col < 6 && cells[i + 1] && rangeSet.has(formatDateKey(cells[i + 1] as Date));
                const cls = [
                  "d",
                  inRange ? "in" : "",
                  inRange && !prevIn ? "lead" : "",
                  inRange && !nextIn ? "tail" : "",
                  key === todayKey ? "now" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <span key={key} className={cls}>
                    {date.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="st-mini-legend">
        <i aria-hidden />
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
    <div className="st-vp">
      {!compact ? (
        <>
          <h2 className="st-sec-title" style={{ marginBottom: "8px" }}>
            {title}
          </h2>
          <p className="st-lead" style={{ margin: 0 }}>
            {desc}
          </p>
          <p className="caption" style={{ marginTop: "6px" }}>
            {hintDays}
          </p>
        </>
      ) : null}

      <div className="st-vp-cols" style={{ marginTop: "22px" }}>
        <div className="st-vp-mini">
          <MiniMonthCalendar weekKeys={weekKeys} />
        </div>

        <div className="st-vp-scroll">
          <div className="st-vp-grid">
            <span className="st-vp-head" />
            {week.map((day) => (
              <div key={day.key} className="st-vp-head">
                <b>{day.label}</b>
                <span>({day.weekday})</span>
              </div>
            ))}
            {VISIT_TIME_SLOTS.map((slot) => (
              <Fragment key={slot}>
                <span className="st-vp-slot">{slot}</span>
                {week.map((day) => {
                  const on = selected[day.key]?.includes(slot) ?? false;
                  return (
                    <button
                      key={`${day.key}-${slot}`}
                      type="button"
                      onClick={() => toggle(day.key, slot)}
                      aria-pressed={on}
                      aria-label={`${day.label} (${day.weekday}) ${slot}`}
                      className="st-vp-cell"
                    >
                      {on ? "✓" : ""}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="st-vp-foot">
        <span className="c">{selectedTpl.replace(/\{count\}/g, String(total))}</span>
        <button
          type="button"
          disabled={submitting || total === 0}
          onClick={() => void onSubmit(selected)}
          className="btn pri"
        >
          {submitting ? btnSubmitting : btnSave}
        </button>
      </div>
    </div>
  );
}
