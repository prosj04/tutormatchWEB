"use client";

import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { trackEvent } from "@/lib/analytics-client";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { GenderSelect } from "@/components/ui/GenderSelect";
import { STUDENT_GRADES } from "@/lib/consultation-grades";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { formatKRW } from "@/lib/format-won";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";
import type { GroupedSiteContent } from "@/lib/site-content";
import { getV2PlanById, PLAN_INCLUDES, PRICING_PLANS_V2 } from "@/lib/pricing-plans";

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
// 학부모가 자녀 명의로 결제한 경우, success에서 소진할 마커.
const CHECKOUT_PARENT_STORAGE_KEY = "concord-checkout-parent";
// Toss 취소 후 ?error=1 복귀 시 페이지가 리로드되어 입력이 초기화되므로,
// 비밀번호를 제외한 연락 정보만 임시 보존한다(D4).
const CHECKOUT_DRAFT_STORAGE_KEY = "concord-checkout-draft";
const SUBJECT_OPTIONS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

export type CheckoutChild = {
  id: string;
  name: string;
  grade: string;
  hasActiveSubscription: boolean;
};

type CheckoutContentProps = {
  tutorId: string;
  /** v2 planId (예: "high-w2h2"). page.tsx가 검증·폴백 후 넘겨준다. */
  planId: string;
  siteContent?: GroupedSiteContent;
  needsSignup: boolean;
  isEditMode?: boolean;
  /**
   * 학부모 세션일 때 연결된 자녀 목록. 존재하면(빈 배열 포함) 학부모 결제 분기.
   * undefined면 일반(학생/비회원) 결제.
   */
  parentChildren?: CheckoutChild[];
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
  planId,
  siteContent,
  needsSignup,
  isEditMode: isEditModeProp,
  parentChildren,
}: CheckoutContentProps) {
  const searchParams = useSearchParams();
  const isEditMode = isEditModeProp ?? searchParams.get("cms_edit") === "1";
  const c = (key: string, fb: string) => getCmsSectionValue(siteContent, "checkout_page", key, fb);
  const tutorName = tutorId ? "상담 후 배정" : "강사 미지정";

  // 학부모 결제 분기: parentChildren이 넘어오면 자녀 명의 결제.
  const isParentCheckout = parentChildren !== undefined;
  const hasChildren = (parentChildren?.length ?? 0) > 0;
  const [selectedChildId, setSelectedChildId] = useState<string>(
    () => parentChildren?.[0]?.id ?? "",
  );

  // v2 플랜 결정. 알 수 없는 id면 안전 폴백(고등·주2·2시간).
  const plan = useMemo(
    () => getV2PlanById(planId) ?? PRICING_PLANS_V2[0]!,
    [planId],
  );
  const planLabel = plan.title;
  const total = plan.priceKrw;

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, { plan_id: plan.id, amount: plan.priceKrw });
  }, [plan.id, plan.priceKrw]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState<string>(STUDENT_GRADES[0]);
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // v2 이후 과목 수 곱셈 폐지. 희망 과목은 참고용 다중 선택(0-N), 필수 개수 검증 없음.
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goConsultation = useConsultationCta();
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsRef = useRef<PMW | null>(null);

  // D4: Toss 취소 복귀(?error=1) 시 리로드로 초기화된 연락 정보를 복원한다.
  useEffect(() => {
    if (searchParams.get("error") !== "1") return;
    try {
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { name?: string; phone?: string; email?: string };
      if (draft.name) setName((prev) => prev || draft.name!);
      if (draft.phone) setPhone((prev) => prev || draft.phone!);
      if (draft.email) setEmail((prev) => prev || draft.email!);
    } catch {
      // ignore malformed draft
    }
  }, [searchParams]);

  // 연락 정보를 입력하는 동안 임시 저장(비밀번호는 저장하지 않음).
  useEffect(() => {
    if (!name && !phone && !email) return;
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify({ name, phone, email }),
      );
    } catch {
      // ignore quota errors
    }
  }, [name, phone, email]);

  const handleWidgetError = useCallback((message: string) => {
    setError(message);
  }, []);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) return prev.filter((item) => item !== subject);
      return [...prev, subject];
    });
  }, []);

  const handlePay = useCallback(async () => {
    setError(null);
    if (isParentCheckout && !selectedChildId) {
      setError("결제할 자녀를 선택해 주세요.");
      return;
    }
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
      // 비회원 가입정보는 localStorage에 보관해 브라우저 종료·탭 이동에도 유실 창을 줄인다(D3).
      // success에서 소진 시 즉시 삭제한다.
      if (needsSignup) {
        localStorage.setItem(
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
            // termsAgreed 필수 체크가 보호자 동의 문구를 포함하므로 이 시점엔 항상 true
            guardianConsent: true,
          }),
        );
      } else {
        localStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
      }
      // 학부모 결제: success가 자녀 명의 complete 라우트로 처리하도록 마커 저장.
      if (isParentCheckout && selectedChildId) {
        localStorage.setItem(
          CHECKOUT_PARENT_STORAGE_KEY,
          JSON.stringify({ orderId, studentId: selectedChildId }),
        );
      } else {
        localStorage.removeItem(CHECKOUT_PARENT_STORAGE_KEY);
      }
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerMobilePhone: phoneDigits,
        successUrl: `${origin}/success`,
        failUrl: `${origin}/checkout?tutor=${encodeURIComponent(tutorId)}&plan=${encodeURIComponent(plan.id)}&error=1`,
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
    isParentCheckout,
    name,
    needsSignup,
    password,
    passwordConfirm,
    plan.id,
    planLabel,
    selectedChildId,
    selectedSubjects,
    termsAgreed,
    tutorId,
    tutorName,
    phone,
  ]);

  // 학부모인데 연결된 자녀가 없으면 결제를 진행할 수 없다 — 연결 안내로 대체.
  if (isParentCheckout && !hasChildren) {
    return (
      <main>
        <ConcordPageHead
          eyebrow={c("header_kicker", "Checkout")}
          title={c("header_title", "결제")}
          description="자녀를 먼저 연결하면 자녀 명의로 결제를 진행할 수 있습니다."
        />
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <article
              className="card panel-card"
              style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}
            >
              <h2 className="panel-title">연결된 자녀가 없습니다</h2>
              <p className="panel-note" style={{ marginTop: 8 }}>
                자녀 계정을 연결한 뒤 자녀 명의로 결제를 진행할 수 있습니다.
              </p>
              <div className="form-actions" style={{ justifyContent: "center", marginTop: 24 }}>
                <Link href="/parent/link" className="btn btn-acc">
                  자녀 연결하기
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    );
  }

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
                    <CmsText active={isEditMode} cmsKey="dt_monthly_hours">
                      <dt>{c("dt_monthly_hours", "월 수업 시간")}</dt>
                    </CmsText>
                    <dd>{plan.monthlyHours}시간 / 월</dd>
                  </div>
                  <div className="kv-row">
                    <CmsText active={isEditMode} cmsKey="dt_tutor">
                      <dt>{c("dt_tutor", "강사")}</dt>
                    </CmsText>
                    <dd>{tutorName}</dd>
                  </div>
                  {plan.listPriceKrw && plan.listPriceKrw > plan.priceKrw ? (
                    <div className="kv-row">
                      <CmsText active={isEditMode} cmsKey="dt_list_price">
                        <dt>{c("dt_list_price", "정가 (시간당 5만원)")}</dt>
                      </CmsText>
                      <dd style={{ textDecoration: "line-through", opacity: 0.7 }}>
                        {formatKRW(plan.listPriceKrw)}
                      </dd>
                    </div>
                  ) : null}
                  {plan.discountRate ? (
                    <div className="kv-row">
                      <CmsText active={isEditMode} cmsKey="dt_discount">
                        <dt>{c("dt_discount", "할인")}</dt>
                      </CmsText>
                      <dd style={{ color: "var(--acc-text, #FF6B6B)", fontWeight: 700 }}>
                        {plan.discountRate}% ↓
                      </dd>
                    </div>
                  ) : null}
                  <div className="kv-row total">
                    <CmsText active={isEditMode} cmsKey="dt_total">
                      <dt>{c("dt_total", "월정액")}</dt>
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
              {isParentCheckout && parentChildren ? (
                <article className="card panel-card">
                  <h2 className="panel-title">결제할 자녀</h2>
                  <p className="panel-note" style={{ marginTop: 4, marginBottom: 12 }}>
                    선택한 자녀 명의로 플랜이 시작됩니다.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {parentChildren.map((child) => (
                      <label
                        key={child.id}
                        className="check-row"
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name="checkout-child"
                          value={child.id}
                          checked={selectedChildId === child.id}
                          onChange={() => setSelectedChildId(child.id)}
                        />
                        <span>
                          <b>{child.name}</b>
                          {child.grade ? ` · ${child.grade}` : ""}
                          {child.hasActiveSubscription ? (
                            <span style={{ color: "var(--mut)", marginLeft: 6 }}>
                              (진행 중인 플랜 있음 · 플랜 변경으로 처리됩니다)
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className="card panel-card">
                <CmsText active={isEditMode} cmsKey="section_customer_title">
                  <h2 className="panel-title">
                    {c(
                      "section_customer_title",
                      isParentCheckout
                        ? "결제자 정보"
                        : needsSignup
                          ? "주문자 · 가입 정보"
                          : "주문자 정보",
                    )}
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
                        <label>희망 과목 (선택)</label>
                        <p className="panel-note" style={{ marginTop: 0, marginBottom: 10 }}>
                          상담 시 담당 매니저와 조율됩니다. 원하시는 과목을 자유롭게 선택해 주세요.
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
                    에 동의하며, 미성년 학생의 경우 보호자(법정대리인)로서
                    개인정보 수집·이용 및 서비스 이용에 동의합니다. (필수)
                  </span>
                </label>

                {error ? (
                  <p className="field-error" style={{ marginTop: 16, fontSize: 14 }} role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="panel-note" style={{ marginTop: 16, fontSize: 13, padding: "12px 14px", backgroundColor: "rgba(var(--acc-rgb), 0.08)", borderRadius: "8px" }}>
                  <p style={{ textAlign: "center", margin: 0 }}>
                    <span>{c("refund_guarantee", "첫 수업 후 불만족 시 100% 환불해 드립니다. ")}</span>
                    <Link href="/refund" style={{ color: "var(--acc-text)", textDecoration: "underline" }}>
                      {c("refund_policy_link", "환불정책")}
                    </Link>
                  </p>
                  <ul style={{ margin: "10px 0 0", paddingLeft: "1.1rem", fontSize: 12, lineHeight: 1.7, color: "var(--mut)" }}>
                    <li>수업 시작 전: 전액 환불</li>
                    <li>첫 수업 후 3일 이내: 위약금 없이 100% 환불 (최초 1회)</li>
                    <li>월 중도 해지: 진행된 회차의 정가만 공제 후 잔액 환불</li>
                  </ul>
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
