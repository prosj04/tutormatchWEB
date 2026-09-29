"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { VisitTimesPicker } from "@/components/dashboard/VisitTimesPicker";
import { trackEvent } from "@/lib/analytics-client";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import type { ConsultationBookingDto } from "@/lib/consultation-booking-dto";
import {
  countVisitSlots,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";
import { CONSULTATION_STATUS_COPY } from "@/lib/student-journey";

type Booking = ConsultationBookingDto;

const STATUS_BADGE_CLASS: Record<Booking["status"], string> = {
  WAITING: "badge-status-waiting",
  ASSIGNED: "badge-status-assigned",
  COMPLETED: "badge-status-completed",
  CANCELLED: "badge-status-cancelled",
};

const STATUS_CMS_KEYS: Record<Booking["status"], { label: string; body: string }> = {
  WAITING: { label: "st_waiting_label", body: "st_waiting_body" },
  ASSIGNED: { label: "st_assigned_label", body: "st_assigned_body" },
  COMPLETED: { label: "st_completed_label", body: "st_completed_body" },
  CANCELLED: { label: "st_cancelled_label", body: "st_cancelled_body" },
};

const STATUS_FALLBACK_LABEL: Record<Booking["status"], string> = {
  WAITING: CONSULTATION_STATUS_COPY.WAITING.label,
  ASSIGNED: CONSULTATION_STATUS_COPY.ASSIGNED.label,
  COMPLETED: CONSULTATION_STATUS_COPY.COMPLETED.label,
  CANCELLED: CONSULTATION_STATUS_COPY.CANCELLED.label,
};

const STATUS_FALLBACK_BODY: Record<Booking["status"], string> = {
  WAITING: CONSULTATION_STATUS_COPY.WAITING.body,
  ASSIGNED: CONSULTATION_STATUS_COPY.ASSIGNED.body,
  COMPLETED: CONSULTATION_STATUS_COPY.COMPLETED.body,
  CANCELLED: CONSULTATION_STATUS_COPY.CANCELLED.body,
};

type PendingMatch = {
  matchId: string;
  subjects: string;
  teacherName: string;
  matchReason?: string | null;
};

type ConsultationBookingPageProps = {
  studentName: string;
  /** 서버에서 내려줘 첫 페인트에 상담 상태 반영 (깜빡임 방지) */
  initialBooking: ConsultationBookingDto | null;
  /** URL ?visit=1 — 서버에서 해석 */
  openVisitFromUrl?: boolean;
  /** 아직 학생이 수락하지 않은 배정 선생님 (있으면 수락 카드 노출) */
  initialPendingMatch?: PendingMatch | null;
};

export function ConsultationBookingPage({
  studentName,
  initialBooking,
  openVisitFromUrl = false,
  initialPendingMatch = null,
}: ConsultationBookingPageProps) {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("cms_edit") === "1";
  // A1: 가입 시 자동 접수된 상담을 1회 안내 (?applied=1)
  const [showAppliedBanner, setShowAppliedBanner] = useState(
    () => searchParams.get("applied") === "1",
  );
  const appliedBannerText = usePortalCopy(
    "student_consultation",
    "applied_banner",
    "상담이 접수되었어요 — 담당 매니저 배정 후 연락드립니다.",
  );
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [assignedToast, setAssignedToast] = useState(false);
  const [pendingMatch, setPendingMatch] = useState(initialPendingMatch);
  const [acceptedMatch, setAcceptedMatch] = useState<PendingMatch | null>(null);
  const [acceptingMatch, setAcceptingMatch] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const previousStatus = useRef<string | null>(initialBooking?.status ?? null);
  const statusCardRef = useRef<HTMLDivElement | null>(null);

  const brand = usePortalCopy("student_consultation", "brand", "Concord.");
  const welcomeTpl = usePortalCopy("student_consultation", "welcome_template", "{name}님 환영합니다");
  const logoutLabel = usePortalCopy("student_consultation", "logout", "로그아웃");
  const toastAssigned = usePortalCopy("student_consultation", "toast_assigned", "매니저가 배정되었습니다");
  const noBookingTitle = usePortalCopy(
    "student_consultation",
    "no_booking_title",
    "수업 시작 전 상담을 신청해주세요",
  );
  const noBookingDesc = usePortalCopy(
    "student_consultation",
    "no_booking_desc",
    "상담 신청 후 방문 상담 희망 시간대를 입력해 주세요. 매니저가 확인 후 연락드립니다.",
  );
  const noteLabel = usePortalCopy("student_consultation", "note_label", "상담 내용 미리 적기 (선택)");
  const notePlaceholder = usePortalCopy(
    "student_consultation",
    "note_placeholder",
    "학년, 목표 성적, 고민 등을 적어주시면 더 도움이 되는 상담이 가능합니다.",
  );
  const btnSubmit = usePortalCopy("student_consultation", "btn_submit", "상담 신청하기");
  const btnSubmitting = usePortalCopy("student_consultation", "btn_submitting", "신청 중...");
  const errSubmitDefault = usePortalCopy("student_consultation", "err_submit", "상담 신청에 실패했습니다.");
  const errSubmitNetwork = usePortalCopy(
    "student_consultation",
    "err_submit_network",
    "상담 신청에 실패했습니다. 다시 시도해주세요.",
  );
  const successTitle = usePortalCopy("student_consultation", "success_title", "상담 신청이 완료되었습니다");
  const successDesc = usePortalCopy(
    "student_consultation",
    "success_desc",
    "아래에서 방문 상담 희망 시간대를 입력해 주세요.",
  );
  const btnVisitInput = usePortalCopy("student_consultation", "btn_visit_input", "방문 상담 희망 시간대 입력");
  const btnClose = usePortalCopy("student_consultation", "btn_close", "닫기");
  const btnVisitEdit = usePortalCopy("student_consultation", "btn_visit_edit", "방문 상담 희망 시간대 수정");
  const errSaveDefault = usePortalCopy("student_consultation", "err_save", "저장에 실패했습니다.");

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
    if (booking?.status !== "WAITING" && booking?.status !== "ASSIGNED") {
      return;
    }

    const interval = window.setInterval(() => void fetchBooking(), 60_000);
    return () => window.clearInterval(interval);
  }, [booking?.status, fetchBooking]);

  useEffect(() => {
    if (openVisitFromUrl) setShowVisitPicker(true);
  }, [openVisitFromUrl]);

  // A1: 접수 배너는 1회만 — URL에서 applied 파라미터를 제거해 새로고침 시 재노출 방지
  useEffect(() => {
    if (!showAppliedBanner) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("applied")) return;
    url.searchParams.delete("applied");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [showAppliedBanner]);

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
        setError(data.error ?? errSubmitDefault);
        // A2: 이미 자동 접수된 상담이면 현황을 드러내고 그쪽으로 스크롤
        if (res.status === 409) {
          await fetchBooking();
          window.setTimeout(() => {
            statusCardRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
        return;
      }
      trackEvent(ANALYTICS_EVENTS.consultationSubmitted, {
        source: "portal_consultation",
      });
      setSuccess(true);
      setShowVisitPicker(true);
      await fetchBooking();
    } catch {
      setError(errSubmitNetwork);
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
        setError(data.error ?? errSaveDefault);
        return;
      }
      setShowVisitPicker(false);
      await fetchBooking();
    } catch {
      setError(errSaveDefault);
    } finally {
      setVisitSubmitting(false);
    }
  }

  async function acceptMatch() {
    if (!pendingMatch) return;
    setAcceptingMatch(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/matches/${pendingMatch.matchId}/accept`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAcceptError(data.error ?? "선생님 수락에 실패했습니다.");
        return;
      }
      setAcceptedMatch(pendingMatch);
      setPendingMatch(null);
    } catch {
      setAcceptError("선생님 수락에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setAcceptingMatch(false);
    }
  }

  const activeBooking =
    booking && booking.status !== "CANCELLED" ? booking : null;
  const hasVisitTimes =
    activeBooking && countVisitSlots(activeBooking.visitPreferredTimes) > 0;

  const welcomeText = welcomeTpl.replace(/\{name\}/g, studentName);

  return (
    <div className="portal-shell" data-portal-content>
      <header className="portal-topbar">
        <div className="portal-topbar-inner">
          <Link href="/dashboard" className="portal-topbar-brand">
            <CmsEdit active={isEditMode} section="student_consultation" cmsKey="brand" type="text">
              {brand.endsWith(".") ? brand.slice(0, -1) : brand}
              <span>.</span>
            </CmsEdit>
          </Link>
          <p className="portal-topbar-title">
            <CmsEdit active={isEditMode} section="student_consultation" cmsKey="welcome_template" type="text">
              {welcomeText}
            </CmsEdit>
          </p>
          <div className="portal-topbar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => signOut({ redirectTo: "/" })}
            >
              <CmsEdit active={isEditMode} section="student_consultation" cmsKey="logout" type="text">
                {logoutLabel}
              </CmsEdit>
            </button>
          </div>
        </div>
      </header>

      <main className="portal-main portal-main--topbar-only">
        <div className="st-narrow">
          {showAppliedBanner ? (
            <div className="banner info st-banner-x" style={{ marginBottom: "30px" }}>
              <span>
                <CmsEdit active={isEditMode} section="student_consultation" cmsKey="applied_banner" type="text">
                  {appliedBannerText}
                </CmsEdit>
              </span>
              <button
                type="button"
                className="x"
                onClick={() => setShowAppliedBanner(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
          ) : null}

          {!activeBooking ? (
            <>
              <header className="st-consult-head">
                <h1>
                  <CmsEdit active={isEditMode} section="student_consultation" cmsKey="no_booking_title" type="text">
                    {noBookingTitle}
                  </CmsEdit>
                </h1>
                <p>
                  <CmsEdit active={isEditMode} section="student_consultation" cmsKey="no_booking_desc" type="text">
                    {noBookingDesc}
                  </CmsEdit>
                </p>
              </header>

              <section className="st-block">
                <div className="field" style={{ marginTop: 0 }}>
                  <label htmlFor="consultation-note">
                    <CmsEdit active={isEditMode} section="student_consultation" cmsKey="note_label" type="text">
                      {noteLabel}
                    </CmsEdit>
                  </label>
                  <textarea
                    id="consultation-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="inp area"
                    placeholder={notePlaceholder}
                  />
                </div>
                <p className="panel-note" style={{ maxWidth: "38em" }}>
                  미성년 학생의 상담 신청은 학부모(법정대리인) 동의가 된 것으로 간주하며, 입력하신
                  연락처는 배정된 담당 매니저가 상담 진행 목적으로만 사용합니다.
                </p>
                {error ? (
                  <span className="f-err" role="alert">
                    {error}
                  </span>
                ) : null}
                <div className="st-actions">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitRequest()}
                    className="btn pri"
                  >
                    <CmsEdit
                      active={isEditMode}
                      section="student_consultation"
                      cmsKey={submitting ? "btn_submitting" : "btn_submit"}
                      type="text"
                    >
                      {submitting ? btnSubmitting : btnSubmit}
                    </CmsEdit>
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              {success ? (
                <header className="st-consult-head">
                  <h1>
                    <CmsEdit active={isEditMode} section="student_consultation" cmsKey="success_title" type="text">
                      {successTitle}
                    </CmsEdit>
                  </h1>
                  <p>
                    <CmsEdit active={isEditMode} section="student_consultation" cmsKey="success_desc" type="text">
                      {successDesc}
                    </CmsEdit>
                  </p>
                </header>
              ) : null}

              <div ref={statusCardRef}>
                <BookingStatusCard
                  booking={activeBooking}
                  hasVisitTimes={!!hasVisitTimes}
                  isEditMode={isEditMode}
                />
              </div>

              {pendingMatch ? (
                <section className="st-block">
                  <span className="st-label">선생님 배정</span>
                  <h2 className="st-sec-title" style={{ marginTop: "10px" }}>
                    {pendingMatch.teacherName} 선생님을 수락해 주세요
                  </h2>
                  <p className="st-lead" style={{ marginTop: 0 }}>
                    배정 과목: {pendingMatch.subjects}. 수락 후 선생님이 첫 수업 일정을 설정합니다.
                  </p>
                  {pendingMatch.matchReason ? (
                    <blockquote className="st-quote">
                      <span className="st-label">매니저의 추천 이유</span>
                      <p>{pendingMatch.matchReason}</p>
                    </blockquote>
                  ) : null}
                  {acceptError ? (
                    <span className="f-err" role="alert">
                      {acceptError}
                    </span>
                  ) : null}
                  <div className="st-actions">
                    <button
                      type="button"
                      disabled={acceptingMatch}
                      onClick={() => void acceptMatch()}
                      className="btn btn-ghost"
                    >
                      {acceptingMatch ? "수락 중..." : "이 선생님으로 시작하기"}
                    </button>
                  </div>
                </section>
              ) : acceptedMatch ? (
                <div className="banner info" style={{ marginTop: "30px" }}>
                  <span>
                    {acceptedMatch.teacherName} 선생님을 수락했습니다. 선생님이 첫 수업 일정을 설정하면 알려드릴게요.
                  </span>
                </div>
              ) : null}

              {!showVisitPicker && !hasVisitTimes ? (
                <div className="st-toolbar">
                  <button
                    type="button"
                    onClick={() => setShowVisitPicker(true)}
                    className="btn pri"
                  >
                    <CmsEdit active={isEditMode} section="student_consultation" cmsKey="btn_visit_input" type="text">
                      {btnVisitInput}
                    </CmsEdit>
                  </button>
                </div>
              ) : null}

              {showVisitPicker ? (
                <section className="st-block">
                  <p className="panel-note" style={{ marginTop: 0, maxWidth: "38em" }}>
                    미성년 학생의 방문 상담 신청은 학부모(법정대리인) 동의가 된 것으로 간주하며,
                    입력하신 연락처는 배정된 담당 매니저가 상담 진행 목적으로만 사용합니다.
                  </p>
                  <VisitTimesPicker
                    initial={activeBooking.visitPreferredTimes}
                    onSubmit={saveVisitTimes}
                    submitting={visitSubmitting}
                  />
                  {hasVisitTimes ? (
                    <div className="st-toolbar">
                      <button
                        type="button"
                        onClick={() => setShowVisitPicker(false)}
                        className="btn ghost sm"
                      >
                        <CmsEdit active={isEditMode} section="student_consultation" cmsKey="btn_close" type="text">
                          {btnClose}
                        </CmsEdit>
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {hasVisitTimes && !showVisitPicker ? (
                <div className="st-toolbar">
                  <button
                    type="button"
                    onClick={() => setShowVisitPicker(true)}
                    className="btn ghost sm"
                  >
                    <CmsEdit active={isEditMode} section="student_consultation" cmsKey="btn_visit_edit" type="text">
                      {btnVisitEdit}
                    </CmsEdit>
                  </button>
                </div>
              ) : null}

              {error ? (
                <span className="f-err" role="alert">
                  {error}
                </span>
              ) : null}
            </>
          )}
        </div>
      </main>

      {assignedToast ? (
        <p role="status" className="toast on">
          <CmsEdit active={isEditMode} section="student_consultation" cmsKey="toast_assigned" type="text">
            {toastAssigned}
          </CmsEdit>
        </p>
      ) : null}
    </div>
  );
}

function BookingStatusCard({
  booking,
  hasVisitTimes,
  isEditMode = false,
}: {
  booking: Booking;
  hasVisitTimes: boolean;
  isEditMode?: boolean;
}) {
  const keys = STATUS_CMS_KEYS[booking.status];
  const label = usePortalCopy(
    "student_consultation",
    keys.label,
    STATUS_FALLBACK_LABEL[booking.status],
  );
  const body = usePortalCopy(
    "student_consultation",
    keys.body,
    STATUS_FALLBACK_BODY[booking.status],
  );
  const cardTitle = usePortalCopy("student_consultation", "card_status_title", "내 상담 현황");
  const managerSuffix = usePortalCopy("student_consultation", "manager_suffix", " 매니저");
  const managerRole = usePortalCopy("student_consultation", "manager_role", "담당 매니저");
  const visitSectionTitle = usePortalCopy(
    "student_consultation",
    "visit_section_title",
    "방문 상담 희망 시간",
  );
  const visitPrompt = usePortalCopy(
    "student_consultation",
    "visit_prompt",
    "방문 상담 희망 시간대를 입력해 주세요.",
  );

  const badgeClass = STATUS_BADGE_CLASS[booking.status];

  return (
    <section className="st-block">
      <div className="st-status">
        <h2>
          <CmsEdit active={isEditMode} section="student_consultation" cmsKey="card_status_title" type="text">
            {cardTitle}
          </CmsEdit>
        </h2>
        <span className={`sp ${badgeClass}`}>
          <CmsEdit active={isEditMode} section="student_consultation" cmsKey={keys.label} type="text">
            {label}
          </CmsEdit>
        </span>
      </div>

      <p className="st-lead" style={{ marginTop: "14px" }}>
        <CmsEdit active={isEditMode} section="student_consultation" cmsKey={keys.body} type="text">
          {body}
        </CmsEdit>
      </p>

      {booking.status === "ASSIGNED" && booking.manager ? (
        <div className="st-manager">
          <span className="ph">
            {booking.manager.photoUrl ? (
              <Image
                src={booking.manager.photoUrl}
                alt=""
                fill
                sizes="48px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span>{booking.manager.name.charAt(0)}</span>
            )}
          </span>
          <div>
            <b>
              {booking.manager.name}
              <CmsEdit active={isEditMode} section="student_consultation" cmsKey="manager_suffix" type="text">
                {managerSuffix}
              </CmsEdit>
            </b>
            <p>
              <CmsEdit active={isEditMode} section="student_consultation" cmsKey="manager_role" type="text">
                {managerRole}
              </CmsEdit>
            </p>
          </div>
        </div>
      ) : null}

      {booking.note ? (
        <blockquote className="st-quote">
          <p>{booking.note}</p>
        </blockquote>
      ) : null}

      {hasVisitTimes ? (
        <div style={{ marginTop: "24px" }}>
          <span className="st-label">
            <CmsEdit active={isEditMode} section="student_consultation" cmsKey="visit_section_title" type="text">
              {visitSectionTitle}
            </CmsEdit>
          </span>
          <dl className="st-kv" style={{ marginTop: "10px" }}>
            {Object.entries(booking.visitPreferredTimes).map(([date, slots]) =>
              slots.length > 0 ? (
                <div key={date}>
                  <dt>{date}</dt>
                  <dd>{slots.join(", ")}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      ) : (
        <p className="st-warn" style={{ marginTop: "20px", fontSize: "14px" }}>
          <CmsEdit active={isEditMode} section="student_consultation" cmsKey="visit_prompt" type="text">
            {visitPrompt}
          </CmsEdit>
        </p>
      )}
    </section>
  );
}
