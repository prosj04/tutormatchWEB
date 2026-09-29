"use client";

import dynamic from "next/dynamic";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import { EMPTY_STATE_COPY } from "@/lib/student-journey";
import { formatCommentDate, formatPlanHeader } from "@/lib/study-plan-dates";
import type { ConsultationGoals } from "@/lib/consultation-report";

import { CopyPlanModal } from "./CopyPlanModal";
import { QuestionSection } from "./QuestionSection";
import type { Question, RecentPlanOption, StudyPlan, StudyTask } from "./types";

const TaskList = dynamic(
  () => import("./TaskList").then((mod) => mod.TaskList),
  {
    loading: () => (
      <p className="caption" style={{ padding: "18px 0" }}>
        할 일 목록 불러오는 중…
      </p>
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
  learningGoals?: ConsultationGoals | null;
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
  learningGoals = null,
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
    <>
      <div className="st-plan-head">
        <h1>{formatPlanHeader(selectedDate)}</h1>
        {plan ? (
          <button type="button" onClick={onOpenCopyModal} className="btn ghost sm">
            <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_copy_prev" type="text">
              {btnCopyPrev}
            </CmsEdit>
          </button>
        ) : (
          <button type="button" onClick={onCreatePlan} disabled={loading} className="btn pri sm">
            <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_add_plan" type="text">
              {btnAddPlan}
            </CmsEdit>
          </button>
        )}
      </div>

      {loading ? (
        <p className="caption" style={{ marginTop: "32px" }}>
          <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="loading" type="text">
            {loadingLabel}
          </CmsEdit>
        </p>
      ) : !plan ? (
        <div className="st-sec">
          <div className="st-none">
            <b>
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_no_plan" type="text">
                {emptyNoPlan}
              </CmsEdit>
            </b>
            <p>
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_hint" type="text">
                {emptyHint}
              </CmsEdit>
            </p>
            <button type="button" onClick={onOpenCopyModal} className="btn btn-ghost btn-sm">
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="btn_copy_prev" type="text">
                {btnCopyPrev}
              </CmsEdit>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="st-sec">
            <TaskList
              tasks={tasks}
              onReorder={onReorder}
              onToggle={onToggle}
              onTitleChange={onTitleChange}
              onDelete={onDelete}
              onAddTask={onAddTask}
            />
          </div>

          <section className="st-sec">
            {plan.comment ? (
              <div className="st-note">
                <span className="st-label">
                  <CmsEdit
                    active={isEditMode}
                    section="student_dashboard"
                    cmsKey="label_teacher_comment"
                    type="text"
                  >
                    {labelTeacherComment}
                  </CmsEdit>
                </span>
                <p>{plan.comment}</p>
                {plan.commentAt && <time>{formatCommentDate(plan.commentAt)}</time>}
              </div>
            ) : (
              <p className="caption">
                <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="empty_comment" type="text">
                  {emptyComment}
                </CmsEdit>
              </p>
            )}
          </section>
        </>
      )}

      {learningGoals ? (
        <section className="st-sec">
          <span className="st-label">학습 목표</span>
          <dl className="st-goals" style={{ marginTop: "12px" }}>
            {learningGoals.quantitative.length > 0 && (
              <div>
                <dt>정량 목표</dt>
                <dd>
                  <ul>
                    {learningGoals.quantitative.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {learningGoals.qualitative.length > 0 && (
              <div>
                <dt>정성 목표</dt>
                <dd>
                  <ul>
                    {learningGoals.qualitative.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </section>
      ) : null}

      <QuestionSection
        selectedDate={selectedDate}
        studentId={studentId}
        aiAnswerEnabled={aiAnswerEnabled}
        initialQuestions={initialQuestions}
        isEditMode={isEditMode}
      />

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
    </>
  );
}
