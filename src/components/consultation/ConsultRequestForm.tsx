"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { RegionPicker } from "@/components/common/RegionPicker";

import {
  LEAD_GENDERS,
  LEAD_GRADES,
  LEAD_SUBJECTS,
  LEAD_TIME_SLOTS,
} from "@/lib/consultation-lead";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";

type Props = {
  source?: string;
  phoneNotice: string;
  /** consult_page CMS 문구 (없으면 기본값) */
  copy?: Partial<Record<string, string>>;
};

export function ConsultRequestForm({ source, phoneNotice, copy = {} }: Props) {
  const c = (key: string, fallback: string) => copy[key] ?? fallback;
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState("");
  const [region, setRegion] = useState("");
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
    if (!region) return setError("지역을 선택해 주세요.");
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
          name: name || null,
          gender: gender || null,
          grade,
          region,
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
        <h2>{c("done_title", "상담 신청이 접수됐어요")}</h2>
        <p>{phoneNotice}</p>
        <p className="consult-done-label">{c("done_check_label", "상담에서 확인하실 것")}</p>
        <ul className="consult-done-list">
          <li>{c("done_item_1", "학생의 공부 성향 진단과 그에 맞는 선생님 방향")}</li>
          <li>{c("done_item_2", "과목별 현재 위치와 3개월 학습 계획")}</li>
          <li>{c("done_item_3", "수업·요금 안내와 첫 수업 환불 조건")}</li>
        </ul>
        <p className="consult-done-sub">
          {c("done_sub", "계정을 만들면 상담 진행 상황을 바로 확인할 수 있어요.")}
        </p>
        <div className="consult-done-actions">
          <Link href="/register" className="btn btn-acc">
            {c("done_btn_register", "1분 만에 계정 만들기")}
          </Link>
          <Link href="/" className="btn btn-ghost">
            {c("done_btn_home", "홈으로")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="consult-form card" onSubmit={handleSubmit} noValidate>
      <div className="consult-row">
        <div className="consult-field consult-field-grow">
          <label htmlFor="consult-name">{c("label_name", "이름")}</label>
          <input
            id="consult-name"
            type="text"
            placeholder={c("ph_name", "학생 이름")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="consult-field">
          <span className="consult-label">{c("label_gender", "성별")}</span>
          <div className="consult-gender" role="group" aria-label="성별 선택">
            {LEAD_GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                className={`consult-gender-btn${gender === g ? " on" : ""}`}
                aria-pressed={gender === g}
                onClick={() => setGender((prev) => (prev === g ? "" : g))}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="consult-row">
        <div className="consult-field">
          <label htmlFor="consult-grade">{c("label_grade", "학년")}</label>
          <select
            id="consult-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          >
            <option value="" disabled>
              {c("ph_grade", "2026년 기준 학년")}
            </option>
            {LEAD_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="consult-field consult-field-grow">
          <label htmlFor="consult-phone">{c("label_phone", "연락처")}</label>
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
      </div>

      <div className="consult-field">
        <span className="consult-label">{c("label_region", "지역")}</span>
        <RegionPicker value={region} onChange={setRegion} labels={copy as Record<string, string>} />
      </div>

      <div className="consult-field">
        <span className="consult-label">{c("label_subjects", "과목")}</span>
        <div className="consult-chips consult-chips-row" role="group" aria-label="과목 선택">
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
        <label htmlFor="consult-time">{c("label_time", "희망 상담 시간")}</label>
        <p className="consult-notice">{phoneNotice}</p>
        <select
          id="consult-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
        >
          <option value="">{c("ph_time", "상담시간 선택")}</option>
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
          {c("agree_all", "약관 전체 동의")}
        </label>
        <label className="consult-agree-row">
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
          />
          <span>
            {c("agree_privacy", "[필수] 상담을 위한 개인정보 수집·이용 동의")}{" "}
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
          {c("agree_marketing", "[선택] 마케팅 활용 동의")}
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
        {submitting ? c("btn_submitting", "신청 중…") : c("btn_submit", "상담 신청하기")}
      </button>
    </form>
  );
}
