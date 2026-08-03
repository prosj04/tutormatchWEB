"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { parseDateKey } from "@/lib/study-plan-dates";
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

const CARE_TYPE_CLASSES: Record<string, string> = {
  CONSULT: "bg-blue-50 text-blue-700",
  INTERVENTION: "bg-orange-50 text-orange-700",
  CHECK: "bg-green-50 text-green-700",
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
    <div className="min-h-screen bg-background" data-portal-content>
      <DashboardTopBar studentName={studentName} isEditMode={isEditMode} />

      <div className="flex pt-[var(--portal-header-h,3.5rem)]">
        <aside className="fixed left-0 top-[var(--portal-header-h,3.5rem)] z-30 hidden h-[calc(100vh-var(--portal-header-h,3.5rem))] w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-surface p-3 sm:p-4 lg:block xl:w-60">
          <DashboardCalendar
            year={calendarYear}
            month={calendarMonth}
            selectedDate={selectedDate}
            planDates={planDates}
            onSelectDate={handleSelectDate}
            onMonthChange={handleMonthChange}
          />
          {activeMatch ? (
            <div className="mt-4 rounded-xl border border-gray-100 bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                담당 선생님
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {activeMatch.teacherName} 선생님
              </p>
              <p className="mt-0.5 truncate text-xs text-text-muted">{activeMatch.subjects}</p>
              {careLogs.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                매니저 케어 기록
              </p>
              <ul className="mt-2 space-y-2">
                {careLogs.map((log) => (
                  <li key={log.id}>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${CARE_TYPE_CLASSES[log.type] ?? "bg-gray-100 text-gray-700"}`}>
                      {CARE_TYPE_LABELS[log.type] ?? log.type}
                    </span>
                    <p className="mt-1 text-xs text-text-primary">{log.note}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
            </div>
          ) : null}
          <nav className="mt-4 space-y-1 border-t border-gray-100 pt-4">
            <Link
              href="/questions"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary"
            >
              <span className="text-base">❓</span>
              내 질문 목록
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary"
            >
              <span className="text-base">💳</span>
              결제·구독 내역
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 lg:ml-56 xl:ml-60">
          <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  학습 일정
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{selectedDate}</p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen((prev) => !prev)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-primary"
              >
                {calendarOpen ? "달력 닫기" : "날짜 선택"}
              </button>
            </div>
            {calendarOpen ? (
              <div className="mt-4">
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
            <div className="border-b border-primary/20 bg-primary/5 px-4 py-4">
              <div className="mx-auto max-w-2xl">
                <p className="text-sm font-semibold text-text-primary">
                  첫 수업은 어떠셨나요?
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  솔직한 피드백이 더 나은 수업을 만듭니다.
                </p>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCheckinScore(s)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        checkinScore === s
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 bg-white text-text-secondary hover:border-primary/50"
                      }`}
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
                      className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      disabled={checkinSubmitting}
                      onClick={() => void handleCheckinSubmit()}
                      className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {checkinSubmitting ? "제출 중…" : "제출하기"}
                    </button>
                  </>
                ) : null}
              </div>
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
        </main>
      </div>
    </div>
    {toast && (
      <p
        role="status"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-2.5 text-sm text-white shadow-lg transition-opacity${
          toast.type === "err" ? " bg-red-600" : " bg-gray-900"
        }`}
      >
        {toast.msg}
      </p>
    )}
    </>
  );
}
