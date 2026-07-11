"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ManagerConsultationBooking } from "@/lib/manager-portal-data";
import type { ConsultationGoals } from "@/lib/consultation-report";
import Link from "next/link";

import {
  formatDateWithWeekday,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

type ConsultationBooking = ManagerConsultationBooking;

type Tab = "waiting" | "mine";

type ManagerConsultationsPageProps = {
  initialWaiting: ConsultationBooking[];
  initialMine: ConsultationBooking[];
  initialMineLoaded?: boolean;
  /** 페이지 하단에 렌더할 미배정 질문 섹션 등 */
  children?: React.ReactNode;
};

export function ManagerConsultationsPage({
  initialWaiting,
  initialMine,
  initialMineLoaded = true,
  children,
}: ManagerConsultationsPageProps) {
  const [tab, setTab] = useState<Tab>("waiting");
  const [waiting, setWaiting] = useState<ConsultationBooking[]>(initialWaiting);
  const [mine, setMine] = useState<ConsultationBooking[]>(initialMine);
  const [mineLoaded, setMineLoaded] = useState(initialMineLoaded);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] =
    useState<ConsultationBooking | null>(null);
  const [managerNote, setManagerNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // visitConfirmedAt state per booking (keyed by booking id)
  const [visitConfirmedInputs, setVisitConfirmedInputs] = useState<Record<string, string>>({});
  const [visitConfirmedSaving, setVisitConfirmedSaving] = useState<string | null>(null);

  // Consultation report modal state
  const [reportTarget, setReportTarget] = useState<ConsultationBooking | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportGoals, setReportGoals] = useState<ConsultationGoals>({
    quantitative: [],
    qualitative: [],
  });
  const [reportSubjectLevels, setReportSubjectLevels] = useState("");
  const [reportRecommendedPlan, setReportRecommendedPlan] = useState("");
  const [reportNote, setReportNote] = useState("");
  const waitingIdsRef = useRef<Set<string>>(
    new Set(initialWaiting.map((booking) => booking.id)),
  );
  const initializedWaitingRef = useRef(true);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchWaiting = useCallback(
    async (silent = false) => {
      const res = await fetch("/api/manager/consultations/waiting");
      if (!res.ok) return;
      const data = (await res.json()) as {
        bookings: ConsultationBooking[];
      };

      const nextIds = new Set(data.bookings.map((booking) => booking.id));
      if (initializedWaitingRef.current && silent) {
        const disappeared = Array.from(waitingIdsRef.current).some(
          (id) => !nextIds.has(id),
        );
        if (disappeared) showToast("학생 목록이 업데이트되었습니다.");
      }

      initializedWaitingRef.current = true;
      waitingIdsRef.current = nextIds;
      setWaiting(data.bookings);
    },
    [showToast],
  );

  const fetchMine = useCallback(async () => {
    const res = await fetch("/api/manager/consultations/mine");
    if (!res.ok) return;
    const data = (await res.json()) as {
      bookings: ConsultationBooking[];
    };
    setMine(data.bookings);
    setMineLoaded(true);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWaiting(), fetchMine()]);
    setLoading(false);
  }, [fetchWaiting, fetchMine]);

  useEffect(() => {
    if (tab !== "waiting") return;
    const interval = window.setInterval(() => void fetchWaiting(true), 30_000);
    return () => window.clearInterval(interval);
  }, [tab, fetchWaiting]);

  useEffect(() => {
    if (tab !== "mine" || mineLoaded) return;
    setLoading(true);
    void fetchMine().finally(() => setLoading(false));
  }, [fetchMine, mineLoaded, tab]);

  async function assignBooking(booking: ConsultationBooking) {
    const ok = confirm(
      "이 학생을 담당하시겠습니까?\n담당 후에는 다른 매니저가 이 학생을 볼 수 없습니다.",
    );
    if (!ok) return;

    setActionLoading(booking.id);
    try {
      const res = await fetch(
        `/api/manager/consultations/${booking.id}/assign`,
        { method: "PATCH" },
      );
      if (res.status === 409) {
        showToast("이미 다른 매니저가 담당을 선택했습니다.");
        await refreshAll();
        return;
      }
      if (res.ok) {
        showToast("담당 학생으로 배정되었습니다.");
        await refreshAll();
        setTab("mine");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function completeBooking() {
    if (!completeTarget) return;
    setActionLoading(completeTarget.id);
    try {
      const res = await fetch(
        `/api/manager/consultations/${completeTarget.id}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            managerNote,
          }),
        },
      );
      if (res.ok) {
        setCompleteTarget(null);
        setManagerNote("");
        showToast("상담 완료 처리되었습니다.");
        await refreshAll();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelBooking(booking: ConsultationBooking) {
    const ok = confirm("상담 담당을 취소하고 대기 상태로 되돌릴까요?");
    if (!ok) return;

    setActionLoading(booking.id);
    try {
      const res = await fetch(
        `/api/manager/consultations/${booking.id}/cancel`,
        { method: "PATCH" },
      );
      if (res.ok) {
        showToast("상담이 대기 상태로 되돌아갔습니다.");
        await refreshAll();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function openReportModal(booking: ConsultationBooking) {
    setReportTarget(booking);
    setReportGoals({ quantitative: [], qualitative: [] });
    setReportSubjectLevels("");
    setReportRecommendedPlan("");
    setReportNote("");
    setReportLoading(true);
    try {
      const res = await fetch(
        `/api/manager/consultations/${booking.id}/report`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          report: {
            goals: ConsultationGoals;
            subjectLevels: Record<string, string> | null;
            recommendedPlan: string | null;
            note: string | null;
          } | null;
        };
        if (data.report) {
          setReportGoals(data.report.goals);
          setReportSubjectLevels(
            data.report.subjectLevels
              ? Object.entries(data.report.subjectLevels)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")
              : "",
          );
          setReportRecommendedPlan(data.report.recommendedPlan ?? "");
          setReportNote(data.report.note ?? "");
        }
      }
    } finally {
      setReportLoading(false);
    }
  }

  async function saveReport() {
    if (!reportTarget) return;
    setReportSaving(true);
    try {
      // Parse subjectLevels from "subject: level" lines
      const subjectLevels: Record<string, string> = {};
      for (const line of reportSubjectLevels.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key && val) subjectLevels[key] = val;
        }
      }

      const res = await fetch(
        `/api/manager/consultations/${reportTarget.id}/report`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goals: reportGoals,
            subjectLevels:
              Object.keys(subjectLevels).length > 0 ? subjectLevels : null,
            recommendedPlan: reportRecommendedPlan.trim() || null,
            note: reportNote.trim() || null,
          }),
        },
      );
      if (res.ok) {
        showToast("리포트가 저장되었습니다.");
        setReportTarget(null);
      } else {
        const err = (await res.json()) as { error?: string };
        showToast(err.error ?? "저장에 실패했습니다.");
      }
    } finally {
      setReportSaving(false);
    }
  }

  function getVisitConfirmedValue(booking: ConsultationBooking): string {
    if (booking.id in visitConfirmedInputs) return visitConfirmedInputs[booking.id] ?? "";
    if (booking.visitConfirmedAt) {
      // Convert ISO to datetime-local format (YYYY-MM-DDTHH:MM)
      return booking.visitConfirmedAt.slice(0, 16);
    }
    return "";
  }

  async function saveVisitConfirmed(bookingId: string, value: string) {
    setVisitConfirmedSaving(bookingId);
    try {
      const visitConfirmedAt = value ? new Date(value).toISOString() : null;
      const res = await fetch(
        `/api/manager/consultations/${bookingId}/visit-confirmed`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitConfirmedAt }),
        },
      );
      if (res.ok) {
        showToast("방문 상담 일시가 저장되었습니다.");
        await refreshAll();
      } else {
        showToast("저장에 실패했습니다.");
      }
    } finally {
      setVisitConfirmedSaving(null);
    }
  }

  function handleGoalListChange(
    field: "quantitative" | "qualitative",
    text: string,
  ) {
    const items = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);
    setReportGoals((prev) => ({ ...prev, [field]: items }));
  }

  const rows = tab === "waiting" ? waiting : mine;

  return (
    <section className="page on" id="pg-consult">
      <div className={toast ? "toast on" : "toast"}>{toast}</div>

      <div className="crumb">/teacher-portal/dashboard/consultations</div>
      <h1>상담 관리</h1>
      <p className="sub">대기 중 상담을 배정받고, 담당 상담을 진행·완료합니다.</p>

      <div className="sec">
        <div className="opts">
          {(["waiting", "mine"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className="opt"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {key === "waiting" ? "대기 중" : "내 담당"}
            </button>
          ))}
        </div>
      </div>

      <div className="sec card">
        {loading ? (
          <div className="row">
            <div className="g">
              <p>불러오는 중…</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="row">
            <div className="g">
              <p>
                {tab === "waiting"
                  ? "현재 대기 중인 학생이 없습니다."
                  : "담당 중인 상담이 없습니다."}
              </p>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>학생</th>
                <th>요청</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {tab === "waiting"
                ? waiting.map((booking) => (
                    <WaitingRow
                      key={booking.id}
                      booking={booking}
                      loading={actionLoading === booking.id}
                      onAssign={() => void assignBooking(booking)}
                    />
                  ))
                : mine.map((booking) => (
                    <MineRow
                      key={booking.id}
                      booking={booking}
                      loading={actionLoading === booking.id}
                      visitConfirmedValue={getVisitConfirmedValue(booking)}
                      visitConfirmedSaving={visitConfirmedSaving === booking.id}
                      onVisitConfirmedChange={(v) =>
                        setVisitConfirmedInputs((prev) => ({ ...prev, [booking.id]: v }))
                      }
                      onVisitConfirmedSave={() =>
                        void saveVisitConfirmed(
                          booking.id,
                          visitConfirmedInputs[booking.id] ?? getVisitConfirmedValue(booking),
                        )
                      }
                      onComplete={() => {
                        setCompleteTarget(booking);
                        setManagerNote("");
                      }}
                      onCancel={() => void cancelBooking(booking)}
                      onReport={() => void openReportModal(booking)}
                    />
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {children}

      {completeTarget ? (
        <div
          className="scrim on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCompleteTarget(null);
          }}
          role="presentation"
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="상담 완료 처리">
            <div className="m-b">
              <h3>상담 완료 처리</h3>
              <p className="m-p">
                {completeTarget.student.name} · {completeTarget.student.grade}
                {completeTarget.student.subjects ? ` · ${completeTarget.student.subjects}` : ""}
              </p>
              <div className="field" style={{ marginTop: "14px" }}>
                <label>상담 노트 (필수)</label>
                <textarea
                  className="inp area filled"
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  placeholder="상담 메모 (내부용, 매칭 시 참고)"
                />
              </div>
            </div>
            <div className="m-f">
              <button
                type="button"
                className="btn sec"
                onClick={() => setCompleteTarget(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn pri"
                disabled={!managerNote.trim() || actionLoading === completeTarget.id}
                onClick={() => void completeBooking()}
              >
                완료 처리
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportTarget ? (
        <div
          className="scrim on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportTarget(null);
          }}
          role="presentation"
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="상담 리포트">
            <div className="m-b">
              <h3>상담 리포트</h3>
              <p className="m-p">
                {reportTarget.student.name} · {reportTarget.student.grade}
                {reportTarget.student.subjects ? ` · ${reportTarget.student.subjects}` : ""}
              </p>

              {reportLoading ? (
                <p className="m-p" style={{ marginTop: "14px" }}>불러오는 중…</p>
              ) : (
                <>
                  <div className="field" style={{ marginTop: "14px" }}>
                    <label>정량 목표 (한 줄에 하나, 최대 10개)</label>
                    <textarea
                      className="inp area filled"
                      value={reportGoals.quantitative.join("\n")}
                      onChange={(e) =>
                        handleGoalListChange("quantitative", e.target.value)
                      }
                      placeholder={"예) 수학 3등급 달성\n예) 영어 모의고사 85점 이상"}
                    />
                  </div>
                  <div className="field">
                    <label>정성 목표 (한 줄에 하나, 최대 10개)</label>
                    <textarea
                      className="inp area filled"
                      value={reportGoals.qualitative.join("\n")}
                      onChange={(e) =>
                        handleGoalListChange("qualitative", e.target.value)
                      }
                      placeholder={"예) 자기주도 학습 습관 형성\n예) 개념 이해 중심 공부 전환"}
                    />
                  </div>
                  <div className="field">
                    <label>과목별 현재 수준 (형식: &quot;과목: 수준&quot;, 한 줄에 하나)</label>
                    <textarea
                      className="inp area filled"
                      value={reportSubjectLevels}
                      onChange={(e) => setReportSubjectLevels(e.target.value)}
                      placeholder={"예) 수학: 중학교 3학년 수준\n예) 영어: 기초 문법 숙지"}
                    />
                  </div>
                  <div className="field">
                    <label>추천 플랜</label>
                    <textarea
                      className="inp area filled"
                      value={reportRecommendedPlan}
                      onChange={(e) => setReportRecommendedPlan(e.target.value)}
                      placeholder="주 2회 수학 집중, 월 1회 영어 점검 등"
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>종합 의견 (내부용)</label>
                    <textarea
                      className="inp area filled"
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      placeholder="특이사항, 학부모 요청사항 등"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="m-f">
              <button
                type="button"
                className="btn sec"
                onClick={() => setReportTarget(null)}
              >
                닫기
              </button>
              {!reportLoading && (
                <button
                  type="button"
                  className="btn pri"
                  disabled={reportSaving}
                  onClick={() => void saveReport()}
                >
                  {reportSaving ? "저장 중…" : "저장"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function VisitPreferredBlock({ times }: { times: VisitTimesByDate }) {
  const entries = Object.entries(times).filter(([, slots]) => slots.length > 0);
  if (entries.length === 0) {
    return (
      <span className="bst warn" style={{ display: "inline-block", marginTop: "6px" }}>
        방문 희망 시간 미입력
      </span>
    );
  }
  return (
    <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--mut)" }}>
      방문 희망:{" "}
      {entries
        .map(([date, slots]) => `${formatDateWithWeekday(date)} ${slots.join(", ")}`)
        .join(" / ")}
    </span>
  );
}

function ContactLine({ booking }: { booking: ConsultationBooking }) {
  return (
    <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--mut)" }}>
      연락처: {booking.student.phone}
      {booking.student.guardianPhone ? ` · 부모 ${booking.student.guardianPhone}` : ""}
    </span>
  );
}

function WaitingRow({
  booking,
  loading,
  onAssign,
}: {
  booking: ConsultationBooking;
  loading: boolean;
  onAssign: () => void;
}) {
  return (
    <tr>
      <td>
        <b>
          {booking.student.name} · {booking.student.grade}
          {booking.student.region ? ` · ${booking.student.region}` : ""}
        </b>
        <ContactLine booking={booking} />
      </td>
      <td>
        {booking.student.subjects}
        {booking.timeAgo ? ` · ${booking.timeAgo}` : ""}
        <VisitPreferredBlock times={booking.visitPreferredTimes} />
        {booking.note ? (
          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--mut)" }}>
            메모: {booking.note}
          </span>
        ) : null}
      </td>
      <td>
        <span className="bst warn">대기</span>
      </td>
      <td>
        <button
          type="button"
          className="btn pri sm"
          disabled={loading}
          onClick={onAssign}
        >
          {loading ? "처리 중…" : "내가 배정"}
        </button>
      </td>
    </tr>
  );
}

function MineRow({
  booking,
  loading,
  visitConfirmedValue,
  visitConfirmedSaving,
  onVisitConfirmedChange,
  onVisitConfirmedSave,
  onComplete,
  onCancel,
  onReport,
}: {
  booking: ConsultationBooking;
  loading: boolean;
  visitConfirmedValue: string;
  visitConfirmedSaving: boolean;
  onVisitConfirmedChange: (v: string) => void;
  onVisitConfirmedSave: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReport: () => void;
}) {
  const hasMatch = Boolean(booking.match);
  const badge = booking.visitConfirmedAt
    ? { className: "bst acc", label: "방문 확정" }
    : booking.status === "COMPLETED"
      ? { className: "bst acc", label: "상담 완료" }
      : { className: "bst mut", label: "내 담당" };

  return (
    <tr>
      <td>
        <b>
          {booking.student.name} · {booking.student.grade}
          {booking.student.region ? ` · ${booking.student.region}` : ""}
        </b>
        <ContactLine booking={booking} />
        {booking.match ? (
          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--acc-text)" }}>
            배정 선생님: {booking.match.teacherName}
          </span>
        ) : null}
      </td>
      <td>
        {booking.student.subjects}
        {booking.visitConfirmedAt ? (
          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--acc-text)" }}>
            방문 확정: {formatDateWithWeekday(new Date(booking.visitConfirmedAt))}{" "}
            {new Date(booking.visitConfirmedAt).toLocaleTimeString("ko-KR", {
              timeZone: "Asia/Seoul",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : (
          <VisitPreferredBlock times={booking.visitPreferredTimes} />
        )}
        {booking.managerNote ? (
          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--mut)" }}>
            상담 메모: {booking.managerNote}
          </span>
        ) : null}
        {booking.status === "ASSIGNED" ? (
          <span style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
            <input
              type="datetime-local"
              className="inp filled"
              style={{ width: "auto", padding: "8px 10px", fontSize: "12.5px" }}
              value={visitConfirmedValue}
              onChange={(e) => onVisitConfirmedChange(e.target.value)}
            />
            <button
              type="button"
              className="btn sec sm"
              disabled={visitConfirmedSaving}
              onClick={onVisitConfirmedSave}
            >
              {visitConfirmedSaving ? "저장 중…" : "일시 저장"}
            </button>
          </span>
        ) : null}
      </td>
      <td>
        <span className={badge.className}>{badge.label}</span>
      </td>
      <td>
        {booking.status === "ASSIGNED" ? (
          <>
            <Link
              className="btn pri sm"
              href={`/teacher-portal/dashboard/matching?student=${booking.student.id}`}
            >
              {hasMatch ? "선생님 재배정" : "선생님 배정"}
            </Link>{" "}
            <button
              type="button"
              className="btn sec sm"
              disabled={loading || !hasMatch}
              title={hasMatch ? undefined : "선생님 배정 후 완료 처리할 수 있습니다"}
              onClick={onComplete}
            >
              완료 처리
            </button>{" "}
            <button
              type="button"
              className="btn ghost sm"
              disabled={loading}
              onClick={onCancel}
            >
              취소
            </button>{" "}
          </>
        ) : booking.status === "COMPLETED" ? (
          <>
            <Link
              className="btn sec sm"
              href={`/teacher-portal/dashboard/matching?student=${booking.student.id}`}
            >
              선생님 재배정
            </Link>{" "}
          </>
        ) : null}
        <button type="button" className="btn ghost sm" onClick={onReport}>
          리포트
        </button>
      </td>
    </tr>
  );
}
