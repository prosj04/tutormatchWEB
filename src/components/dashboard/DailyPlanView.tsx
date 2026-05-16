"use client";

import { formatCommentDate, formatPlanHeader } from "@/lib/study-plan-dates";

import { CopyPlanModal } from "./CopyPlanModal";
import { QuestionSection } from "./QuestionSection";
import { TaskList } from "./TaskList";
import type { RecentPlanOption, StudyPlan, StudyTask } from "./types";

type DailyPlanViewProps = {
  selectedDate: string;
  studentId: string;
  aiAnswerEnabled: boolean;
  plan: StudyPlan | null;
  loading: boolean;
  copyModalOpen: boolean;
  copyOptions: RecentPlanOption[];
  copyLoading: boolean;
  copySource: string | null;
  onCreatePlan: () => void;
  onToggle: (taskId: string, isDone: boolean) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
  onReorder: (tasks: StudyTask[]) => void;
  onOpenCopyModal: () => void;
  onCloseCopyModal: () => void;
  onSelectCopySource: (date: string) => void;
  onConfirmCopy: () => void;
};

export function DailyPlanView({
  selectedDate,
  studentId,
  aiAnswerEnabled,
  plan,
  loading,
  copyModalOpen,
  copyOptions,
  copyLoading,
  copySource,
  onCreatePlan,
  onToggle,
  onTitleChange,
  onDelete,
  onAddTask,
  onReorder,
  onOpenCopyModal,
  onCloseCopyModal,
  onSelectCopySource,
  onConfirmCopy,
}: DailyPlanViewProps) {
  const tasks = plan?.tasks ?? [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-y-auto bg-background p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
            {formatPlanHeader(selectedDate)}
          </h1>
          {!plan && (
            <button
              type="button"
              onClick={onCreatePlan}
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              계획 추가
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-12 text-center text-sm text-text-muted">불러오는 중…</p>
        ) : !plan ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-surface p-10 text-center">
            <p className="text-sm text-text-secondary">이 날짜의 학습 계획이 없습니다.</p>
            <p className="mt-1 text-xs text-text-muted">
              계획 추가 버튼을 눌러 시작하거나, 이전 날짜에서 복사해 보세요.
            </p>
            <button
              type="button"
              onClick={onOpenCopyModal}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              이전 날짜에서 복사
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenCopyModal}
                className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-gray-300"
              >
                이전 날짜에서 복사
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-surface p-4 shadow-sm sm:p-6">
              <TaskList
                tasks={tasks}
                onReorder={onReorder}
                onToggle={onToggle}
                onTitleChange={onTitleChange}
                onDelete={onDelete}
                onAddTask={onAddTask}
              />
            </div>

            <section className="mt-8">
              {plan.comment ? (
                <div className="rounded-2xl border-2 border-primary/60 bg-primary/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    선생님 코멘트
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                    {plan.comment}
                  </p>
                  {plan.commentAt && (
                    <p className="mt-3 text-xs text-text-muted">
                      {formatCommentDate(plan.commentAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-surface p-5 text-center">
                  <p className="text-sm text-text-muted">아직 코멘트가 없습니다</p>
                </div>
              )}
            </section>
          </>
        )}

        <QuestionSection
          selectedDate={selectedDate}
          studentId={studentId}
          aiAnswerEnabled={aiAnswerEnabled}
        />
      </div>

      <CopyPlanModal
        open={copyModalOpen}
        targetDate={selectedDate}
        options={copyOptions}
        loading={copyLoading}
        selectedSource={copySource}
        onSelectSource={onSelectCopySource}
        onConfirm={onConfirmCopy}
        onClose={onCloseCopyModal}
      />
    </div>
  );
}
