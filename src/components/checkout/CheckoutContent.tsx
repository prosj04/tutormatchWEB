"use client";

import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { GenderSelect } from "@/components/ui/GenderSelect";
import { STUDENT_GRADES } from "@/lib/consultation-grades";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { formatKRW } from "@/lib/format-won";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import {
  getPlanLabel,
  getPriceBreakdown,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/order-pricing";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";
import type { GroupedSiteContent } from "@/lib/site-content";
import { PLAN_INCLUDES } from "@/lib/pricing-plans";

import type { PMW } from "./CheckoutTossWidget";

const CheckoutTossWidget = dynamic(
  () => import("./CheckoutTossWidget").then((mod) => mod.CheckoutTossWidget),
  {
    ssr: false,
    loading: () => (
      <p className="panel-note" style={{ marginTop: 24 }}>
        결제 수단 불러오는 중…
      </p>
    ),
  },
);

const CHECKOUT_SIGNUP_STORAGE_KEY = "concord-checkout-signup";
const SUBJECT_OPTIONS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

type CheckoutContentProps = {
  tutorId: string;
  sessions: SessionPlan;
  subjects: SubjectCount;
  siteContent?: GroupedSiteContent;
  needsSignup: boolean;
  isEditMode?: boolean;
};

function CmsText({
  active,
  cmsKey,
  children,
}: {
  active: boolean;
  cmsKey: string;
  children: ReactNode;
}) {
  return (
    <CmsEdit active={active} section="checkout_page" cmsKey={cmsKey} type="text">
      {children}
    </CmsEdit>
  );
}

export function CheckoutContent({
  tutorId,
  sessions,
  subjects,
  siteContent,
  needsSignup,
  isEditMode: isEditModeProp,
}: CheckoutContentProps) {
  const searchParams = useSearchParams();
  const isEditMode = isEditModeProp ?? searchParams.get("cms_edit") === "1";
  const c = (key: string, fb: string) => getCmsSectionValue(siteContent, "checkout_page", key, fb);
  const tutorName = tutorId ? "상담 후 배정" : "강사 미지정";
  const planLabel = getPlanLabel(sessions, subjects);

  const { total, platformFee, lessonFee } = getPriceBreakdown(sessions, subjects);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState<string>(STUDENT_GRADES[0]);
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goConsultation = useConsultationCta();
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsRef = useRef<PMW | null>(null);

  const handleWidgetError = useCallback((message: string) => {
    setError(message);
  }, []);

  const toggleSubject = useCallback(
    (subject: string) => {
      setSelectedSubjects((prev) => {
        if (prev.includes(subject)) return prev.filter((item) => item !== subject);
        if (prev.length >= subjects) return prev;
        return [...prev, subject];
      });
    },
    [subjects],
  );

  const handlePay = useCallback(async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("이름, 연락처, 이메일을 모두 입력해 주세요.");
      return;
    }
    const phoneDigits = normalizePhoneDigits(phone);
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("올바른 연락처를 입력해 주세요.");
      return;
    }
    if (needsSignup) {
      if (!gender) {
        setError("가입을 위해 성별을 선택해 주세요.");
        return;
      }
      if (!grade) {
        setError("가입을 위해 학년을 선택해 주세요.");
        return;
      }
      const guardianPhoneDigits = normalizePhoneDigits(guardianPhone);
      if (guardianPhone.trim() && (guardianPhoneDigits.length < 10 || guardianPhoneDigits.length > 11)) {
        setError("부모님 연락처를 올바르게 입력해 주세요.");
        return;
      }
      if (selectedSubjects.length !== subjects) {
        setError(`가입을 위해 희망 과목을 ${subjects}개 선택해 주세요.`);
        return;
      }
      if (password.length < 8) {
        setError("가입을 위해 비밀번호를 8자 이상 입력해 주세요.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }
    if (!termsAgreed) {
      setError("결제 진행을 위해 약관에 동의해 주세요.");
      return;
    }
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget) {
      setError("결제 위젯이 아직 준비되지 않았습니다.");
      return;
    }

    const orderId = `CONCORD_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const orderName = `Concord ${planLabel} · ${tutorName}`;

    setPaying(true);
    try {
      const origin = window.location.origin;
      if (needsSignup) {
        sessionStorage.setItem(
          CHECKOUT_SIGNUP_STORAGE_KEY,
          JSON.stringify({
            orderId,
            name: name.trim(),
            phone: phoneDigits,
            guardianPhone: normalizePhoneDigits(guardianPhone),
            grade,
            gender,
            password,
            subjects: selectedSubjects,
          }),
        );
      } else {
        sessionStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
      }
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerMobilePhone: phoneDigits,
        successUrl: `${origin}/success`,
        failUrl: `${origin}/checkout?tutor=${encodeURIComponent(tutorId)}&sessions=${sessions}&subjects=${subjects}&error=1`,
      });
    } catch (e) {
      console.error(e);
      setError("결제 요청 중 문제가 발생했습니다.");
    } finally {
      setPaying(false);
    }
  }, [
    email,
    gender,
    grade,
    guardianPhone,
    name,
    needsSignup,
    password,
    passwordConfirm,
    planLabel,
    selectedSubjects,
    sessions,
    subjects,
    termsAgreed,
    tutorId,
    tutorName,
    phone,
  ]);

  return (
    <main>
      <ConcordPageHead
        eyebrow={c("header_kicker", "Checkout")}
        title={c("header_title", "결제")}
        description="선택하신 플랜으로 결제를 진행합니다. 주문 정보를 확인한 뒤 결제를 완료해 주세요."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="back-links">
            <CmsText active={isEditMode} cmsKey="link_pricing">
              <Link href="/pricing">{c("link_pricing", "← 요금제")}</Link>
            </CmsText>
            <CmsText active={isEditMode} cmsKey="link_consultation">
              <button type="button" onClick={() => void goConsultation()}>
                {c("link_consultation", "상담 먼저 신청하기")}
              </button>
            </CmsText>
          </div>

          <div className="checkout-layout">
            <div className="panel-stack">
              <article className="card panel-card">
                <CmsText active={isEditMode} cmsKey="section_order_title">
                  <h2 className="panel-title">{c("section_order_title", "주문 요약")}</h2>
                </CmsText>
                <dl style={{ marginTop: 8 }}>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_plan">
                      <dt>{c("dt_plan", "플랜")}</dt>
                    </CmsText>
                    <dd>{planLabel}</dd>
                  </div>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_subjects">
                      <dt>{c("dt_subjects", "과목 수")}</dt>
                    </CmsText>
                    <dd>{subjects}과목</dd>
                  </div>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_tutor">
                      <dt>{c("dt_tutor", "강사")}</dt>
                    </CmsText>
                    <dd>{tutorName}</dd>
                  </div>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_platform">
                      <dt>{c("dt_platform", "플랫폼 이용료")}</dt>
                    </CmsText>
                    <dd>{formatKRW(platformFee)}</dd>
                  </div>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_lesson">
                      <dt>{c("dt_lesson", "수업료")}</dt>
                    </CmsText>
                    <dd>{formatKRW(lessonFee)}</dd>
                  </div>
                  <div className="kv-row total">
                    <CmsText active={isEditMode} cmsKey="dt_total">
                      <dt>{c("dt_total", "총 결제금액")}</dt>
                    </CmsText>
                    <dd>{formatKRW(total)}</dd>
                  </div>
                </dl>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(0,0,0,0.7)", marginBottom: 10 }}>
                    모든 플랜에 포함됨
                  </p>
                  <ul style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "rgba(0,0,0,0.6)" }}>
                    {PLAN_INCLUDES.map((item) => (
                      <li key={item} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "var(--acc-color, #FF6B6B)" }}>·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="card panel-card">
                <CmsText active={isEditMode} cmsKey="section_payment_title">
                  <h2 className="panel-title">{c("section_payment_title", "결제 수단")}</h2>
                </CmsText>
                <CmsText active={isEditMode} cmsKey="payment_note">
                  <p className="panel-note">{c("payment_note", "테스트 키로 연동되어 실제 결제는 이루어지지 않습니다.")}</p>
                </CmsText>
                <CheckoutTossWidget
                  total={total}
                  onReadyChange={setWidgetReady}
                  onError={handleWidgetError}
                  paymentWidgetRef={paymentWidgetRef}
                  paymentMethodsRef={paymentMethodsRef}
                />
              </article>
            </div>

            <div className="panel-stack">
              <article className="card panel-card">
                <CmsText active={isEditMode} cmsKey="section_customer_title">
                  <h2 className="panel-title">
                    {c("section_customer_title", needsSignup ? "주문자 · 가입 정보" : "주문자 정보")}
                  </h2>
                </CmsText>
                <div>
                  <div className="field">
                    <CmsText active={isEditMode} cmsKey="label_name">
                      <label htmlFor="checkout-name">{c("label_name", "이름")}</label>
                    </CmsText>
                    <input
                      id="checkout-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <CmsText active={isEditMode} cmsKey="label_phone">
                      <label htmlFor="checkout-phone">{c("label_phone", "연락처")}</label>
                    </CmsText>
                    <input
                      id="checkout-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <CmsText active={isEditMode} cmsKey="label_email">
                      <label htmlFor="checkout-email">{c("label_email", "이메일")}</label>
                    </CmsText>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {needsSignup ? (
                    <>
                      <GenderSelect value={gender} onChange={setGender} error={error?.includes("성별") ? error : undefined} />
                      <div className="field">
                        <label htmlFor="checkout-grade">학년</label>
                        <select
                          id="checkout-grade"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                        >
                          {STUDENT_GRADES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="checkout-guardian-phone">부모님 연락처 (선택)</label>
                        <input
                          id="checkout-guardian-phone"
                          type="tel"
                          autoComplete="tel"
                          inputMode="numeric"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                        />
                        <p className="panel-note" style={{ marginTop: 6 }}>
                          미성년 학생의 서비스 이용은 학부모 동의가 된 것으로 간주하며,
                          입력하신 연락처는 상담 매니저에게만 전달됩니다.
                        </p>
                      </div>
                      <div className="field">
                        <label>희망 과목</label>
                        <p className="panel-note" style={{ marginTop: 0, marginBottom: 10 }}>
                          {subjects}과목 플랜이므로 {subjects}개를 선택해 주세요.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {SUBJECT_OPTIONS.map((subject) => {
                            const active = selectedSubjects.includes(subject);
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => toggleSubject(subject)}
                                className={`chip-f${active ? " on" : ""}`}
                              >
                                {subject}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="checkout-password">비밀번호</label>
                        <input
                          id="checkout-password"
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="checkout-password-confirm">비밀번호 확인</label>
                        <input
                          id="checkout-password-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </article>

              <article className="card panel-card">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                  />
                  <span>
                    전자상거래 및 결제 관련{" "}
                    <Link href="/terms" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ color: "var(--acc-text)", textDecoration: "underline" }}>
                      이용약관
                    </Link>
                    ,{" "}
                    <Link href="/privacy" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ color: "var(--acc-text)", textDecoration: "underline" }}>
                      개인정보처리방침
                    </Link>
                    에 동의합니다. (필수)
                  </span>
                </label>

                {error ? (
                  <p className="field-error" style={{ marginTop: 16, fontSize: 14 }} role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="panel-note" style={{ marginTop: 16, fontSize: 13, textAlign: "center", padding: "10px 12px", backgroundColor: "rgba(var(--acc-rgb), 0.08)", borderRadius: "8px" }}>
                  <span>{c("refund_guarantee", "첫 수업 후 불만족 시 100% 환불해 드립니다. ")}</span>
                  <Link href="/refund" style={{ color: "var(--acc-text)", textDecoration: "underline" }}>
                    {c("refund_policy_link", "환불정책")}
                  </Link>
                </div>

                <CmsText active={isEditMode} cmsKey="pay_button">
                  <button
                    type="button"
                    disabled={paying || !widgetReady}
                    onClick={handlePay}
                    className="btn btn-acc btn-block"
                    style={{ marginTop: 24 }}
                  >
                    {paying ? c("paying_label", "처리 중…") : c("pay_button", "결제하기")}
                  </button>
                </CmsText>
                {!widgetReady && !error ? (
                  <CmsText active={isEditMode} cmsKey="widget_loading">
                    <p className="panel-note" style={{ textAlign: "center", marginTop: 12 }}>
                      {c("widget_loading", "결제 UI를 불러오는 중…")}
                    </p>
                  </CmsText>
                ) : null}
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
