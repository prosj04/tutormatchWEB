"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { trackEvent } from "@/lib/analytics-client";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { GroupedSiteContent } from "@/lib/site-content";

const CHECKOUT_SIGNUP_STORAGE_KEY = "concord-checkout-signup";

type PendingCheckoutSignup = {
  orderId: string;
  name: string;
  phone: string;
  guardianPhone?: string;
  grade: string;
  gender: "MALE" | "FEMALE";
  password: string;
  subjects: string[];
  guardianConsent?: boolean;
};

type Status = "loading" | "done" | "no-data" | "error";

type SuccessPaymentCompleteProps = {
  orderId?: string;
  paymentKey?: string;
  amount?: number;
  siteContent?: GroupedSiteContent;
};

/** 결제 성공 리다이렉트 후 Chief 매니저 즉시 배정 */
export function SuccessPaymentComplete({ orderId, paymentKey, amount, siteContent }: SuccessPaymentCompleteProps) {
  const phone = getCmsSectionValue(siteContent, "footer", "phone_number", "010-0000-0000");
  const called = useRef(false);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!orderId?.trim() || called.current) return;
    called.current = true;
    const safeOrderId = orderId.trim();

    trackEvent(ANALYTICS_EVENTS.paymentCompleted, {
      order_id: safeOrderId,
      amount: typeof amount === "number" && Number.isFinite(amount) ? amount : null,
    });

    async function handleExistingStudent(): Promise<"ok" | "unauth" | "error"> {
      const res = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: safeOrderId,
          paymentKey: paymentKey?.trim() || undefined,
          amount: Number.isFinite(amount) ? amount : undefined,
        }),
      });
      if (res.status === 401) return "unauth";
      if (!res.ok) return "error";
      return "ok";
    }

    async function handleCheckoutSignup(payload: PendingCheckoutSignup): Promise<"ok" | "error"> {
      const registerRes = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          guardianPhone: payload.guardianPhone,
          password: payload.password,
          grade: payload.grade,
          gender: payload.gender,
          subjects: payload.subjects,
          instantEnroll: true,
          // 구버전 세션 payload(필드 부재)는 결제 시점 필수 약관 동의를 근거로 true 처리
          guardianConsent: payload.guardianConsent !== false,
        }),
      });

      const identifier = normalizePhoneDigits(payload.phone);

      if (registerRes.status === 409) {
        const signResult = await signIn("credentials", {
          identifier,
          password: payload.password,
          redirect: false,
        });
        if (!signResult?.ok) return "error";
        const result = await handleExistingStudent();
        return result === "ok" ? "ok" : "error";
      }

      if (!registerRes.ok) return "error";

      const signResult = await signIn("credentials", {
        identifier,
        password: payload.password,
        redirect: false,
      });
      if (!signResult?.ok) return "error";
      const result = await handleExistingStudent();
      return result === "ok" ? "ok" : "error";
    }

    async function run() {
      try {
        const raw = sessionStorage.getItem(CHECKOUT_SIGNUP_STORAGE_KEY);

        if (raw) {
          const payload = JSON.parse(raw) as PendingCheckoutSignup;
          if (payload.orderId === safeOrderId) {
            const result = await handleCheckoutSignup(payload);
            sessionStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
            if (result === "ok") {
              setStatus("done");
              router.push("/dashboard");
            } else {
              setStatus("error");
            }
            return;
          }
        }

        // 기존 로그인 학생 경로
        const result = await handleExistingStudent();
        if (result === "ok") {
          setStatus("done");
          router.push("/dashboard");
        } else if (result === "unauth") {
          setStatus("no-data");
        } else {
          setStatus("error");
        }
      } catch (e) {
        console.error("[success] SuccessPaymentComplete:", e);
        setStatus("error");
      }
    }

    void run();
  }, [orderId, paymentKey, amount, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        처리 중입니다…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700 mb-6">
        처리 중 오류가 발생했습니다. 아래 연락처로 문의해 주시면 바로 도와드리겠습니다.
        <div className="mt-2 font-semibold">
          <a href={`tel:${phone.replace(/[^0-9]/g, "")}`} className="underline">{phone}</a>
        </div>
      </div>
    );
  }

  if (status === "no-data") {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-center text-sm text-yellow-800 mb-6">
        결제 정보를 확인하는 중 문제가 발생했습니다.
        <br />
        담당자에게 연락하시면 즉시 처리해 드립니다.
        <div className="mt-2 font-semibold">
          <a href={`tel:${phone.replace(/[^0-9]/g, "")}`} className="underline">{phone}</a>
        </div>
      </div>
    );
  }

  return null;
}
