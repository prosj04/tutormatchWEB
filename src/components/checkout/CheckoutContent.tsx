"use client";

import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import {
  ANONYMOUS,
  clearPaymentWidget,
  loadPaymentWidget,
} from "@tosspayments/payment-widget-sdk";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatKRW } from "@/lib/format-won";
import {
  getPriceBreakdown,
  PLAN_LABEL,
  type SessionPlan,
} from "@/lib/order-pricing";
import { TOSS_WIDGET_CLIENT_KEY } from "@/lib/toss-client";
import { getTutorById } from "@/lib/tutors-data";

type PMW = ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>;

const PAYMENT_SELECTOR = "#concord-payment-methods";
const AGREEMENT_SELECTOR = "#concord-agreement";

type CheckoutContentProps = {
  tutorId: string;
  sessions: SessionPlan;
};

export function CheckoutContent({ tutorId, sessions }: CheckoutContentProps) {
  const tutor = getTutorById(tutorId);
  const tutorName = tutor?.name ?? "강사 미지정";

  const { total, platformFee, lessonFee } = getPriceBreakdown(sessions);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePay = useCallback(async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("이름, 연락처, 이메일을 모두 입력해 주세요.");
      return;
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
    const orderName = `Concord ${PLAN_LABEL[sessions]} · ${tutorName}`;

    setPaying(true);
    try {
      const origin = window.location.origin;
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerMobilePhone: phone.replace(/\D/g, ""),
        successUrl: `${origin}/success`,
        failUrl: `${origin}/checkout?tutor=${encodeURIComponent(tutorId)}&sessions=${sessions}&error=1`,
      });
    } catch (e) {
      console.error(e);
      setError("결제 요청 중 문제가 발생했습니다.");
    } finally {
      setPaying(false);
    }
  }, [name, phone, email, termsAgreed, sessions, tutorName, tutorId]);

  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-24">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Checkout</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-primary sm:text-6xl">결제</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="mb-10">
          <Link
            href={tutor ? `/tutors/${tutorId}` : "/tutors"}
            className="text-xs font-semibold uppercase tracking-wider text-text-muted underline-offset-4 transition hover:text-primary hover:underline"
          >
            ← {tutor ? "강사 프로필로 돌아가기" : "강사 목록"}
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-16">
          <div className="space-y-10">
            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-text-primary">주문 요약</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="text-text-secondary">플랜</dt>
                  <dd className="font-semibold text-text-primary">{PLAN_LABEL[sessions]}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="text-text-secondary">강사</dt>
                  <dd className="font-semibold text-text-primary">{tutorName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="text-text-secondary">플랫폼 이용료</dt>
                  <dd className="text-text-primary">{formatKRW(platformFee)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="text-text-secondary">수업료</dt>
                  <dd className="text-text-primary">{formatKRW(lessonFee)}</dd>
                </div>
                <div className="flex justify-between gap-4 pt-2">
                  <dt className="text-lg font-black text-text-primary">총 결제금액</dt>
                  <dd className="text-xl font-black text-primary">{formatKRW(total)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-text-primary">결제 수단</h2>
              <p className="mt-2 text-xs text-text-muted">
                테스트 키로 연동되어 실제 결제는 이루어지지 않습니다.
              </p>
              <div
                id="concord-payment-methods"
                className="mt-6 min-h-[120px] w-full"
              />
              <div id="concord-agreement" className="mt-6 w-full" />
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-text-primary">주문자 정보</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                  >
                    이름
                  </label>
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
                  <label
                    htmlFor="checkout-phone"
                    className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                  >
                    연락처
                  </label>
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
                  <label
                    htmlFor="checkout-email"
                    className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                  >
                    이메일
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                  />
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-primary"
                />
                <span className="text-sm leading-relaxed text-text-secondary">
                  전자상거래 및 결제 관련 약관, 개인정보 처리방침에 동의합니다. (필수)
                </span>
              </label>

              {error ? (
                <p className="mt-4 text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={paying || !widgetReady}
                onClick={handlePay}
                className="mt-8 w-full rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paying ? "처리 중…" : "결제하기"}
              </button>
              {!widgetReady && !error ? (
                <p className="mt-3 text-center text-xs text-text-muted">결제 UI를 불러오는 중…</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
