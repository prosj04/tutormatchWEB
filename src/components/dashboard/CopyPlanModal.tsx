"use client";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import { formatCalendarDayLabel, formatPlanHeader } from "@/lib/study-plan-dates";

import type { RecentPlanOption } from "./types";

type CopyPlanModalProps = {
  open: boolean;
  targetDate: string;
  options: RecentPlanOption[];
  loading: boolean;
  selectedSource: string | null;
  onSelectSource: (date: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function CopyPlanModal({
  open,
  targetDate,
  options,
  loading,
  selectedSource,
  onSelectSource,
  onConfirm,
  onClose,
}: CopyPlanModalProps) {
  const title = usePortalCopy("student_copy_plan", "title", "이전 날짜에서 복사");
  const descTpl = usePortalCopy(
    "student_copy_plan",
    "desc_template",
    "{date}에 복사할 이전 날짜를 선택하세요. 할 일은 미완료 상태로 가져옵니다.",
  );
  const loadingLabel = usePortalCopy("student_copy_plan", "loading", "불러오는 중…");
  const emptyLabel = usePortalCopy(
    "student_copy_plan",
    "empty",
    "복사할 수 있는 이전 계획이 없습니다.",
  );
  const taskCountTpl = usePortalCopy("student_copy_plan", "task_count_template", "할 일 {count}개");
  const cancelLabel = usePortalCopy("student_copy_plan", "cancel", "취소");
  const applyLabel = usePortalCopy("student_copy_plan", "apply", "적용");

  if (!open) return null;

  const desc = descTpl.replace(/\{date\}/g, formatPlanHeader(targetDate));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-plan-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 id="copy-plan-title" className="text-lg font-bold text-text-primary">
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{desc}</p>

        <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {loading ? (
            <li className="py-4 text-center text-sm text-text-muted">{loadingLabel}</li>
          ) : options.length === 0 ? (
            <li className="py-4 text-center text-sm text-text-muted">{emptyLabel}</li>
          ) : (
            options.map((opt) => (
              <li key={opt.date}>
                <button
                  type="button"
                  onClick={() => onSelectSource(opt.date)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    selectedSource === opt.date
                      ? "border-primary bg-primary/5 font-medium text-primary"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-text-primary">{formatCalendarDayLabel(opt.date)}</span>
                  <span className="ml-2 text-text-muted">
                    {taskCountTpl.replace(/\{count\}/g, String(opt.taskCount))}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-text-secondary hover:bg-background"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!selectedSource}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
