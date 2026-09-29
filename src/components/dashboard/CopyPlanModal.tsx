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
    <div className="scrim on">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-plan-title"
      >
        <div className="m-b">
          <h3 id="copy-plan-title">{title}</h3>
          <p className="m-p">{desc}</p>

          <ul className="st-modal-list" style={{ marginTop: "20px" }}>
            {loading ? (
              <li className="st-modal-empty">{loadingLabel}</li>
            ) : options.length === 0 ? (
              <li className="st-modal-empty">{emptyLabel}</li>
            ) : (
              options.map((opt) => (
                <li key={opt.date}>
                  <button
                    type="button"
                    aria-pressed={selectedSource === opt.date}
                    onClick={() => onSelectSource(opt.date)}
                  >
                    <span>{formatCalendarDayLabel(opt.date)}</span>
                    <span className="c">
                      {taskCountTpl.replace(/\{count\}/g, String(opt.taskCount))}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="m-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className="btn pri" disabled={!selectedSource} onClick={onConfirm}>
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
