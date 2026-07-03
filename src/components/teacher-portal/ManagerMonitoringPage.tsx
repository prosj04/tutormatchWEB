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

  const cards = [
    { label: "담당 학생 수", value: overview?.studentCount ?? "—" },
    {
      label: "이번 주 평균 완료율",
      value: overview ? `${overview.avgCompletionRate}%` : "—",
    },
    {
      label: "미답변 질문 (24h+)",
      value: overview?.staleQuestions ?? "—",
    },
    { label: "주의 학생 수", value: overview?.atRiskCount ?? "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">모니터링</h1>
      <p className="mt-2 text-sm text-text-secondary">
        매칭한 학생들의 학습 현황을 확인합니다.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-text-secondary">{c.label}</p>
            <p className="mt-2 text-2xl font-black text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-text-secondary">
            불러오는 중…
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-text-secondary">
            담당 학생이 없습니다.
          </div>
        ) : (
          students.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void openDrawer(s.id)}
              className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{s.name}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {s.grade} · {s.teacherName}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.statusClassName}`}
                >
                  {s.statusLabel}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-background px-3 py-2">
                  <dt className="text-xs text-text-muted">이번주 완료율</dt>
                  <dd className="mt-1 font-semibold text-text-primary">{s.completionRate}%</dd>
                </div>
                <div className="rounded-xl bg-background px-3 py-2">
                  <dt className="text-xs text-text-muted">미답변 질문</dt>
                  <dd className="mt-1 font-semibold text-text-primary">{s.unansweredStale}</dd>
                </div>
              </dl>
            </button>
          ))
        )}
      </div>

      <div className="mt-10 hidden overflow-x-auto rounded-2xl border border-gray-200 bg-surface md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-background/80 text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">학년</th>
              <th className="px-4 py-3">담당선생님</th>
              <th className="px-4 py-3">이번주완료율</th>
              <th className="px-4 py-3">미답변질문</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  불러오는 중…
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  담당 학생이 없습니다.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => void openDrawer(s.id)}
                  className="cursor-pointer border-b border-gray-50 transition hover:bg-primary/5"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.grade}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.teacherName}</td>
                  <td className="px-4 py-3">{s.completionRate}%</td>
                  <td className="px-4 py-3">{s.unansweredStale}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.statusClassName}`}
                    >
                      {s.statusLabel}
                      {s.statusLabel === "주의" ? " ⚠️" : ""}
                      {s.statusLabel === "위험" ? " 🔴" : ""}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </div>
  );
}
