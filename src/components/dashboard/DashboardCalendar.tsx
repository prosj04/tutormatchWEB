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

export function DashboardCalendar({
  year,
  month,
  selectedDate,
  planDates,
  onSelectDate,
  onMonthChange,
}: DashboardCalendarProps) {
  const cells = getCalendarCells(year, month);

  function goPrev() {
    const next = shiftMonth(year, month, -1);
    onMonthChange(next.year, next.month);
  }

  function goNext() {
    const next = shiftMonth(year, month, 1);
    onMonthChange(next.year, next.month);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-lg px-2 py-1 text-sm text-text-secondary hover:bg-background"
          aria-label="이전 달"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-text-primary">
          {year}년 {month}월
        </p>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg px-2 py-1 text-sm text-text-secondary hover:bg-background"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span
            key={label}
            className={`py-1.5 text-xs font-medium sm:text-sm ${
              i === 0 ? "text-accent" : i === 6 ? "text-primary" : "text-text-muted"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = formatDateKey(year, month, day);
          const isSelected = dateKey === selectedDate;
          const hasPlan = planDates.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`relative flex min-h-[2.25rem] flex-col items-center justify-center rounded-lg text-xs sm:min-h-[2.5rem] sm:text-sm transition ${
                isSelected
                  ? "bg-primary font-semibold text-white"
                  : "text-text-primary hover:bg-background"
              }`}
            >
              {day}
              {hasPlan && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-white" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
