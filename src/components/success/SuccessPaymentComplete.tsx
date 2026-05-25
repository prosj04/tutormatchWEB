"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

import { normalizePhoneDigits } from "@/lib/phone-login";

const CHECKOUT_SIGNUP_STORAGE_KEY = "concord-checkout-signup";

type PendingCheckoutSignup = {
  orderId: string;
  name: string;
  phone: string;
  grade: string;
  gender: "MALE" | "FEMALE";
  password: string;
  subjects: string[];
};

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
    const safeOrderId = orderId.trim();

    async function handleExistingStudent() {
      await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: safeOrderId,
          paymentKey: paymentKey?.trim() || undefined,
          amount: Number.isFinite(amount) ? amount : undefined,
        }),
      });
    }

    async function handleCheckoutSignup(payload: PendingCheckoutSignup) {
      const registerRes = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          password: payload.password,
          grade: payload.grade,
          gender: payload.gender,
          subjects: payload.subjects,
          instantEnroll: true,
        }),
      });

      if (registerRes.status === 409) {
        const signResult = await signIn("credentials", {
          identifier: normalizePhoneDigits(payload.phone),
          password: payload.password,
          redirect: false,
        });
        if (signResult?.ok) {
          await handleExistingStudent();
        }
        return;
      }

      if (!registerRes.ok) return;

      await signIn("credentials", {
        identifier: normalizePhoneDigits(payload.phone),
        password: payload.password,
        redirect: false,
      });
    }

    async function run() {
      try {
        const raw = sessionStorage.getItem(CHECKOUT_SIGNUP_STORAGE_KEY);
        if (!raw) {
          await handleExistingStudent();
          return;
        }
        const payload = JSON.parse(raw) as PendingCheckoutSignup;
        if (payload.orderId !== safeOrderId) {
          await handleExistingStudent();
          return;
        }
        await handleCheckoutSignup(payload);
        sessionStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
      } catch (e) {
        console.error("[success] payments/complete:", e);
      }
    }

    void run();
  }, [orderId, paymentKey, amount]);

  return null;
}
