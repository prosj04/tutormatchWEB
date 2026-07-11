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

      <div className={drawerId ? "drawer on" : "drawer"} aria-label="학생 드릴다운">
        <div className="d-h">
          <h3>{detail?.student?.name ?? "학생 상세"}</h3>
          <button type="button" className="x" onClick={() => setDrawerId(null)}>
            ✕
          </button>
        </div>
        <div className="d-b">
          {detailLoading ? (
            <p className="sub">불러오는 중…</p>
          ) : detail ? (
            <>
              <div className="kv" style={{ padding: "0 0 14px" }}>
                <div>
                  <span>이번 주 학습계획</span>
                  <b>{detail.plans.length}일치</b>
                </div>
                <div>
                  <span>미답변 질문 (24h+)</span>
                  <b>{detail.unansweredQuestions.length}건</b>
                </div>
                <div>
                  <span>최근 선생님 코멘트</span>
                  <b>{detail.recentComments.length}건</b>
                </div>
              </div>

              {detail.plans.length > 0 ? (
                <>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "10px 0 8px" }}>
                    이번 주 학습계획
                  </h4>
                  <div className="card">
                    {detail.plans.map((plan) => (
                      <div className="row" key={plan.id}>
                        <div className="g">
                          <b>{formatConsultationDateLabel(plan.date)}</b>
                          <p>
                            {plan.tasks.map((t) => (t.isDone ? `✓ ${t.title}` : t.title)).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {detail.unansweredQuestions.length > 0 ? (
                <>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "14px 0 8px" }}>
                    미답변 질문 (24h+)
                  </h4>
                  <div className="card">
                    {detail.unansweredQuestions.map((q) => (
                      <div className="row" key={q.id}>
                        <div className="g">
                          <b>{q.date}</b>
                          <p>{q.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {detail.recentComments.length > 0 ? (
                <>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "14px 0 8px" }}>
                    최근 선생님 코멘트
                  </h4>
                  <div className="card">
                    {detail.recentComments.map((c) => (
                      <div className="row" key={c.date}>
                        <div className="g">
                          <b>{c.date}</b>
                          <p>{c.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "14px 0 8px" }}>
                케어로그 작성
              </h4>
              {careLogToast ? (
                <p className="sub" style={{ color: "var(--acc-text)" }}>{careLogToast}</p>
              ) : null}
              <div className="field">
                <label>유형</label>
                <div className="opts">
                  {(["CONSULT", "INTERVENTION", "CHECK"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="opt"
                      aria-pressed={careLogType === type}
                      onClick={() => setCareLogType(type)}
                    >
                      {CARE_LOG_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={careLogVisible}
                    onChange={(e) => setCareLogVisible(e.target.checked)}
                  />
                  학생 공개
                </label>
                <textarea
                  className="inp area"
                  value={careLogNote}
                  onChange={(e) => setCareLogNote(e.target.value.slice(0, 1000))}
                  placeholder="조치 내용을 기록하세요 (최대 1000자)"
                />
              </div>

              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "14px 0 8px" }}>
                최근 케어로그
              </h4>
              {careLogsLoading ? (
                <p className="sub">불러오는 중…</p>
              ) : careLogs.length === 0 ? (
                <p className="sub">아직 케어 로그가 없습니다.</p>
              ) : (
                <div className="card">
                  {careLogs.map((log) => (
                    <div className="row" key={log.id}>
                      <div className="g">
                        <b>
                          {CARE_LOG_TYPE_LABELS[log.type]}
                          {!log.visibleToStudent ? " · 비공개" : ""}
                        </b>
                        <p>
                          {new Date(log.createdAt).toLocaleDateString("ko-KR")} · {log.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
        <div className="d-f">
          <button type="button" className="btn sec" style={{ flex: 1 }} onClick={() => setDrawerId(null)}>
            닫기
          </button>
          <button
            type="button"
            className="btn pri"
            style={{ flex: 1 }}
            disabled={careLogSaving || !careLogNote.trim() || !detail}
            onClick={() => void submitCareLog()}
          >
            {careLogSaving ? "저장 중…" : "케어로그 저장"}
          </button>
        </div>
      </div>
    </section>
  );
}
