"use client";

import { useRef, useState } from "react";

import type {
  ManagerMonitoringDetailData,
  ManagerMonitoringOverview,
  ManagerMonitoringStudentRow,
} from "@/lib/manager-portal-data";
import { formatConsultationDateLabel } from "@/lib/study-plan-dates";

type CareLogType = "CONSULT" | "INTERVENTION" | "CHECK";

type CareLog = {
  id: string;
  type: CareLogType;
  note: string;
  visibleToStudent: boolean;
  createdAt: string;
};

const CARE_LOG_TYPE_LABELS: Record<CareLogType, string> = {
  CONSULT: "상담",
  INTERVENTION: "개입",
  CHECK: "점검",
};

const CARE_LOG_TYPE_CLASSES: Record<CareLogType, string> = {
  CONSULT: "bg-blue-50 text-blue-700",
  INTERVENTION: "bg-orange-50 text-orange-700",
  CHECK: "bg-green-50 text-green-700",
};

type Overview = ManagerMonitoringOverview;
type StudentRow = ManagerMonitoringStudentRow;
type DetailData = ManagerMonitoringDetailData;

type ManagerMonitoringPageProps = {
  initialOverview: Overview;
  initialStudents: StudentRow[];
};

function statusBadgeClass(label: string): string {
  if (label === "위험") return "bst warn";
  if (label === "주의") return "bst warn";
  return "bst acc";
}

export function ManagerMonitoringPage({
  initialOverview,
  initialStudents,
}: ManagerMonitoringPageProps) {
  const [overview] = useState<Overview | null>(initialOverview);
  const [students] = useState<StudentRow[]>(initialStudents);
  const [loading] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailCacheRef = useRef<Map<string, DetailData>>(new Map());

  // Care log state
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [careLogsLoading, setCareLogsLoading] = useState(false);
  const careLogsCacheRef = useRef<Map<string, CareLog[]>>(new Map());
  const [careLogType, setCareLogType] = useState<CareLogType>("CONSULT");
  const [careLogNote, setCareLogNote] = useState("");
  const [careLogVisible, setCareLogVisible] = useState(true);
  const [careLogSaving, setCareLogSaving] = useState(false);
  const [careLogToast, setCareLogToast] = useState<string | null>(null);

  const fetchCareLogs = async (studentId: string) => {
    const cached = careLogsCacheRef.current.get(studentId);
    if (cached) {
      setCareLogs(cached);
      return;
    }
    setCareLogsLoading(true);
    try {
      const res = await fetch(
        `/api/manager/care-logs?studentId=${encodeURIComponent(studentId)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { logs: CareLog[] };
        careLogsCacheRef.current.set(studentId, data.logs);
        setCareLogs(data.logs);
      }
    } finally {
      setCareLogsLoading(false);
    }
  };

  const openDrawer = async (studentId: string) => {
    setDrawerId(studentId);
    setCareLogNote("");
    setCareLogType("CONSULT");
    setCareLogVisible(true);

    const cached = detailCacheRef.current.get(studentId);
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
    } else {
      setDetail(null);
      setDetailLoading(true);
      try {
        const res = await fetch(
          `/api/manager/monitoring/stats?studentId=${encodeURIComponent(studentId)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as DetailData;
          detailCacheRef.current.set(studentId, data);
          setDetail(data);
        }
      } finally {
        setDetailLoading(false);
      }
    }

    void fetchCareLogs(studentId);
  };

  const submitCareLog = async () => {
    if (!drawerId || !careLogNote.trim()) return;
    setCareLogSaving(true);
    try {
      const res = await fetch("/api/manager/care-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: drawerId,
          type: careLogType,
          note: careLogNote.trim(),
          visibleToStudent: careLogVisible,
        }),
      });
      if (res.ok) {
        // Clear cache so next open re-fetches
        careLogsCacheRef.current.delete(drawerId);
        setCareLogNote("");
        setCareLogToast("케어 로그가 저장되었습니다.");
        window.setTimeout(() => setCareLogToast(null), 3000);
        void fetchCareLogs(drawerId);
      } else {
        setCareLogToast("저장에 실패했습니다.");
        window.setTimeout(() => setCareLogToast(null), 3000);
      }
    } finally {
      setCareLogSaving(false);
    }
  };

  return (
    <section className="page on" id="pg-monitor">
      <div className="crumb">/teacher-portal/dashboard/monitoring</div>
      <h1>모니터링</h1>
      <p className="sub">담당 학생의 진행 현황을 드릴다운하고 케어로그를 남깁니다.</p>

      <div className="sec grid3">
        <div className="card kpi">
          <b>{overview?.studentCount ?? "—"}</b>
          <span>담당 학생</span>
        </div>
        <div className="card kpi">
          <b>
            {overview ? overview.avgCompletionRate : "—"}
            <em>%</em>
          </b>
          <span>이번 주 평균 완료율</span>
        </div>
        <div className="card kpi">
          <b>{overview?.staleQuestions ?? "—"}</b>
          <span>미답변 질문 (24h+)</span>
        </div>
      </div>

      <div className="sec card">
        {loading ? (
          <div className="row">
            <div className="g">
              <p>불러오는 중…</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="row">
            <div className="g">
              <p>담당 학생이 없습니다.</p>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>학생</th>
                <th>신호</th>
                <th>담당 선생님</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>
                      {s.name} · {s.grade}
                    </b>
                  </td>
                  <td>
                    완료율 {s.completionRate}% · 미답변 {s.unansweredStale}
                    <span className={statusBadgeClass(s.statusLabel)} style={{ marginLeft: "8px" }}>
                      {s.statusLabel}
                    </span>
                  </td>
                  <td>{s.teacherName}</td>
                  <td>
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => void openDrawer(s.id)}
                    >
                      케어로그
                    </button>{" "}
                    <button
                      type="button"
                      className="btn sec sm"
                      onClick={() => void openDrawer(s.id)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerId ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setDrawerId(null)}
          role="presentation"
        >
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-surface px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-text-primary">
                {detail?.student?.name ?? "학생 상세"}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerId(null)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                닫기
              </button>
            </div>
            <div className="p-4 sm:p-5">
              {detailLoading ? (
                <p className="text-sm text-text-secondary">불러오는 중…</p>
              ) : detail ? (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-semibold text-text-primary">
                      이번 주 학습계획
                    </h3>
                    {detail.plans.length === 0 ? (
                      <p className="mt-2 text-sm text-text-secondary">계획 없음</p>
                    ) : (
                      <ul className="mt-3 space-y-4">
                        {detail.plans.map((plan) => (
                          <li
                            key={plan.id}
                            className="rounded-xl border border-gray-100 p-3"
                          >
                            <p className="text-xs font-medium text-text-primary">
                              {formatConsultationDateLabel(plan.date)}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {plan.tasks.map((t) => (
                                <li
                                  key={t.id}
                                  className={`text-sm ${t.isDone ? "text-text-muted line-through" : "text-text-primary"}`}
                                >
                                  {t.title}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-text-primary">
                      미답변 질문 (24h+)
                    </h3>
                    {detail.unansweredQuestions.length === 0 ? (
                      <p className="mt-2 text-sm text-text-secondary">없음</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {detail.unansweredQuestions.map((q) => (
                          <li
                            key={q.id}
                            className="rounded-lg bg-orange-50 px-3 py-2 text-sm"
                          >
                            <p className="text-xs text-text-secondary">{q.date}</p>
                            <p className="mt-1 text-text-primary">{q.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-text-primary">
                      최근 선생님 코멘트
                    </h3>
                    {detail.recentComments.length === 0 ? (
                      <p className="mt-2 text-sm text-text-secondary">없음</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {detail.recentComments.map((c) => (
                          <li
                            key={c.date}
                            className="rounded-lg bg-primary/5 px-3 py-2 text-sm"
                          >
                            <p className="text-xs text-primary">{c.date}</p>
                            <p className="mt-1 text-text-primary">{c.comment}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-text-primary">
                      케어 로그
                    </h3>
                    {careLogToast ? (
                      <p className="mt-2 text-xs text-primary">{careLogToast}</p>
                    ) : null}
                    <div className="mt-3 space-y-2 rounded-xl border border-gray-100 bg-background p-3">
                      <div className="flex gap-2">
                        <select
                          value={careLogType}
                          onChange={(e) => setCareLogType(e.target.value as CareLogType)}
                          className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary"
                        >
                          <option value="CONSULT">상담</option>
                          <option value="INTERVENTION">개입</option>
                          <option value="CHECK">점검</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            checked={careLogVisible}
                            onChange={(e) => setCareLogVisible(e.target.checked)}
                            className="accent-primary"
                          />
                          학생 공개
                        </label>
                      </div>
                      <textarea
                        value={careLogNote}
                        onChange={(e) => setCareLogNote(e.target.value.slice(0, 1000))}
                        rows={3}
                        placeholder="내용을 입력하세요 (최대 1000자)"
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        disabled={careLogSaving || !careLogNote.trim()}
                        onClick={() => void submitCareLog()}
                        className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {careLogSaving ? "저장 중…" : "케어 로그 저장"}
                      </button>
                    </div>

                    {careLogsLoading ? (
                      <p className="mt-2 text-xs text-text-secondary">불러오는 중…</p>
                    ) : careLogs.length === 0 ? (
                      <p className="mt-2 text-xs text-text-secondary">아직 케어 로그가 없습니다.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {careLogs.map((log) => (
                          <li key={log.id} className="rounded-lg border border-gray-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CARE_LOG_TYPE_CLASSES[log.type]}`}>
                                {CARE_LOG_TYPE_LABELS[log.type]}
                              </span>
                              {!log.visibleToStudent && (
                                <span className="text-xs text-text-muted">비공개</span>
                              )}
                              <span className="ml-auto text-xs text-text-muted">
                                {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-text-primary">{log.note}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
