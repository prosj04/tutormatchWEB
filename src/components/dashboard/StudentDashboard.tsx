"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatConsultationDateLabel, parseDateKey } from "@/lib/study-plan-dates";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";
import type { ConsultationGoals } from "@/lib/consultation-report";

import { DashboardCalendar } from "./DashboardCalendar";
import { DashboardTopBar } from "./DashboardTopBar";
import { DailyPlanView } from "./DailyPlanView";
import type { Question, RecentPlanOption, StudyPlan, StudyTask } from "./types";

type ActiveMatch = {
  matchId: string;
  teacherName: string;
  subjects: string;
};

type CareLogItem = {
  id: string;
  type: "CONSULT" | "INTERVENTION" | "CHECK";
  note: string;
  createdAt: string;
};

type SatisfactionCheckin = {
  id: string;
  trigger: string;
  requestedAt: string;
};

const CARE_TYPE_LABELS: Record<string, string> = {
  CONSULT: "상담",
  INTERVENTION: "개입",
  CHECK: "점검",
};

type StudentDashboardProps = {
  studentName: string;
  studentId: string;
  initialDate: string;
  initialPlanDates: string[];
  initialPlan: StudyPlan | null;
  initialQuestions: Question[];
  aiAnswerEnabled: boolean;
  isEditMode?: boolean;
  learningGoals?: ConsultationGoals | null;
  activeMatch?: ActiveMatch | null;
  careLogs?: CareLogItem[];
  satisfactionCheckin?: SatisfactionCheckin | null;
  /** 선생님이 첫 수업 날짜를 정하는 중(FIRST_LESSON_PENDING) 안내 노출 여부 */
  firstLessonPending?: boolean;
};

export function StudentDashboard({
  studentName,
  studentId,
  initialDate,
  initialPlanDates,
  initialPlan,
  initialQuestions,
  aiAnswerEnabled,
  isEditMode = false,
  learningGoals = null,
  activeMatch = null,
  careLogs = [],
  satisfactionCheckin = null,
  firstLessonPending = false,
}: StudentDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const parsed = parseDateKey(selectedDate);
  const [calendarYear, setCalendarYear] = useState(parsed.year);
  const [calendarMonth, setCalendarMonth] = useState(parsed.month);
  const [planDates, setPlanDates] = useState<Set<string>>(
    () => new Set(initialPlanDates),
  );
  const [plan, setPlan] = useState<StudyPlan | null>(initialPlan);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = useCallback((msg: string, type: "ok" | "err" = "err") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyOptions, setCopyOptions] = useState<RecentPlanOption[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copySource, setCopySource] = useState<string | null>(null);
  const skipInitialSnapshotFetchRef = useRef(true);

  // Teacher change request state

  // Satisfaction checkin state
  const [checkinDismissed, setCheckinDismissed] = useState(false);
  const [checkinScore, setCheckinScore] = useState<number | null>(null);
  const [checkinComment, setCheckinComment] = useState("");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.webDashboardViewed);
  }, []);

  const monthKey = useMemo(
    () => `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`,
    [calendarYear, calendarMonth],
  );

  const fetchPlanSnapshot = useCallback(async (date: string, month: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/plans?month=${month}&date=${date}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        dates: string[];
        plan: StudyPlan | null;
      };
      setPlanDates(new Set(data.dates));
      setPlan(data.plan);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialSnapshotFetchRef.current) {
      skipInitialSnapshotFetchRef.current = false;
      return;
    }
    void fetchPlanSnapshot(selectedDate, monthKey);
  }, [selectedDate, monthKey, fetchPlanSnapshot]);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const { year, month } = parseDateKey(date);
    setCalendarYear(year);
    setCalendarMonth(month);
    setCalendarOpen(false);
  }

  function handleMonthChange(year: number, month: number) {
    setCalendarYear(year);
    setCalendarMonth(month);
  }

  async function ensurePlan(): Promise<StudyPlan | null> {
    if (plan) return plan;
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { plan: StudyPlan };
    setPlan(data.plan);
    setPlanDates((prev) => new Set(prev).add(selectedDate));
    return data.plan;
  }

  async function handleCreatePlan() {
    setLoading(true);
    try {
      await ensurePlan();
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask() {
    const current = await ensurePlan();
    if (!current) { showToast("할 일 추가에 실패했습니다."); return; }

    const res = await fetch(`/api/plans/${current.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    if (!res.ok) { showToast("할 일 추가에 실패했습니다."); return; }
    const data = (await res.json()) as { task: StudyTask };
    setPlan((p) =>
      p ? { ...p, tasks: [...p.tasks, data.task] } : p,
    );
  }

  async function patchTask(
    taskId: string,
    patch: { isDone?: boolean; title?: string; order?: number },
  ) {
    const res = await fetch(`/api/plans/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { showToast("저장에 실패했습니다. 다시 시도해 주세요."); return; }
    const data = (await res.json()) as { task: StudyTask };
    setPlan((p) =>
      p
        ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? data.task : t)) }
        : p,
    );
  }

  async function handleToggle(taskId: string, isDone: boolean) {
    await patchTask(taskId, { isDone });
  }

  async function handleTitleChange(taskId: string, title: string) {
    await patchTask(taskId, { title });
  }

  async function handleDelete(taskId: string) {
    const res = await fetch(`/api/plans/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) { showToast("삭제에 실패했습니다."); return; }
    setPlan((p) =>
      p ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p,
    );
  }

  async function handleReorder(reordered: StudyTask[]) {
    const snapshot = plan;
    setPlan((p) => (p ? { ...p, tasks: reordered } : p));
    const current = snapshot;
    if (!current) return;

    const res = await fetch(`/api/plans/${current.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: reordered.map((task) => task.id) }),
    });
    if (!res.ok) {
      setPlan(snapshot);
      return;
    }
    const data = (await res.json()) as { tasks: StudyTask[] };
    setPlan((p) => (p ? { ...p, tasks: data.tasks } : p));
  }

  async function handleOpenCopyModal() {
    setCopyModalOpen(true);
    setCopySource(null);
    setCopyLoading(true);
    try {
      const res = await fetch(
        `/api/plans?before=${selectedDate}&recent=7`,
      );
      if (!res.ok) { showToast("최근 계획을 불러오지 못했습니다."); return; }
      const data = (await res.json()) as { plans: RecentPlanOption[] };
      setCopyOptions(data.plans.filter((p) => p.taskCount > 0));
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleConfirmCopy() {
    if (!copySource) return;
    const res = await fetch("/api/plans/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceDate: copySource, targetDate: selectedDate }),
    });
    if (!res.ok) { showToast("계획 복사에 실패했습니다."); return; }
    const data = (await res.json()) as { plan: StudyPlan };
    setPlan(data.plan);
    setPlanDates((prev) => new Set(prev).add(selectedDate));
    setCopyModalOpen(false);
    setCopySource(null);
  }

  async function handleCheckinSubmit() {
    if (!satisfactionCheckin || checkinScore === null) return;
    setCheckinSubmitting(true);
    try {
      const res = await fetch(
        `/api/student/satisfaction-checkins/${satisfactionCheckin.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: checkinScore,
            comment: checkinComment.trim() || undefined,
          }),
        },
      );
      if (res.ok) {
        setCheckinDismissed(true);
        showToast("소중한 피드백 감사합니다.", "ok");
      } else {
        const data = (await res.json()) as { error?: string };
        showToast(data.error ?? "제출에 실패했습니다.");
      }
    } catch {
      showToast("제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setCheckinSubmitting(false);
    }
  }

  return (
    <>
      <div className="portal-shell st-dash" data-portal-content>
        <DashboardTopBar studentName={studentName} isEditMode={isEditMode} />

        <div className="portal-main portal-main--topbar-only">
          {firstLessonPending ? (
            <div className="banner warn" style={{ marginBottom: "28px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>선생님이 첫 수업 날짜를 정하는 중이에요. 곧 학습 일정이 채워질 거예요.</span>
            </div>
          ) : null}

          <div className="st-dash-grid">
            <aside className="st-aside">
              <DashboardCalendar
                year={calendarYear}
                month={calendarMonth}
                selectedDate={selectedDate}
                planDates={planDates}
                onSelectDate={handleSelectDate}
                onMonthChange={handleMonthChange}
              />

              {activeMatch ? (
                <div className="st-teacher">
                  <span className="st-label">담당 선생님</span>
                  <b>{activeMatch.teacherName} 선생님</b>
                  <p>{activeMatch.subjects}</p>
                </div>
              ) : null}

              {careLogs.length > 0 ? (
                <div>
                  <span className="st-label">매니저 케어 기록</span>
                  <ul className="st-care">
                    {careLogs.map((log) => (
                      <li key={log.id}>
                        <span className="t">{CARE_TYPE_LABELS[log.type] ?? log.type}</span>
                        <p>{log.note}</p>
                        <time dateTime={log.createdAt}>
                          {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <nav className="st-quick" aria-label="바로가기">
                <Link href="/questions">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  내 질문 목록
                </Link>
                <Link href="/payments">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                  결제·구독 내역
                </Link>
              </nav>
            </aside>

            <div className="st-body">
              <div className="st-datebar">
                <div className="st-datebar-row">
                  <div>
                    <span className="st-label">학습 일정</span>
                    <p className="d">{formatConsultationDateLabel(selectedDate)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((prev) => !prev)}
                    className="btn btn-ghost btn-sm"
                  >
                    {calendarOpen ? "달력 닫기" : "날짜 선택"}
                  </button>
                </div>
                {calendarOpen ? (
                  <div style={{ marginTop: "18px" }}>
                    <DashboardCalendar
                      year={calendarYear}
                      month={calendarMonth}
                      selectedDate={selectedDate}
                      planDates={planDates}
                      onSelectDate={handleSelectDate}
                      onMonthChange={handleMonthChange}
                    />
                  </div>
                ) : null}
              </div>

              {satisfactionCheckin && !checkinDismissed ? (
                <div className="st-checkin">
                  <b>첫 수업은 어떠셨나요?</b>
                  <p>솔직한 피드백이 더 나은 수업을 만듭니다.</p>
                  <div className="opts">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="opt"
                        aria-pressed={checkinScore === s}
                        onClick={() => setCheckinScore(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {checkinScore !== null ? (
                    <>
                      <textarea
                        value={checkinComment}
                        onChange={(e) => setCheckinComment(e.target.value.slice(0, 500))}
                        rows={2}
                        placeholder="코멘트 (선택)"
                        className="inp area"
                        style={{ marginTop: "14px" }}
                      />
                      <button
                        type="button"
                        disabled={checkinSubmitting}
                        onClick={() => void handleCheckinSubmit()}
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: "10px" }}
                      >
                        {checkinSubmitting ? "제출 중…" : "제출하기"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <DailyPlanView
                selectedDate={selectedDate}
                studentId={studentId}
                aiAnswerEnabled={aiAnswerEnabled}
                plan={plan}
                loading={loading}
                initialQuestions={initialQuestions}
                copyModalOpen={copyModalOpen}
                copyOptions={copyOptions}
                copyLoading={copyLoading}
                copySource={copySource}
                isEditMode={isEditMode}
                learningGoals={learningGoals}
                onCreatePlan={handleCreatePlan}
                onToggle={handleToggle}
                onTitleChange={handleTitleChange}
                onDelete={handleDelete}
                onAddTask={handleAddTask}
                onReorder={handleReorder}
                onOpenCopyModal={handleOpenCopyModal}
                onCloseCopyModal={() => setCopyModalOpen(false)}
                onSelectCopySource={setCopySource}
                onConfirmCopy={handleConfirmCopy}
              />
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <p role="status" className={`toast on${toast.type === "err" ? " st-toast-err" : ""}`}>
          {toast.msg}
        </p>
      )}
    </>
  );
}
