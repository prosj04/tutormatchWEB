"use client";

import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import {
  ANONYMOUS,
  clearPaymentWidget,
  loadPaymentWidget,
} from "@tosspayments/payment-widget-sdk";
import { useEffect, useRef, type MutableRefObject } from "react";

import { TOSS_WIDGET_CLIENT_KEY } from "@/lib/toss-client";

const PAYMENT_SELECTOR = "#concord-payment-methods";
const AGREEMENT_SELECTOR = "#concord-agreement";

type PMW = ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>;

type CheckoutTossWidgetProps = {
  total: number;
  onReadyChange: (ready: boolean) => void;
  onError: (message: string) => void;
  paymentWidgetRef: MutableRefObject<PaymentWidgetInstance | null>;
  paymentMethodsRef: MutableRefObject<PMW | null>;
};

export function CheckoutTossWidget({
  total,
  onReadyChange,
  onError,
  paymentWidgetRef,
  paymentMethodsRef,
}: CheckoutTossWidgetProps) {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        clearPaymentWidget();
        const paymentWidget = await loadPaymentWidget(TOSS_WIDGET_CLIENT_KEY, ANONYMOUS);
        if (cancelled) return;

        paymentWidgetRef.current = paymentWidget;
        const pmw = paymentWidget.renderPaymentMethods(
          PAYMENT_SELECTOR,
          { currency: "KRW", value: total },
          { variantKey: "DEFAULT" },
        );
        paymentMethodsRef.current = pmw;
        paymentWidget.renderAgreement(AGREEMENT_SELECTOR);
        if (!cancelled && mountedRef.current) onReadyChange(true);
      } catch (e) {
        console.error(e);
        if (!cancelled && mountedRef.current) {
          onError("결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      paymentWidgetRef.current = null;
      paymentMethodsRef.current = null;
      clearPaymentWidget();
      onReadyChange(false);
    };
  }, [onError, onReadyChange, paymentMethodsRef, paymentWidgetRef, total]);

  useEffect(() => {
    paymentMethodsRef.current?.updateAmount(total);
  }, [paymentMethodsRef, total]);

  return (
    <>
      <div id="concord-payment-methods" style={{ marginTop: 24, minHeight: 120, width: "100%" }} />
      <div id="concord-agreement" style={{ marginTop: 24, width: "100%" }} />
    </>
  );
}

export type { PMW };
