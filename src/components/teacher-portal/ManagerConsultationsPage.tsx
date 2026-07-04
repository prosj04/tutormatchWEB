"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ManagerConsultationBooking } from "@/lib/manager-portal-data";
import type { ConsultationGoals } from "@/lib/consultation-report";
import {
  getNextWeekDates,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

type ConsultationBooking = ManagerConsultationBooking;

type Tab = "waiting" | "mine";

const STATUS_BADGES = {
  ASSIGNED: { label: "배정 완료", className: "badge-status-assigned" },
  COMPLETED: { label: "상담 완료", className: "badge-status-completed" },
  CANCELLED: { label: "취소됨", className: "badge-status-cancelled" },
  WAITING: { label: "대기중", className: "badge-status-waiting" },
} as const;

type ManagerConsultationsPageProps = {
  initialWaiting: ConsultationBooking[];
  initialMine: ConsultationBooking[];
  initialMineLoaded?: boolean;
};

export function ManagerConsultationsPage({
  initialWaiting,
  initialMine,
  initialMineLoaded = true,
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

  return (
    <div>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl bg-text-primary px-5 py-3 text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">
        상담 관리
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        상담 신청 학생을 선착순으로 담당하고 상담 완료 처리합니다.
      </p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {(["waiting", "mine"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key
                ? "border-primary text-text-primary"
                : "border-transparent text-text-secondary"
            }`}
          >
            {key === "waiting" ? "대기 중" : "내 담당"}
          </button>
        ))}
      </div>

      <section className="mt-6">
        {loading ? (
          <p className="text-sm text-text-secondary">불러오는 중...</p>
        ) : tab === "waiting" ? (
          waiting.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center text-sm text-text-secondary">
              현재 대기 중인 학생이 없습니다.
            </p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {waiting.map((booking) => (
                <WaitingCard
                  key={booking.id}
                  booking={booking}
                  loading={actionLoading === booking.id}
                  onAssign={() => void assignBooking(booking)}
                />
              ))}
            </ul>
          )
        ) : mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center text-sm text-text-secondary">
            담당 중인 상담이 없습니다.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {mine.map((booking) => (
              <MineCard
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
          </ul>
        )}
      </section>

      {completeTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-text-primary">상담 완료</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {completeTarget.student.name} 학생 상담을 완료 처리합니다.
            </p>
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              rows={5}
              placeholder="상담 메모 (내부용, 매칭 시 참고)"
              className="mt-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCompleteTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!managerNote.trim() || actionLoading === completeTarget.id}
                onClick={() => void completeBooking()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                완료 처리
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl max-h-[90vh]">
            <h2 className="text-lg font-bold text-text-primary">상담 리포트</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {reportTarget.student.name} 학생 — 목표 및 수준 기록
            </p>

            {reportLoading ? (
              <p className="mt-6 text-center text-sm text-text-muted">불러오는 중...</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary">
                    정량 목표 (한 줄에 하나, 최대 10개)
                  </label>
                  <textarea
                    value={reportGoals.quantitative.join("\n")}
                    onChange={(e) =>
                      handleGoalListChange("quantitative", e.target.value)
                    }
                    rows={4}
                    placeholder={"예) 수학 3등급 달성\n예) 영어 모의고사 85점 이상"}
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary">
                    정성 목표 (한 줄에 하나, 최대 10개)
                  </label>
                  <textarea
                    value={reportGoals.qualitative.join("\n")}
                    onChange={(e) =>
                      handleGoalListChange("qualitative", e.target.value)
                    }
                    rows={4}
                    placeholder={"예) 자기주도 학습 습관 형성\n예) 개념 이해 중심 공부 전환"}
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary">
                    과목별 현재 수준 (형식: &quot;과목: 수준&quot;, 한 줄에 하나)
                  </label>
                  <textarea
                    value={reportSubjectLevels}
                    onChange={(e) => setReportSubjectLevels(e.target.value)}
                    rows={3}
                    placeholder={"예) 수학: 중학교 3학년 수준\n예) 영어: 기초 문법 숙지"}
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary">
                    추천 플랜
                  </label>
                  <textarea
                    value={reportRecommendedPlan}
                    onChange={(e) => setReportRecommendedPlan(e.target.value)}
                    rows={3}
                    placeholder="주 2회 수학 집중, 월 1회 영어 점검 등"
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary">
                    메모 (내부용)
                  </label>
                  <textarea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={3}
                    placeholder="특이사항, 학부모 요청사항 등"
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm"
              >
                닫기
              </button>
              {!reportLoading && (
                <button
                  type="button"
                  disabled={reportSaving}
                  onClick={() => void saveReport()}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {reportSaving ? "저장 중..." : "저장"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VisitPreferredBlock({ times }: { times: VisitTimesByDate }) {
  const weekLabels = Object.fromEntries(
    getNextWeekDates().map((d) => [d.key, `${d.label}(${d.weekday})`]),
  );
  const entries = Object.entries(times).filter(([, slots]) => slots.length > 0);
  if (entries.length === 0) {
    return (
      <p className="mt-3 text-xs text-amber-700">
        방문 상담 희망 시간 미입력 — 학생에게 입력을 요청해 주세요.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-xs font-semibold text-primary">방문 상담 희망 시간</p>
      <ul className="mt-2 space-y-1.5 text-sm text-text-primary">
        {entries.map(([date, slots]) => (
          <li key={date}>
            <span className="font-semibold">{weekLabels[date] ?? date}</span>
            <span className="text-text-secondary"> · {slots.join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ParentContactBlock({ booking }: { booking: ConsultationBooking }) {
  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <p className="text-xs font-semibold text-blue-700">연락처</p>
      <p className="mt-1">학생: {booking.student.phone}</p>
      {booking.student.guardianPhone ? (
        <p className="mt-1">부모님: {booking.student.guardianPhone}</p>
      ) : (
        <p className="mt-1 text-blue-700">부모님 연락처 미입력</p>
      )}
    </div>
  );
}

function WaitingCard({
  booking,
  loading,
  onAssign,
}: {
  booking: ConsultationBooking;
  loading: boolean;
  onAssign: () => void;
}) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text-primary">
            {booking.student.name}
            <span className="ml-2 text-sm font-normal text-text-secondary">
              {booking.student.grade}
            </span>
            {booking.student.region ? (
              <span className="ml-2 text-sm font-normal text-text-secondary">
                · {booking.student.region}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-primary">{booking.student.subjects}</p>
        </div>
        <span className="shrink-0 text-xs text-text-muted">
          {booking.timeAgo}
        </span>
      </div>
      <ParentContactBlock booking={booking} />
      <VisitPreferredBlock times={booking.visitPreferredTimes} />
      {booking.note ? (
        <p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-text-secondary">
          {booking.note}
        </p>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={onAssign}
        className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "처리 중..." : "담당하기"}
      </button>
    </li>
  );
}

function MineCard({
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
  const badge = STATUS_BADGES[booking.status] ?? STATUS_BADGES.ASSIGNED;

  return (
    <li className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text-primary">
            {booking.student.name}
            <span className="ml-2 text-sm font-normal text-text-secondary">
              {booking.student.grade}
            </span>
            {booking.student.region ? (
              <span className="ml-2 text-sm font-normal text-text-secondary">
                · {booking.student.region}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-primary">{booking.student.subjects}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <ParentContactBlock booking={booking} />
      <VisitPreferredBlock times={booking.visitPreferredTimes} />
      {booking.note ? (
        <p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-text-secondary">
          학생 메모: {booking.note}
        </p>
      ) : null}
      {booking.managerNote ? (
        <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          상담 메모: {booking.managerNote}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-text-muted">
        배정 시각: {booking.assignedAgo ?? "-"}
      </p>

      {booking.visitConfirmedAt ? (
        <p className="mt-2 text-xs font-medium text-primary">
          방문 상담 확정: {new Date(booking.visitConfirmedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2 items-center">
        <input
          type="datetime-local"
          value={visitConfirmedValue}
          onChange={(e) => onVisitConfirmedChange(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={visitConfirmedSaving}
          onClick={onVisitConfirmedSave}
          className="shrink-0 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {visitConfirmedSaving ? "저장 중…" : "일시 저장"}
        </button>
      </div>

      {booking.status === "ASSIGNED" ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onComplete}
            className="flex-1 rounded-xl bg-text-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            완료 처리
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-text-secondary disabled:opacity-50"
          >
            취소
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onReport}
        className="mt-3 w-full rounded-xl border border-primary/30 bg-primary/5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
      >
        상담 리포트
      </button>
    </li>
  );
}
