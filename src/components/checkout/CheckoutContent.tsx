"use client";

import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import {
  ANONYMOUS,
  clearPaymentWidget,
  loadPaymentWidget,
} from "@tosspayments/payment-widget-sdk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
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
import { TOSS_WIDGET_CLIENT_KEY } from "@/lib/toss-client";

type PMW = ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>;

const PAYMENT_SELECTOR = "#concord-payment-methods";
const AGREEMENT_SELECTOR = "#concord-agreement";
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        clearPaymentWidget();
        const paymentWidget = await loadPaymentWidget(
          TOSS_WIDGET_CLIENT_KEY,
          ANONYMOUS,
        );
        if (cancelled) return;

        paymentWidgetRef.current = paymentWidget;
        const pmw = paymentWidget.renderPaymentMethods(
          PAYMENT_SELECTOR,
          { currency: "KRW", value: total },
          { variantKey: "DEFAULT" },
        );
        paymentMethodsRef.current = pmw;
        paymentWidget.renderAgreement(AGREEMENT_SELECTOR);
        if (!cancelled) setWidgetReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      }
    })();

    return () => {
      cancelled = true;
      paymentWidgetRef.current = null;
      paymentMethodsRef.current = null;
      clearPaymentWidget();
      setWidgetReady(false);
    };
  }, [total]);

  useEffect(() => {
    paymentMethodsRef.current?.updateAmount(total);
  }, [total]);

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
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <CmsText active={isEditMode} cmsKey="header_kicker">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {c("header_kicker", "Checkout")}
            </p>
          </CmsText>
          <CmsText active={isEditMode} cmsKey="header_title">
            <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
              {c("header_title", "결제")}
            </h1>
          </CmsText>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-20 lg:py-24">
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <CmsText active={isEditMode} cmsKey="link_pricing">
            <Link
              href="/pricing"
              className="text-xs font-semibold uppercase tracking-wider text-text-muted underline-offset-4 transition hover:text-primary hover:underline"
            >
              {c("link_pricing", "← 요금제")}
            </Link>
          </CmsText>
          <CmsText active={isEditMode} cmsKey="link_consultation">
            <button
              type="button"
              onClick={() => void goConsultation()}
              className="text-xs font-semibold uppercase tracking-wider text-text-muted underline-offset-4 transition hover:text-primary hover:underline"
            >
              {c("link_consultation", "상담 먼저 신청하기")}
            </button>
          </CmsText>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-16">
          <div className="space-y-10">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <CmsText active={isEditMode} cmsKey="section_order_title">
                <h2 className="text-xl font-black text-text-primary">{c("section_order_title", "주문 요약")}</h2>
              </CmsText>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <CmsText active={isEditMode} cmsKey="dt_plan">
                    <dt className="text-text-secondary">{c("dt_plan", "플랜")}</dt>
                  </CmsText>
                  <dd className="font-semibold text-text-primary">{planLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <CmsText active={isEditMode} cmsKey="dt_subjects">
                    <dt className="text-text-secondary">{c("dt_subjects", "과목 수")}</dt>
                  </CmsText>
                  <dd className="font-semibold text-text-primary">{subjects}과목</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <CmsText active={isEditMode} cmsKey="dt_tutor">
                    <dt className="text-text-secondary">{c("dt_tutor", "강사")}</dt>
                  </CmsText>
                  <dd className="font-semibold text-text-primary">{tutorName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <CmsText active={isEditMode} cmsKey="dt_platform">
                    <dt className="text-text-secondary">{c("dt_platform", "플랫폼 이용료")}</dt>
                  </CmsText>
                  <dd className="text-text-primary">{formatKRW(platformFee)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <CmsText active={isEditMode} cmsKey="dt_lesson">
                    <dt className="text-text-secondary">{c("dt_lesson", "수업료")}</dt>
                  </CmsText>
                  <dd className="text-text-primary">{formatKRW(lessonFee)}</dd>
                </div>
                <div className="flex justify-between gap-4 pt-2">
                  <CmsText active={isEditMode} cmsKey="dt_total">
                    <dt className="text-lg font-black text-text-primary">{c("dt_total", "총 결제금액")}</dt>
                  </CmsText>
                  <dd className="text-xl font-black text-primary">{formatKRW(total)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <CmsText active={isEditMode} cmsKey="section_payment_title">
                <h2 className="text-xl font-black text-text-primary">{c("section_payment_title", "결제 수단")}</h2>
              </CmsText>
              <CmsText active={isEditMode} cmsKey="payment_note">
                <p className="mt-2 text-xs text-text-muted">{c("payment_note", "테스트 키로 연동되어 실제 결제는 이루어지지 않습니다.")}</p>
              </CmsText>
              <div
                id="concord-payment-methods"
                className="mt-6 min-h-[120px] w-full"
              />
              <div id="concord-agreement" className="mt-6 w-full" />
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <CmsText active={isEditMode} cmsKey="section_customer_title">
                <h2 className="text-xl font-black text-text-primary">
                  {c("section_customer_title", needsSignup ? "주문자 · 가입 정보" : "주문자 정보")}
                </h2>
              </CmsText>
              <div className="mt-6 space-y-5">
                <div>
                  <CmsText active={isEditMode} cmsKey="label_name">
                    <label
                      htmlFor="checkout-name"
                      className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {c("label_name", "이름")}
                    </label>
                  </CmsText>
                  <input
                    id="checkout-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <CmsText active={isEditMode} cmsKey="label_phone">
                    <label
                      htmlFor="checkout-phone"
                      className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {c("label_phone", "연락처")}
                    </label>
                  </CmsText>
                  <input
                    id="checkout-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <CmsText active={isEditMode} cmsKey="label_email">
                    <label
                      htmlFor="checkout-email"
                      className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {c("label_email", "이메일")}
                    </label>
                  </CmsText>
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                  />
                </div>
                {needsSignup ? (
                  <>
                    <GenderSelect value={gender} onChange={setGender} error={error?.includes("성별") ? error : undefined} />
                    <div>
                      <label
                        htmlFor="checkout-grade"
                        className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                      >
                        학년
                      </label>
                      <select
                        id="checkout-grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                      >
                        {STUDENT_GRADES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        희망 과목
                      </span>
                      <p className="mt-2 text-xs text-text-muted">
                        {subjects}과목 플랜이므로 {subjects}개를 선택해 주세요.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.map((subject) => {
                          const active = selectedSubjects.includes(subject);
                          return (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => toggleSubject(subject)}
                              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                                active
                                  ? "border-primary bg-primary text-white"
                                  : "border-gray-200 bg-white text-text-secondary hover:border-gray-300"
                              }`}
                            >
                              {subject}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-password"
                        className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                      >
                        비밀번호
                      </label>
                      <input
                        id="checkout-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-password-confirm"
                        className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                      >
                        비밀번호 확인
                      </label>
                      <input
                        id="checkout-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-primary"
                />
                <CmsText active={isEditMode} cmsKey="terms_text">
                  <span className="text-sm leading-relaxed text-text-secondary">
                    {c(
                      "terms_text",
                      "전자상거래 및 결제 관련 약관, 개인정보 처리방침에 동의합니다. (필수)",
                    )}
                  </span>
                </CmsText>
              </label>

              {error ? (
                <p className="mt-4 text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}

              <CmsText active={isEditMode} cmsKey="pay_button">
                <button
                  type="button"
                  disabled={paying || !widgetReady}
                  onClick={handlePay}
                  className="mt-8 w-full rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying ? c("paying_label", "처리 중…") : c("pay_button", "결제하기")}
                </button>
              </CmsText>
              {!widgetReady && !error ? (
                <CmsText active={isEditMode} cmsKey="widget_loading">
                  <p className="mt-3 text-center text-xs text-text-muted">{c("widget_loading", "결제 UI를 불러오는 중…")}</p>
                </CmsText>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
