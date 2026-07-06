"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  LEAD_GRADES,
  LEAD_SUBJECTS,
  LEAD_TIME_SLOTS,
} from "@/lib/consultation-lead";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";

type Props = {
  source?: string;
  phoneNotice: string;
};

export function ConsultRequestForm({ source, phoneNotice }: Props) {
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allAgreed = privacyAgreed && marketingOptIn;

  const phoneValid = useMemo(
    () => /^01[016789][0-9]{7,8}$/.test(phone.replace(/[^0-9]/g, "")),
    [phone],
  );

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  const toggleAll = () => {
    const next = !allAgreed;
    setPrivacyAgreed(next);
    setMarketingOptIn(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!grade) return setError("학년을 선택해 주세요.");
    if (subjects.length === 0) return setError("과목을 1개 이상 선택해 주세요.");
    if (!phoneValid) return setError("올바른 휴대폰 번호를 입력해 주세요.");
    if (!privacyAgreed)
      return setError("개인정보 수집·이용(필수)에 동의해 주세요.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/consultation-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          subjects,
          phone,
          preferredTime: preferredTime || null,
          privacyAgreed,
          marketingOptIn,
          source: source || "consult_page",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "신청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      trackEvent(ANALYTICS_EVENTS.consultationSubmitted, {
        source: source ?? "consult_page",
      });
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="consult-done card">
        <div className="consult-done-icon" aria-hidden="true">✓</div>
        <h2>상담 신청이 접수됐어요</h2>
        <p>{phoneNotice}</p>
        <p className="consult-done-sub">
          계정을 만들면 상담 진행 상황을 바로 확인할 수 있어요.
        </p>
        <div className="consult-done-actions">
          <Link href="/register" className="btn btn-acc">
            1분 만에 계정 만들기
          </Link>
          <Link href="/" className="btn btn-ghost">
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="consult-form card" onSubmit={handleSubmit} noValidate>
      <div className="consult-field">
        <label htmlFor="consult-grade">학년</label>
        <select
          id="consult-grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
        >
          <option value="" disabled>
            2026년 기준 학년
          </option>
          {LEAD_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="consult-field">
        <span className="consult-label">과목</span>
        <div className="consult-chips" role="group" aria-label="과목 선택">
          {LEAD_SUBJECTS.map((subject) => {
            const active = subjects.includes(subject);
            return (
              <button
                key={subject}
                type="button"
                className={`consult-chip${active ? " on" : ""}`}
                aria-pressed={active}
                onClick={() => toggleSubject(subject)}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>

      <div className="consult-field">
        <label htmlFor="consult-phone">연락처</label>
        <input
          id="consult-phone"
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="consult-field">
        <label htmlFor="consult-time">희망 상담 시간</label>
        <p className="consult-notice">{phoneNotice}</p>
        <select
          id="consult-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
        >
          <option value="">상담시간 선택</option>
          {LEAD_TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div className="consult-agree">
        <label className="consult-agree-row consult-agree-all">
          <input type="checkbox" checked={allAgreed} onChange={toggleAll} />
          약관 전체 동의
        </label>
        <label className="consult-agree-row">
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
          />
          <span>
            [필수] 상담을 위한 개인정보 수집·이용 동의{" "}
            <Link href="/privacy" target="_blank" className="consult-agree-link">
              보기
            </Link>
          </span>
        </label>
        <label className="consult-agree-row">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
          />
          [선택] 마케팅 활용 동의
        </label>
      </div>

      {error ? (
        <p className="consult-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-acc btn-block consult-submit"
        disabled={submitting}
      >
        {submitting ? "신청 중…" : "상담 신청하기"}
      </button>
    </form>
  );
}
