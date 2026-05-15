"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatConsultationDateLabel, formatCalendarDayLabel } from "@/lib/study-plan-dates";
import { shiftWeekStart, getWeekRange } from "@/lib/manager-stats";
import { addMinutesToTime, SLOT_TIME_OPTIONS } from "@/lib/slot-times";
import { todayDateKey } from "@/lib/study-plan-dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

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
  managerNote: string | null;
  student: { id: string; name: string; grade: string };
  slot: { date: string; startTime: string; endTime: string };
};

const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "대기", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "확정", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "완료", className: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "취소", className: "bg-gray-100 text-gray-600" },
};

type Tab = "slots" | "bookings";

export function ManagerConsultationsPage() {
  const [tab, setTab] = useState<Tab>("slots");
  const [weekStart, setWeekStart] = useState(() => getWeekRange().start);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [slotDate, setSlotDate] = useState(todayDateKey());
  const [startTime, setStartTime] = useState("14:00");
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([2, 4]);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  const [completeModal, setCompleteModal] = useState<Booking | null>(null);
  const [managerNote, setManagerNote] = useState("");

  const endTime = addMinutesToTime(startTime, 30);

  const fetchSlots = useCallback(async () => {
    const res = await fetch(
      `/api/manager/slots?weekStart=${encodeURIComponent(weekStart)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots);
    }
  }, [weekStart]);

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/manager/bookings");
    if (res.ok) {
      const data = (await res.json()) as { bookings: Booking[] };
      setBookings(data.bookings);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSlots(), fetchBookings()]);
    setLoading(false);
  }, [fetchSlots, fetchBookings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [slots]);

  const weekLabel = useMemo(() => {
    const end = shiftWeekStart(weekStart, 1);
    const endD = new Date(`${end}T12:00:00`);
    endD.setDate(endD.getDate() - 1);
    const endKey = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`;
    return `${formatCalendarDayLabel(weekStart).replace(/ \(\w\)$/, "")} ~ ${formatCalendarDayLabel(endKey)}`;
  }, [weekStart]);

  async function handleAddSlots() {
    setSaving(true);
    try {
      const res = await fetch("/api/manager/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: slotDate,
          startTime,
          repeat,
          weekdays: repeat ? weekdays : undefined,
          weeks: repeat ? repeatWeeks : undefined,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        await fetchSlots();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm("이 슬롯을 삭제할까요?")) return;
    const res = await fetch(`/api/manager/slots/${id}`, { method: "DELETE" });
    if (res.ok) await fetchSlots();
  }

  async function patchBooking(
    id: string,
    status: string,
    note?: string,
  ) {
    const res = await fetch(`/api/manager/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, managerNote: note }),
    });
    if (res.ok) {
      setCompleteModal(null);
      setManagerNote("");
      await fetchBookings();
      if (status === "CANCELLED") await fetchSlots();
    }
  }

  function toggleWeekday(d: number) {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-text-dark sm:text-3xl">상담 관리</h1>
      <p className="mt-2 text-sm text-text-mid">상담 슬롯과 예약을 관리합니다.</p>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {(["slots", "bookings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-gold text-text-dark"
                : "border-transparent text-text-mid"
            }`}
          >
            {t === "slots" ? "슬롯 관리" : "예약 현황"}
          </button>
        ))}
      </div>

      {tab === "slots" ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekStart((w) => shiftWeekStart(w, -1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              >
                ←
              </button>
              <span className="text-sm font-medium text-text-dark">{weekLabel}</span>
              <button
                type="button"
                onClick={() => setWeekStart((w) => shiftWeekStart(w, 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
            >
              슬롯 추가
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-text-mid">불러오는 중…</p>
          ) : slots.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-text-mid">
              이번 주 등록된 슬롯이 없습니다.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {Array.from(slotsByDate.entries()).map(([date, daySlots]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-navy">
                    {formatConsultationDateLabel(date)}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {daySlots.map((slot) => (
                      <li
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-card px-4 py-3"
                      >
                        <span className="text-sm font-medium text-text-dark">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              slot.isBooked
                                ? "bg-gray-100 text-gray-500"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {slot.isBooked ? "booked" : "available"}
                          </span>
                          {!slot.isBooked ? (
                            <button
                              type="button"
                              onClick={() => void deleteSlot(slot.id)}
                              className="text-xs text-accent hover:underline"
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-text-mid">불러오는 중…</p>
          ) : bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-text-mid">
              예약이 없습니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => {
                const st = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.PENDING;
                return (
                  <li
                    key={b.id}
                    className="rounded-2xl border border-gray-200 bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-text-dark">
                          {b.student.name}{" "}
                          <span className="text-sm font-normal text-text-mid">
                            ({b.student.grade})
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-text-mid">
                          {formatConsultationDateLabel(b.slot.date)}{" "}
                          {b.slot.startTime} – {b.slot.endTime}
                        </p>
                        {b.note ? (
                          <p className="mt-2 text-sm text-text-mid">
                            학생 메모: {b.note}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => void patchBooking(b.id, "CONFIRMED")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          확정
                        </button>
                      ) : null}
                      {b.status === "CONFIRMED" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteModal(b);
                            setManagerNote("");
                          }}
                          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white"
                        >
                          상담 완료
                        </button>
                      ) : null}
                      {b.status !== "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={() => void patchBooking(b.id, "CANCELLED")}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-text-mid"
                        >
                          취소
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-navy">슬롯 추가</h2>
            <label className="mt-4 block text-xs font-semibold text-text-light">
              날짜
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-text-light">
              시작 시간
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                {SLOT_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-text-mid">종료: {endTime}</p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
              />
              반복 추가
            </label>
            {repeat ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(i)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        weekdays.includes(i)
                          ? "bg-gold text-white"
                          : "bg-gray-100 text-text-mid"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="block text-xs text-text-light">
                  {repeatWeeks}주간
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              </div>
            ) : null}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleAddSlots()}
                className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {completeModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-navy">상담 완료</h2>
            <p className="mt-1 text-sm text-text-mid">
              {completeModal.student.name} ·{" "}
              {formatConsultationDateLabel(completeModal.slot.date)}
            </p>
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              rows={4}
              placeholder="상담 메모 (내부용)"
              className="mt-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gold"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCompleteModal(null)}
                className="flex-1 rounded-xl border py-2.5 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() =>
                  void patchBooking(completeModal.id, "COMPLETED", managerNote)
                }
                className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-white"
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
