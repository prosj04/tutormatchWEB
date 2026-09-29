"use client";

import {
  formatDateKey,
  getCalendarCells,
  shiftMonth,
} from "@/lib/study-plan-dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type DashboardCalendarProps = {
  year: number;
  month: number;
  selectedDate: string;
  planDates: Set<string>;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
};

/** 오늘 날짜 키(로컬 기준) — 오늘 칸 표시에만 쓴다. */
function todayKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function DashboardCalendar({
  year,
  month,
  selectedDate,
  planDates,
  onSelectDate,
  onMonthChange,
}: DashboardCalendarProps) {
  const cells = getCalendarCells(year, month);
  const today = todayKey();

  function goPrev() {
    const next = shiftMonth(year, month, -1);
    onMonthChange(next.year, next.month);
  }

  function goNext() {
    const next = shiftMonth(year, month, 1);
    onMonthChange(next.year, next.month);
  }

  return (
    <div>
      <div className="st-cal-head">
        <button type="button" className="st-cal-nav" onClick={goPrev} aria-label="이전 달">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <p>
          {year}년 {month}월
        </p>
        <button type="button" className="st-cal-nav" onClick={goNext} aria-label="다음 달">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="st-cal-grid">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="st-cal-wd">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className="st-cal-cell void" aria-hidden />;
          }

          const dateKey = formatDateKey(year, month, day);
          const isSelected = dateKey === selectedDate;
          const hasPlan = planDates.has(dateKey);
          const isToday = dateKey === today;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              aria-current={isSelected ? "date" : undefined}
              className={`st-cal-cell${isSelected ? " sel" : ""}${isToday ? " today" : ""}`}
            >
              <span className="n">{day}</span>
              {hasPlan && <span className="pd" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
