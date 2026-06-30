"use client";

import dynamic from "next/dynamic";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import { EMPTY_STATE_COPY } from "@/lib/student-journey";
import { formatCommentDate, formatPlanHeader } from "@/lib/study-plan-dates";

import { CopyPlanModal } from "./CopyPlanModal";
import { QuestionSection } from "./QuestionSection";
import type { Question, RecentPlanOption, StudyPlan, StudyTask } from "./types";

const TaskList = dynamic(
  () => import("./TaskList").then((mod) => mod.TaskList),
  {
    loading: () => (
      <p className="py-4 text-center text-sm text-text-muted">할 일 목록 불러오는 중…</p>
    ),
  },
);

type DailyPlanViewProps = {
  selectedDate: string;
  studentId: string;
  aiAnswerEnabled: boolean;
  plan: StudyPlan | null;
  loading: boolean;
  initialQuestions: Question[];
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
  isEditMode?: boolean;
};

export function DailyPlanView({
  selectedDate,
  studentId,
  aiAnswerEnabled,
  plan,
  loading,
  initialQuestions,
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
  isEditMode = false,
}: DailyPlanViewProps) {
  const tasks = plan?.tasks ?? [];

  const btnAddPlan = usePortalCopy("student_dashboard", "btn_add_plan", "계획 추가");
  const loadingLabel = usePortalCopy("student_dashboard", "loading", "불러오는 중…");
  const emptyNoPlan = usePortalCopy("student_dashboard", "empty_no_plan", EMPTY_STATE_COPY.noPlan.title);
  const emptyHint = usePortalCopy(
    "student_dashboard",
    "empty_hint",
    EMPTY_STATE_COPY.noPlan.description,
  );
  const btnCopyPrev = usePortalCopy("student_dashboard", "btn_copy_prev", "이전 날짜에서 복사");
  const labelTeacherComment = usePortalCopy("student_dashboard", "label_teacher_comment", "선생님 코멘트");
  const emptyComment = usePortalCopy("student_dashboard", "empty_comment", "아직 코멘트가 없습니다");

  return (
    <div className="min-h-[calc(100vh-var(--portal-header-h,3.5rem))] flex-1 overflow-y-auto bg-background p-3 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-text-primary sm:text-xl lg:text-2xl">
            {formatPlanHeader(selectedDate)}
          </h1>
          {!plan && (
            <button
              type="button"
              onClick={onCreatePlan}
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_add_plan" type="text">
                {btnAddPlan}
              </CmsEdit>
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-12 text-center text-sm text-text-muted">
            <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="loading" type="text">
              {loadingLabel}
            </CmsEdit>
          </p>
        ) : !plan ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center sm:p-10">
            <p className="text-sm text-text-secondary">
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_no_plan" type="text">
                {emptyNoPlan}
              </CmsEdit>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_hint" type="text">
                {emptyHint}
              </CmsEdit>
            </p>
            <button
              type="button"
              onClick={onOpenCopyModal}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_copy_prev" type="text">
                {btnCopyPrev}
              </CmsEdit>
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
                <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_copy_prev" type="text">
                  {btnCopyPrev}
                </CmsEdit>
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
                    <CmsEdit
                      active={isEditMode}
                      section="student_dashboard"
                      cmsKey="label_teacher_comment"
                      type="text"
                    >
                      {labelTeacherComment}
                    </CmsEdit>
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
                  <p className="text-sm text-text-muted">
                    <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_comment" type="text">
                      {emptyComment}
                    </CmsEdit>
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        <QuestionSection
          selectedDate={selectedDate}
          studentId={studentId}
          aiAnswerEnabled={aiAnswerEnabled}
          initialQuestions={initialQuestions}
          isEditMode={isEditMode}
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
