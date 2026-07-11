"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatDateKey, formatPlanHeader } from "@/lib/study-plan-dates";

import { TeacherStudentPicker } from "./TeacherStudentPicker";
import type {
  HomeworkTemplate,
  StudentListItem,
  StudyPlanItem,
} from "./teacher-students-types";

type TeacherPlanClientProps = {
  initialStudents: StudentListItem[];
};

/** 앞쪽 요일 우선 · 단조 감소 · 하루 최소 1개 — wkbars 미리보기용 분배 */
function distributeCounts(total: number, days: number): number[] {
  if (days <= 0) return [];
  const base = Math.floor(total / days);
  let remainder = total - base * days;
  const counts = Array.from({ length: days }, () => base);
  for (let i = 0; i < days && remainder > 0; i += 1) {
    counts[i] += 1;
    remainder -= 1;
  }
  return counts.map((c) => Math.max(1, c));
}

export function TeacherPlanClient({ initialStudents }: TeacherPlanClientProps) {
  const [students] = useState<StudentListItem[]>(initialStudents);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStudents[0]?.id ?? null,
  );
  const selected = students.find((s) => s.id === selectedId) ?? null;

  const now = new Date();
  const [selectedDate] = useState(
    formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate()),
  );

  const [homeworkTasks, setHomeworkTasks] = useState("");
  const [homeworkDays, setHomeworkDays] = useState<4 | 7>(7);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [savingHomework, setSavingHomework] = useState(false);
  const [homeworkMessage, setHomeworkMessage] = useState<string | null>(null);

  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [plan, setPlan] = useState<StudyPlanItem | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/homework-templates");
      if (!res.ok) return;
      const data = (await res.json()) as { templates: HomeworkTemplate[] };
      setTemplates(data.templates);
    } catch {
      // ignore
    }
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!selectedId) return;
    setPlan(null);
    setCommentDraft("");
    try {
      const monthKey = selectedDate.slice(0, 7);
      const res = await fetch(
        `/api/teacher/students/${selectedId}/plans?month=${monthKey}&date=${selectedDate}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { plan: StudyPlanItem | null };
      setPlan(data.plan);
      setCommentDraft(data.plan?.comment ?? "");
    } catch {
      // ignore
    }
  }, [selectedId, selectedDate]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  const previewCounts = useMemo(() => {
    const total = homeworkTasks
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean).length;
    const days = homeworkDays;
    const counts = distributeCounts(total || days, days);
    const max = Math.max(...counts, 1);
    return { counts, max, total };
  }, [homeworkTasks, homeworkDays]);

  async function handleDistribute() {
    if (!selectedId || !homeworkTasks.trim()) return;
    setSavingHomework(true);
    setHomeworkMessage(null);
    try {
      const res = await fetch(`/api/teacher/students/${selectedId}/homework-distribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selectedDate,
          days: homeworkDays,
          tasks: homeworkTasks,
          repeatWeeks,
        }),
      });
      if (!res.ok) {
        setHomeworkMessage("숙제 자동 분배에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { dates: string[] };
      setHomeworkTasks("");
      setHomeworkMessage(`${data.dates.length}일치 숙제가 생성되었습니다.`);
    } finally {
      setSavingHomework(false);
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !homeworkTasks.trim()) return;
    setSavingTemplate(true);
    setHomeworkMessage(null);
    try {
      const res = await fetch("/api/teacher/homework-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateName,
          defaultDays: homeworkDays,
          tasks: homeworkTasks,
        }),
      });
      if (!res.ok) {
        setHomeworkMessage("템플릿 저장에 실패했습니다.");
        return;
      }
      setTemplateName("");
      setHomeworkMessage("템플릿이 저장되었습니다.");
      await fetchTemplates();
    } finally {
      setSavingTemplate(false);
    }
  }

  function handleLoadTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setHomeworkTasks(template.tasks);
    setHomeworkDays(template.defaultDays);
    setHomeworkMessage(`템플릿 "${template.title}"을 불러왔습니다.`);
  }

  async function handleSaveComment() {
    if (!plan || !commentDraft.trim()) return;
    setSavingComment(true);
    setCommentMessage(null);
    try {
      const res = await fetch(`/api/teacher/plans/${plan.id}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentDraft }),
      });
      if (!res.ok) {
        setCommentMessage("코멘트 저장에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { plan: StudyPlanItem };
      setPlan(data.plan);
      setCommentDraft(data.plan.comment ?? "");
      setCommentMessage("코멘트가 저장되었습니다. (리포트에 반영)");
    } finally {
      setSavingComment(false);
    }
  }

  const weekdayShort = ["일", "월", "화", "수", "목", "금", "토"];
  const startWeekday = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  })();

  return (
    <section className="page on" id="pg-plan">
      <div className="crumb">/teacher-portal/dashboard/plans</div>
      <h1>진도·숙제{selected ? ` — ${selected.name}` : ""}</h1>
      <p className="sub">주간 숙제를 한 번에 입력하면 요일별로 자동 분배됩니다.</p>

      {students.length === 0 ? (
        <div className="sec card">
          <div className="row">
            <div className="g">
              <p>배정된 학생이 없습니다.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="sec grid2">
            <div className="card" style={{ padding: "20px" }}>
              <TeacherStudentPicker
                students={students}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <div className="field">
                <label>숙제 총량 (한 줄에 하나씩)</label>
                <textarea
                  className="inp area filled"
                  value={homeworkTasks}
                  onChange={(e) => setHomeworkTasks(e.target.value)}
                  placeholder={"미적분 5단원 문제 1–40\n오답노트 8문항"}
                />
              </div>
              <div className="field">
                <label>분배 기간</label>
                <div className="opts">
                  <button
                    type="button"
                    className="opt"
                    aria-pressed={homeworkDays === 7}
                    onClick={() => setHomeworkDays(7)}
                  >
                    1주 (월–금)
                  </button>
                  <button
                    type="button"
                    className="opt"
                    aria-pressed={homeworkDays === 4}
                    onClick={() => setHomeworkDays(4)}
                  >
                    4일
                  </button>
                </div>
              </div>
              <div className="field">
                <label>반복</label>
                <div className="opts">
                  {[1, 2, 4].map((week) => (
                    <button
                      key={week}
                      type="button"
                      className="opt"
                      aria-pressed={repeatWeeks === week}
                      onClick={() => setRepeatWeeks(week)}
                    >
                      {week === 1 ? "반복 없음" : `${week}주`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn pri"
                  disabled={savingHomework || !homeworkTasks.trim() || !selectedId}
                  onClick={() => void handleDistribute()}
                >
                  {savingHomework ? "분배 중…" : "숙제 분배 확정"}
                </button>
                <button
                  type="button"
                  className="btn sec"
                  disabled={savingTemplate || !templateName.trim() || !homeworkTasks.trim()}
                  onClick={() => void handleSaveTemplate()}
                >
                  {savingTemplate ? "저장 중…" : "템플릿 저장"}
                </button>
                {templates.length > 0 ? (
                  <select
                    className="inp filled"
                    style={{ width: "auto" }}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleLoadTemplate(e.target.value);
                    }}
                  >
                    <option value="">템플릿 불러오기</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="field" style={{ marginTop: "12px", marginBottom: 0 }}>
                <input
                  type="text"
                  className="inp filled"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="템플릿 이름"
                />
              </div>
              {homeworkMessage ? (
                <p
                  role="status"
                  style={{ marginTop: "12px", fontSize: "12.5px", color: "var(--acc-text)" }}
                >
                  {homeworkMessage}
                </p>
              ) : null}
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "10px",
                  height: "90px",
                  padding: "16px 20px 0",
                }}
              >
                {previewCounts.counts.map((count, i) => {
                  const heightPct = Math.round((count / previewCounts.max) * 100);
                  const wd = weekdayShort[(startWeekday + i) % 7];
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <i
                        style={{
                          width: "100%",
                          height: `${heightPct}%`,
                          borderRadius: "5px 5px 2px 2px",
                          background: "var(--acc)",
                          display: "block",
                        }}
                      />
                      <span style={{ fontSize: "10.5px", color: "var(--mut)" }}>
                        {wd} {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p
                style={{
                  padding: "12px 20px 16px",
                  fontSize: "12.5px",
                  color: "var(--mut)",
                  borderTop: "1px solid var(--line)",
                }}
              >
                총 {previewCounts.total}개 → 앞쪽 요일 우선 · 단조 감소 · 하루 최소 1개
              </p>
            </div>
          </div>

          <div className="sec">
            <h2>주간 코멘트</h2>
            <div className="card" style={{ padding: "20px" }}>
              {plan ? (
                <>
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "var(--mut)",
                      marginBottom: "10px",
                    }}
                  >
                    {formatPlanHeader(selectedDate)}
                  </p>
                  <textarea
                    className="inp area filled"
                    style={{ marginBottom: "12px" }}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="이 날의 학습 계획에 코멘트를 남겨주세요"
                  />
                  <button
                    type="button"
                    className="btn sec"
                    disabled={savingComment || !commentDraft.trim()}
                    onClick={() => void handleSaveComment()}
                  >
                    {savingComment ? "저장 중…" : "코멘트 저장 (리포트에 반영)"}
                  </button>
                  {commentMessage ? (
                    <p
                      role="status"
                      style={{ marginTop: "12px", fontSize: "12.5px", color: "var(--acc-text)" }}
                    >
                      {commentMessage}
                    </p>
                  ) : null}
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--mut)" }}>
                  오늘 날짜에 등록된 학습 계획이 없습니다. 숙제를 분배하면 코멘트를 남길 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
