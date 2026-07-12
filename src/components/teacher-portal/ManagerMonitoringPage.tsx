"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ManagerMonitoringDetailData,
  ManagerMonitoringOverview,
  ManagerMonitoringStudentRow,
} from "@/lib/manager-portal-data";
import { formatConsultationDateLabel } from "@/lib/study-plan-dates";

/** 오늘 기준 +offset일의 YYYY-MM-DD (date input value). */
function isoDatePlusDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

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
  const router = useRouter();
  const [overview] = useState<Overview | null>(initialOverview);
  const [students] = useState<StudentRow[]>(initialStudents);
  const [loading] = useState(false);

  // 구독 일시정지/재개 상태
  const [pauseUntil, setPauseUntil] = useState(isoDatePlusDays(7));
  const [pauseReason, setPauseReason] = useState("");
  const [subMode, setSubMode] = useState<"PAUSE" | "RESUME" | null>(null);
  const [subBusy, setSubBusy] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
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
  // E10: 케어로그 기본값은 비공개(내부용). 매니저가 명시적으로 공개해야 학생에게 보인다.
  const [careLogVisible, setCareLogVisible] = useState(false);
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
    // 기본 비공개(E10) — 학생 공개는 매니저가 명시적으로 켤 때만
    setCareLogVisible(false);

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

  const drawerStudent = students.find((s) => s.id === drawerId) ?? null;
  const drawerSub = drawerStudent?.subscription ?? null;

  const openSubModal = (mode: "PAUSE" | "RESUME") => {
    setSubError(null);
    if (mode === "PAUSE") {
      setPauseUntil(isoDatePlusDays(7));
      setPauseReason("");
    }
    setSubMode(mode);
  };

  const submitSubscription = async () => {
    if (!drawerSub || !subMode) return;

    let payload: { action: string; until?: string; reason?: string };
    if (subMode === "PAUSE") {
      // 오늘+1 ~ 오늘+35일 검증
      const min = isoDatePlusDays(1);
      const max = isoDatePlusDays(35);
      if (pauseUntil < min || pauseUntil > max) {
        setSubError("재개 예정일은 내일부터 최대 35일 이내여야 합니다.");
        return;
      }
      // 로컬 자정 → ISO (백엔드는 now+35일 상한만 검증)
      const untilIso = new Date(`${pauseUntil}T00:00:00`).toISOString();
      payload = { action: "PAUSE", until: untilIso };
      if (pauseReason.trim()) payload.reason = pauseReason.trim();
    } else {
      payload = { action: "RESUME" };
    }

    setSubBusy(true);
    setSubError(null);
    try {
      const res = await fetch(
        `/api/manager/subscriptions/${encodeURIComponent(drawerSub.id)}/pause`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setSubMode(null);
        setDrawerId(null);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setSubError(data?.error ?? "처리에 실패했습니다.");
      }
    } catch {
      setSubError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubBusy(false);
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
                    {s.subscription?.status === "PAUSED" ? (
                      <span className="bst mut" style={{ marginLeft: "6px" }}>
                        일시정지
                      </span>
                    ) : null}
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

              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "4px 0 8px" }}>
                구독 일시정지
              </h4>
              {!drawerSub ? (
                <p className="sub">활성 구독이 없습니다.</p>
              ) : drawerSub.status === "PAUSED" ? (
                <div className="card">
                  <div className="row">
                    <div className="g">
                      <b>
                        <span className="bst mut">일시정지 중</span>
                        {drawerSub.pausedUntil
                          ? ` · ~ ${formatConsultationDateLabel(drawerSub.pausedUntil.slice(0, 10))}`
                          : ""}
                      </b>
                      <p>재개하면 다음 결제일이 정지 기간만큼 뒤로 밀립니다.</p>
                    </div>
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => openSubModal("RESUME")}
                    >
                      재개
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label>재개 예정일</label>
                    <input
                      type="date"
                      className="inp"
                      value={pauseUntil}
                      min={isoDatePlusDays(1)}
                      max={isoDatePlusDays(35)}
                      onChange={(e) => setPauseUntil(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>사유 (선택)</label>
                    <input
                      type="text"
                      className="inp"
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value.slice(0, 500))}
                      placeholder="일시정지 사유 (내부용)"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn sec sm"
                    onClick={() => openSubModal("PAUSE")}
                  >
                    일시정지
                  </button>
                </>
              )}

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
                  케어로그
                  <span className={careLogVisible ? "bst acc" : "bst mut"}>
                    {careLogVisible ? "학생 공개" : "내부용"}
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "12.5px" }}>
                  <input
                    type="checkbox"
                    checked={careLogVisible}
                    onChange={(e) => setCareLogVisible(e.target.checked)}
                  />
                  학생에게 공개
                </label>
                {careLogVisible ? (
                  <p className="sub" style={{ color: "var(--acc-text)", fontWeight: 700 }}>
                    이 케어로그는 학생에게 보입니다.
                  </p>
                ) : (
                  <p className="sub">기본은 비공개(내부용)입니다.</p>
                )}
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

      {subMode && drawerSub ? (
        <div
          className="scrim on"
          onClick={(e) => {
            if (e.target === e.currentTarget && !subBusy) setSubMode(null);
          }}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={subMode === "PAUSE" ? "구독 일시정지" : "구독 재개"}
          >
            <div className="m-b">
              <h3>{subMode === "PAUSE" ? "구독 일시정지" : "구독 재개"}</h3>
              {subMode === "PAUSE" ? (
                <p className="m-p">
                  {drawerStudent?.name} 학생의 구독을 일시정지합니다. 재개 예정일:{" "}
                  {formatConsultationDateLabel(pauseUntil)}
                  {pauseReason.trim() ? ` · 사유: ${pauseReason.trim()}` : ""}
                </p>
              ) : (
                <p className="m-p">
                  {drawerStudent?.name} 학생의 구독을 재개합니다. 다음 결제일이 정지 기간만큼
                  연장됩니다.
                </p>
              )}
              {subError ? (
                <div className="banner err" style={{ marginTop: "12px" }}>
                  {subError}
                </div>
              ) : null}
            </div>
            <div className="m-f">
              <button
                type="button"
                className="btn sec"
                disabled={subBusy}
                onClick={() => setSubMode(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn pri"
                disabled={subBusy}
                onClick={() => void submitSubscription()}
              >
                {subBusy
                  ? "처리 중…"
                  : subMode === "PAUSE"
                    ? "일시정지"
                    : "재개"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
