"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatConsultationDateLabel } from "@/lib/study-plan-dates";

type Manager = {
  id: string;
  name: string;
  subjects: string;
  intro: string;
  photoUrl: string | null;
};

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

type Booking = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  managerName: string;
  slot: { date: string; startTime: string; endTime: string };
};

const STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "확인 대기중", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "예약 확정", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "상담 완료", className: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "취소됨", className: "bg-gray-100 text-gray-600" },
};

function groupSlotsByDate(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const list = map.get(slot.date) ?? [];
    list.push(slot);
    map.set(slot.date, list);
  }
  return map;
}

type ConsultationBookingPageProps = {
  studentName: string;
};

export function ConsultationBookingPage({
  studentName,
}: ConsultationBookingPageProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedManagerId, setExpandedManagerId] = useState<string | null>(
    null,
  );
  const [slotsCache, setSlotsCache] = useState<Record<string, Slot[]>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  const activeBooking = successBooking ?? myBooking;
  const hasActiveBooking =
    activeBooking != null &&
    (activeBooking.status === "PENDING" ||
      activeBooking.status === "CONFIRMED");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [managersRes, bookingRes] = await Promise.all([
        fetch("/api/consultation/managers"),
        fetch("/api/consultation/my-booking"),
      ]);
      if (managersRes.ok) {
        const data = (await managersRes.json()) as { managers: Manager[] };
        setManagers(data.managers);
      }
      if (bookingRes.ok) {
        const data = (await bookingRes.json()) as { booking: Booking | null };
        setMyBooking(data.booking);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const fetchSlots = useCallback(
    async (managerId: string) => {
      setSlotsLoading(true);
      try {
        const res = await fetch(
          `/api/consultation/slots?managerId=${encodeURIComponent(managerId)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { slots: Slot[] };
          setSlotsCache((prev) => ({ ...prev, [managerId]: data.slots }));
        }
      } finally {
        setSlotsLoading(false);
      }
    },
    [],
  );

  const toggleManager = (managerId: string) => {
    if (hasActiveBooking || successBooking) return;
    if (expandedManagerId === managerId) {
      setExpandedManagerId(null);
      setSelectedSlot(null);
      setNote("");
      setSubmitError(null);
      return;
    }
    setExpandedManagerId(managerId);
    setSelectedSlot(null);
    setNote("");
    setSubmitError(null);
    if (!slotsCache[managerId]) {
      void fetchSlots(managerId);
    }
  };

  const expandedSlots = expandedManagerId
    ? slotsCache[expandedManagerId] ?? []
    : [];
  const slotsByDate = useMemo(
    () => groupSlotsByDate(expandedSlots),
    [expandedSlots],
  );

  const handleBook = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/consultation/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id, note }),
      });
      const data = (await res.json()) as {
        error?: string;
        booking?: {
          id: string;
          status: string;
          managerName: string;
          slot: { date: string; startTime: string; endTime: string };
        };
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "예약에 실패했습니다.");
        return;
      }
      if (data.booking) {
        const booked: Booking = {
          id: data.booking.id,
          status: data.booking.status,
          note: note.trim() || null,
          createdAt: new Date().toISOString(),
          managerName: data.booking.managerName,
          slot: data.booking.slot,
        };
        setSuccessBooking(booked);
        setMyBooking(booked);
        setExpandedManagerId(null);
        setSelectedSlot(null);
        if (expandedManagerId) {
          void fetchSlots(expandedManagerId);
        }
      }
    } catch {
      setSubmitError("예약에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayBooking = successBooking ?? myBooking;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-navy px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-lg font-bold italic text-gold"
          >
            Concord.
          </Link>
          <p className="truncate text-sm font-medium text-white">
            {studentName}님 환영합니다
          </p>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gold/90 transition hover:bg-white/10 hover:text-gold"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        {successBooking ? (
          <section className="rounded-2xl border-2 border-gold bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-2xl text-gold">
              ✓
            </div>
            <h1 className="text-xl font-bold text-navy">상담이 예약되었습니다</h1>
            <p className="mt-3 text-lg font-semibold text-text-dark">
              {formatConsultationDateLabel(successBooking.slot.date)}{" "}
              {successBooking.slot.startTime} – {successBooking.slot.endTime}
            </p>
            <p className="mt-2 text-sm text-text-mid">
              {successBooking.managerName} 매니저 선생님
            </p>
            <p className="mt-6 text-sm text-text-mid">
              매니저 선생님이 확인 후 연락드립니다.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border-2 border-gold bg-card p-6 shadow-sm">
              <h1 className="text-lg font-bold text-navy">
                수업 시작 전 상담을 예약해주세요
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-text-mid">
                매니저 선생님과 1:1 상담 후 최적의 선생님을 배정해드립니다.
              </p>
            </section>

            {hasActiveBooking ? (
              <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
                진행 중인 상담 예약이 있습니다. 아래에서 예약 현황을 확인해주세요.
              </p>
            ) : null}

            <section className="mt-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-mid">
                매니저 선생님
              </h2>

              {loading ? (
                <p className="text-center text-sm text-text-mid">불러오는 중…</p>
              ) : managers.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-card p-6 text-center text-sm text-text-mid">
                  현재 예약 가능한 매니저가 없습니다. 잠시 후 다시 확인해주세요.
                </p>
              ) : (
                <ul className="space-y-4">
                  {managers.map((manager) => {
                    const expanded = expandedManagerId === manager.id;
                    return (
                      <li
                        key={manager.id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-sm"
                      >
                        <div className="flex gap-4 p-5">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-navy/5">
                            {manager.photoUrl ? (
                              <Image
                                src={manager.photoUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-navy/30">
                                {manager.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-text-dark">
                              {manager.name}
                            </p>
                            <p className="mt-0.5 text-xs text-gold">
                              {manager.subjects}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm text-text-mid">
                              {manager.intro}
                            </p>
                          </div>
                        </div>
                        {!hasActiveBooking ? (
                          <div className="border-t border-gray-100 px-5 pb-5 pt-3">
                            <button
                              type="button"
                              onClick={() => toggleManager(manager.id)}
                              className="w-full rounded-xl border border-gold bg-gold/10 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold/20"
                            >
                              {expanded ? "닫기" : "상담 예약하기"}
                            </button>
                          </div>
                        ) : null}

                        {expanded && !hasActiveBooking ? (
                          <div className="border-t border-gray-100 bg-background/50 px-5 py-4">
                            {slotsLoading && !slotsCache[manager.id] ? (
                              <p className="text-center text-sm text-text-mid">
                                시간표 불러오는 중…
                              </p>
                            ) : expandedSlots.length === 0 ? (
                              <p className="text-center text-sm text-text-mid">
                                예약 가능한 시간이 없습니다.
                              </p>
                            ) : (
                              <div className="space-y-5">
                                {Array.from(slotsByDate.entries()).map(
                                  ([date, daySlots]) => (
                                    <div key={date}>
                                      <p className="text-sm font-semibold text-navy">
                                        {formatConsultationDateLabel(date)}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {daySlots.map((slot) => {
                                          const selected =
                                            selectedSlot?.id === slot.id;
                                          if (slot.isBooked) {
                                            return (
                                              <span
                                                key={slot.id}
                                                className="cursor-not-allowed rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-400"
                                              >
                                                {slot.startTime}
                                              </span>
                                            );
                                          }
                                          return (
                                            <button
                                              key={slot.id}
                                              type="button"
                                              onClick={() => {
                                                setSelectedSlot(slot);
                                                setSubmitError(null);
                                              }}
                                              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                                selected
                                                  ? "bg-gold text-white shadow-sm"
                                                  : "bg-gold/15 text-navy hover:bg-gold/30"
                                              }`}
                                            >
                                              {slot.startTime}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ),
                                )}

                                {selectedSlot ? (
                                  <div className="rounded-xl border border-gold/30 bg-card p-4">
                                    <label
                                      htmlFor="consultation-note"
                                      className="text-sm font-medium text-text-dark"
                                    >
                                      상담 시 전달할 내용을 적어주세요 (선택)
                                    </label>
                                    <textarea
                                      id="consultation-note"
                                      value={note}
                                      onChange={(e) => setNote(e.target.value)}
                                      rows={3}
                                      className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                                      placeholder="궁금한 점이나 학습 목표를 적어주세요"
                                    />
                                    {submitError ? (
                                      <p
                                        className="mt-2 text-sm text-accent"
                                        role="alert"
                                      >
                                        {submitError}
                                      </p>
                                    ) : null}
                                    <button
                                      type="button"
                                      disabled={submitting}
                                      onClick={() => void handleBook()}
                                      className="mt-3 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition hover:bg-gold/90 disabled:opacity-50"
                                    >
                                      {submitting ? "예약 중…" : "예약 확정"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {displayBooking ? (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text-dark">내 예약 현황</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  STATUS_LABELS[displayBooking.status]?.className ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[displayBooking.status]?.label ??
                  displayBooking.status}
              </span>
            </div>
            <p className="mt-3 font-medium text-text-dark">
              {formatConsultationDateLabel(displayBooking.slot.date)}{" "}
              {displayBooking.slot.startTime} – {displayBooking.slot.endTime}
            </p>
            <p className="mt-1 text-sm text-text-mid">
              {displayBooking.managerName} 매니저
            </p>
            {displayBooking.note ? (
              <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm text-text-mid">
                {displayBooking.note}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
