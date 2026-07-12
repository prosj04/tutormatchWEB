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
const CHECKOUT_PARENT_STORAGE_KEY = "concord-checkout-parent";
const CHECKOUT_DRAFT_STORAGE_KEY = "concord-checkout-draft";

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

type PendingParentCheckout = {
  orderId: string;
  studentId: string;
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
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderId?.trim()) return;
    // 최초 1회만 자동 실행. attempt 증가(재시도)는 아래 별도 가드로 통과시킨다.
    if (called.current && attempt === 0) return;
    called.current = true;
    const safeOrderId = orderId.trim();

    if (attempt === 0) {
      trackEvent(ANALYTICS_EVENTS.paymentCompleted, {
        order_id: safeOrderId,
        amount: typeof amount === "number" && Number.isFinite(amount) ? amount : null,
      });
    }

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

    async function handleParentCheckout(payload: PendingParentCheckout): Promise<"ok" | "error"> {
      const res = await fetch("/api/parent/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: payload.studentId,
          orderId: safeOrderId,
          paymentKey: paymentKey?.trim() || undefined,
          amount: Number.isFinite(amount) ? amount : undefined,
        }),
      });
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
      setStatus("loading");
      try {
        // 학부모 결제 마커(자녀 명의 결제)
        const parentRaw = localStorage.getItem(CHECKOUT_PARENT_STORAGE_KEY);
        if (parentRaw) {
          const payload = JSON.parse(parentRaw) as PendingParentCheckout;
          if (payload.orderId === safeOrderId) {
            const result = await handleParentCheckout(payload);
            if (result === "ok") {
              localStorage.removeItem(CHECKOUT_PARENT_STORAGE_KEY);
              sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
              setStatus("done");
              router.push("/parent/payments");
            } else {
              // 실패 시 마커를 남겨 재시도 가능하게 한다.
              setStatus("error");
            }
            return;
          }
        }

        // 비회원 신규가입 결제(localStorage 우선, 구버전 sessionStorage 폴백)
        const raw =
          localStorage.getItem(CHECKOUT_SIGNUP_STORAGE_KEY) ??
          sessionStorage.getItem(CHECKOUT_SIGNUP_STORAGE_KEY);

        if (raw) {
          const payload = JSON.parse(raw) as PendingCheckoutSignup;
          if (payload.orderId === safeOrderId) {
            const result = await handleCheckoutSignup(payload);
            if (result === "ok") {
              // 성공 시에만 가입정보 소진 — 실패하면 재시도 위해 보존한다(D3).
              localStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
              sessionStorage.removeItem(CHECKOUT_SIGNUP_STORAGE_KEY);
              sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
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
          sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
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
  }, [orderId, paymentKey, amount, router, attempt]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        처리 중입니다…
      </div>
    );
  }

  if (status === "error") {
    // D2: dead-end 금지 — 결제는 접수되었고 웹훅 백업으로 자동 처리됨을 안심시키고 재시도 제공.
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-center text-sm text-yellow-800 mb-6">
        결제는 정상적으로 접수되었으며 자동으로 처리됩니다. 잠시 후 결제 내역에서 확인하실 수 있습니다.
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-lg border border-yellow-300 bg-white px-4 py-1.5 text-xs font-semibold text-yellow-800 transition hover:bg-yellow-100"
          >
            다시 확인
          </button>
          <a
            href={`tel:${phone.replace(/[^0-9]/g, "")}`}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-yellow-800 underline"
          >
            {phone}
          </a>
        </div>
      </div>
    );
  }

  if (status === "no-data") {
    // D12: 로그인 세션이 없어 자동 처리 불가한 경우에도 접수 사실을 안내하고 재시도 제공.
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-center text-sm text-yellow-800 mb-6">
        결제가 정상 접수되었는지 확인 중입니다. 로그인 후 결제 내역에서 확인하실 수 있으며, 자동으로도 처리됩니다.
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-lg border border-yellow-300 bg-white px-4 py-1.5 text-xs font-semibold text-yellow-800 transition hover:bg-yellow-100"
          >
            다시 확인
          </button>
          <a
            href={`tel:${phone.replace(/[^0-9]/g, "")}`}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-yellow-800 underline"
          >
            {phone}
          </a>
        </div>
      </div>
    );
  }

  return null;
}
