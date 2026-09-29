"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TOSS_WIDGET_CLIENT_KEY } from "@/lib/toss-client";

type TossPaymentsConstructor = (clientKey: string) => {
  requestBillingAuth: (
    method: "카드",
    params: {
      customerKey: string;
      successUrl: string;
      failUrl: string;
    },
  ) => Promise<unknown>;
};

const TOSS_SDK_SRC = "https://js.tosspayments.com/v1/payment";

type BillingManageSectionProps = {
  customerKey: string;
  profile: {
    cardCompany: string | null;
    cardNumberMasked: string | null;
    autoRenew: boolean;
  } | null;
  billingParam: string | null;
};

function getTossFactory(): TossPaymentsConstructor | null {
  if (typeof window === "undefined") return null;
  const raw = (window as unknown as Record<string, unknown>).TossPayments;
  return typeof raw === "function"
    ? (raw as TossPaymentsConstructor)
    : null;
}

async function loadTossSdk(): Promise<ReturnType<TossPaymentsConstructor>> {
  if (typeof window === "undefined") {
    throw new Error("SSR");
  }
  const initial = getTossFactory();
  if (initial) {
    return initial(TOSS_WIDGET_CLIENT_KEY);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TOSS_SDK_SRC}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Toss SDK load failed")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      resolve();
    });
    script.addEventListener("error", () =>
      reject(new Error("Toss SDK load failed")),
    );
    document.body.appendChild(script);
  });

  const factory = getTossFactory();
  if (!factory) {
    throw new Error("Toss SDK unavailable");
  }
  return factory(TOSS_WIDGET_CLIENT_KEY);
}

export function BillingManageSection({
  customerKey,
  profile,
  billingParam,
}: BillingManageSectionProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState<boolean>(profile?.autoRenew ?? true);
  const bannerShownRef = useRef(false);

  useEffect(() => {
    if (bannerShownRef.current) return;
    if (billingParam === "registered") {
      setBanner("자동결제 카드가 등록되었습니다.");
      bannerShownRef.current = true;
    } else if (billingParam === "failed") {
      setError("자동결제 카드 등록에 실패했습니다. 다시 시도해 주세요.");
      bannerShownRef.current = true;
    }
  }, [billingParam]);

  const openRegister = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const toss = await loadTossSdk();
      const origin = window.location.origin;
      await toss.requestBillingAuth("카드", {
        customerKey,
        successUrl: `${origin}/api/billing/register-success`,
        failUrl: `${origin}/payments?billing=failed`,
      });
    } catch (e) {
      console.error(e);
      setError("결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }, [customerKey]);

  const toggleAutoRenew = useCallback(
    async (enabled: boolean) => {
      setError(null);
      setBusy(true);
      try {
        const res = await fetch("/api/billing/autorenew", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) throw new Error("toggle failed");
        const json = (await res.json()) as { autoRenew: boolean };
        setAutoRenew(json.autoRenew);
        setBanner(
          json.autoRenew
            ? "자동결제가 활성화되었습니다."
            : "자동결제가 해지되었습니다. 다음 결제일부터 청구되지 않습니다.",
        );
      } catch (e) {
        console.error(e);
        setError("변경에 실패했습니다. 다시 시도해 주세요.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <section>
      <h2 className="st-sec-title">자동결제 관리</h2>

      {banner && (
        <div className="banner info" style={{ marginBottom: "16px" }}>
          <span>{banner}</span>
        </div>
      )}
      {error && (
        <div className="banner err" style={{ marginBottom: "16px" }} role="alert">
          <span>{error}</span>
        </div>
      )}

      {!profile ? (
        <>
          <p className="st-lead" style={{ margin: 0 }}>
            아직 자동결제 카드가 등록되어 있지 않습니다.
          </p>
          <div className="st-actions">
            <button type="button" onClick={openRegister} disabled={busy} className="btn pri">
              {busy ? "이동 중…" : "자동결제 카드 등록"}
            </button>
          </div>
          <p className="footnote" style={{ marginTop: "16px", maxWidth: "38em" }}>
            자동결제는 언제든 해지할 수 있으며, 해지 시 다음 결제일부터 청구되지
            않습니다.
          </p>
        </>
      ) : (
        <>
          <div className="st-billing-card">
            <div className="st-card-meta">
              <b>{profile.cardCompany ?? "등록된 카드"}</b>
              <p>{profile.cardNumberMasked ?? "**** **** **** ****"}</p>
            </div>
            <span className={autoRenew ? "bst acc" : "bst mut"}>
              {autoRenew ? "자동결제 사용 중" : "자동결제 해지됨"}
            </span>
          </div>

          <div className="st-actions">
            <button
              type="button"
              onClick={() => toggleAutoRenew(!autoRenew)}
              disabled={busy}
              className={autoRenew ? "btn btn-ghost" : "btn pri"}
            >
              {autoRenew ? "자동결제 해지" : "자동결제 다시 사용"}
            </button>
            <button type="button" onClick={openRegister} disabled={busy} className="btn btn-ghost">
              카드 변경
            </button>
          </div>

          <p className="footnote" style={{ marginTop: "16px", maxWidth: "38em" }}>
            자동결제는 언제든 해지할 수 있으며, 해지 시 다음 결제일부터 청구되지
            않습니다.
          </p>
        </>
      )}
    </section>
  );
}
