"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getNextWeekDates,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

type ConsultationBooking = {
  id: string;
  status: "WAITING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  managerNote?: string | null;
  preferredTimes: string[];
  visitPreferredTimes: VisitTimesByDate;
  createdAt: string;
  timeAgo?: string;
  assignedAt?: string | null;
  assignedAgo?: string | null;
  student: {
    id: string;
    name: string;
    grade: string;
    subjects: string;
  };
};

type Tab = "waiting" | "mine";

const STATUS_BADGES = {
  ASSIGNED: { label: "배정 완료", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "상담 완료", className: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "취소됨", className: "bg-gray-100 text-gray-600" },
  WAITING: { label: "대기중", className: "bg-amber-100 text-amber-800" },
} as const;

export function ManagerConsultationsPage() {
  const [tab, setTab] = useState<Tab>("waiting");
  const [waiting, setWaiting] = useState<ConsultationBooking[]>([]);
  const [mine, setMine] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] =
    useState<ConsultationBooking | null>(null);
  const [managerNote, setManagerNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const waitingIdsRef = useRef<Set<string>>(new Set());
  const initializedWaitingRef = useRef(false);

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
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWaiting(), fetchMine()]);
    setLoading(false);
  }, [fetchWaiting, fetchMine]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (tab !== "waiting") return;
    const interval = window.setInterval(() => void fetchWaiting(true), 30_000);
    return () => window.clearInterval(interval);
  }, [tab, fetchWaiting]);

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

  return (
    <div>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl bg-surface px-5 py-3 text-sm font-medium text-white shadow-lg"
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

      <div className="mt-6 flex gap-2 border-b border-gray-200">
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
                onComplete={() => {
                  setCompleteTarget(booking);
                  setManagerNote("");
                }}
                onCancel={() => void cancelBooking(booking)}
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
          </p>
          <p className="mt-1 text-sm text-primary">{booking.student.subjects}</p>
        </div>
        <span className="shrink-0 text-xs text-text-muted">
          {booking.timeAgo}
        </span>
      </div>
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
  onComplete,
  onCancel,
}: {
  booking: ConsultationBooking;
  loading: boolean;
  onComplete: () => void;
  onCancel: () => void;
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
          </p>
          <p className="mt-1 text-sm text-primary">{booking.student.subjects}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
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

      {booking.status === "ASSIGNED" ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onComplete}
            className="flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
    </li>
  );
}
