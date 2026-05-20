"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { VisitTimesPicker } from "@/components/dashboard/VisitTimesPicker";
import type { ConsultationBookingDto } from "@/lib/consultation-booking-dto";
import {
  countVisitSlots,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

type Booking = ConsultationBookingDto;

const STATUS_LABELS = {
  WAITING: {
    label: "매니저 배정 대기중",
    className: "bg-amber-100 text-amber-800",
    body: "매니저 배정 후 방문 상담 희망 시간을 안내해 주세요.",
  },
  ASSIGNED: {
    label: "매니저 배정 완료",
    className: "bg-green-100 text-green-800",
    body: "담당 매니저가 입력하신 방문 시간을 참고하여 연락드립니다.",
  },
  COMPLETED: {
    label: "상담 완료",
    className: "bg-blue-100 text-blue-800",
    body: "선생님 매칭을 진행 중입니다.",
  },
  CANCELLED: {
    label: "취소됨",
    className: "bg-gray-100 text-gray-600",
    body: "상담 신청이 취소되었습니다.",
  },
} as const;

type ConsultationBookingPageProps = {
  studentName: string;
  /** 서버에서 내려줘 첫 페인트에 상담 상태 반영 (깜빡임 방지) */
  initialBooking: ConsultationBookingDto | null;
  /** URL ?visit=1 — 서버에서 해석 */
  openVisitFromUrl?: boolean;
};

export function ConsultationBookingPage({
  studentName,
  initialBooking,
  openVisitFromUrl = false,
}: ConsultationBookingPageProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [assignedToast, setAssignedToast] = useState(false);
  const previousStatus = useRef<string | null>(initialBooking?.status ?? null);

  const fetchBooking = useCallback(async () => {
    const res = await fetch("/api/consultation/my-booking");
    if (!res.ok) return;
    const data = (await res.json()) as { booking: Booking | null };

    setBooking((prev) => {
      const before = previousStatus.current ?? prev?.status ?? null;
      if (before === "WAITING" && data.booking?.status === "ASSIGNED") {
        setAssignedToast(true);
        window.setTimeout(() => setAssignedToast(false), 4000);
      }
      previousStatus.current = data.booking?.status ?? null;
      return data.booking;
    });
  }, []);

  useEffect(() => {
    void fetchBooking();
    const interval = window.setInterval(() => void fetchBooking(), 30_000);
    return () => window.clearInterval(interval);
  }, [fetchBooking]);

  useEffect(() => {
    if (openVisitFromUrl) setShowVisitPicker(true);
  }, [openVisitFromUrl]);

  async function submitRequest() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/consultation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "상담 신청에 실패했습니다.");
        return;
      }
      setSuccess(true);
      setShowVisitPicker(true);
      await fetchBooking();
    } catch {
      setError("상담 신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveVisitTimes(times: VisitTimesByDate) {
    setVisitSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/consultation/visit-times", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitPreferredTimes: times }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setShowVisitPicker(false);
      await fetchBooking();
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setVisitSubmitting(false);
    }
  }

  const activeBooking =
    booking && booking.status !== "CANCELLED" ? booking : null;
  const hasVisitTimes =
    activeBooking && countVisitSlots(activeBooking.visitPreferredTimes) > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-text-primary/10 bg-surface px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/" className="font-sans text-lg font-bold italic text-primary">
            Concord.
          </Link>
          <p className="truncate text-sm font-medium text-white">{studentName}님 환영합니다</p>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-primary/90 transition hover:bg-white/10 hover:text-primary"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        <AnimatePresence>
          {assignedToast ? (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center font-semibold text-green-800 shadow-sm"
            >
              매니저가 배정되었습니다!
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!activeBooking ? (
          <>
            <section className="rounded-2xl border-2 border-primary bg-surface p-6 shadow-sm">
              <h1 className="text-lg font-bold text-text-primary">수업 시작 전 상담을 신청해주세요</h1>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                상담 신청 후 방문 상담 희망 시간대를 입력해 주세요. 매니저가 확인 후 연락드립니다.
              </p>
            </section>

            <section className="mt-8 rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm">
              <label htmlFor="consultation-note" className="block text-sm font-semibold text-text-primary">
                상담 내용 미리 적기 (선택)
              </label>
              <textarea
                id="consultation-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="학년, 목표 성적, 고민 등을 적어주시면 더 도움이 되는 상담이 가능합니다."
              />
              {error ? (
                <p className="mt-3 text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitRequest()}
                className="mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "신청 중..." : "상담 신청하기"}
              </button>
            </section>
          </>
        ) : (
          <>
            {success ? (
              <motion.section
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 rounded-2xl border-2 border-primary bg-surface p-8 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-2xl text-primary">
                  ✓
                </div>
                <h1 className="text-xl font-bold text-text-primary">상담 신청이 완료되었습니다</h1>
                <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                  아래에서 방문 상담 희망 시간대를 입력해 주세요.
                </p>
              </motion.section>
            ) : null}

            <BookingStatusCard booking={activeBooking} hasVisitTimes={!!hasVisitTimes} />

            {!showVisitPicker && !hasVisitTimes ? (
              <button
                type="button"
                onClick={() => setShowVisitPicker(true)}
                className="mt-6 w-full rounded-xl border-2 border-primary bg-primary/5 py-4 text-sm font-black text-primary transition hover:bg-primary/10"
              >
                방문 상담 희망 시간대 입력
              </button>
            ) : null}

            {showVisitPicker ? (
              <div className="mt-6">
                <VisitTimesPicker
                  initial={activeBooking.visitPreferredTimes}
                  onSubmit={saveVisitTimes}
                  submitting={visitSubmitting}
                />
                {hasVisitTimes ? (
                  <button
                    type="button"
                    onClick={() => setShowVisitPicker(false)}
                    className="mt-3 w-full text-center text-sm font-medium text-text-muted hover:text-text-primary"
                  >
                    닫기
                  </button>
                ) : null}
              </div>
            ) : null}

            {hasVisitTimes && !showVisitPicker ? (
              <button
                type="button"
                onClick={() => setShowVisitPicker(true)}
                className="mt-4 w-full text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                방문 상담 희망 시간대 수정
              </button>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm text-accent" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function BookingStatusCard({
  booking,
  hasVisitTimes,
}: {
  booking: Booking;
  hasVisitTimes: boolean;
}) {
  const status = STATUS_LABELS[booking.status];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">내 상담 현황</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <p className="mt-4 text-sm text-text-secondary">{status.body}</p>

      {booking.status === "ASSIGNED" && booking.manager ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white">
            {booking.manager.photoUrl ? (
              <Image
                src={booking.manager.photoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-bold text-text-primary/40">
                {booking.manager.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{booking.manager.name} 매니저</p>
            <p className="text-xs text-text-secondary">담당 매니저</p>
          </div>
        </div>
      ) : null}

      {booking.note ? (
        <p className="mt-5 rounded-xl bg-background px-4 py-3 text-sm text-text-secondary">
          {booking.note}
        </p>
      ) : null}

      {hasVisitTimes ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            방문 상담 희망 시간
          </p>
          <div className="mt-2 space-y-2">
            {Object.entries(booking.visitPreferredTimes).map(([date, slots]) =>
              slots.length > 0 ? (
                <div key={date} className="rounded-lg bg-background px-3 py-2 text-sm">
                  <span className="font-semibold text-text-primary">{date}</span>
                  <span className="ml-2 text-text-secondary">{slots.join(", ")}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-amber-700">
          방문 상담 희망 시간대를 입력해 주세요.
        </p>
      )}
    </motion.section>
  );
}
