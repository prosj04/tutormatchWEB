"use client";

import { useEffect, useRef } from "react";

type SuccessPaymentCompleteProps = {
  orderId?: string;
  paymentKey?: string;
  amount?: number;
};

/** 결제 성공 리다이렉트 후 Chief 매니저 즉시 배정 */
export function SuccessPaymentComplete({ orderId, paymentKey, amount }: SuccessPaymentCompleteProps) {
  const called = useRef(false);

  useEffect(() => {
    if (!orderId?.trim() || called.current) return;
    called.current = true;
    void fetch("/api/payments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: orderId.trim(),
        paymentKey: paymentKey?.trim() || undefined,
        amount: Number.isFinite(amount) ? amount : undefined,
      }),
    }).catch((e) => console.error("[success] payments/complete:", e));
  }, [orderId, paymentKey, amount]);

  return null;
}
