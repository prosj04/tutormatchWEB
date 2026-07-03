const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
const TOSS_FETCH_URL = "https://api.tosspayments.com/v1/payments";

export type CashReceipt = {
  type: string; // e.g. "소득공제" | "지출증빙"
  receiptUrl: string;
} | null;

/**
 * Toss 서버 fetch API 호출 — 특정 paymentKey의 결제 상태를 조회한다.
 * 웹훅 검증에 사용: 웹훅 본문을 신뢰하지 않고 Toss 서버에서 직접 확인.
 */
export async function fetchTossPayment(paymentKey: string): Promise<{
  paymentKey: string;
  orderId: string;
  status: string;
  amount: number;
  cashReceipt: CashReceipt;
}> {
  const secret = process.env.TOSS_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOSS_SECRET_KEY is required in production");
    }
    console.warn(
      "[toss-payments] TOSS_SECRET_KEY not set — skipping Toss fetch (dev-only bypass)",
    );
    return {
      paymentKey,
      orderId: "",
      status: "DONE",
      amount: 0,
      cashReceipt: null,
    };
  }

  if (!paymentKey) {
    throw new Error("TOSS_FETCH_MISSING_PAYMENT_KEY");
  }

  const credentials = Buffer.from(`${secret}:`).toString("base64");
  const url = `${TOSS_FETCH_URL}/${encodeURIComponent(paymentKey)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    let errorCode = "";
    try {
      const json = (await res.json()) as { code?: string; message?: string };
      errorCode = json.code ?? "";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // ignore parse error
    }
    throw new Error(`TOSS_FETCH_FAILED:${errorCode}`);
  }

  const data = (await res.json()) as {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
    cashReceipt?: {
      type?: string;
      receiptUrl?: string;
    } | null;
  };

  let cashReceipt: CashReceipt = null;
  if (data.cashReceipt?.type && data.cashReceipt?.receiptUrl) {
    cashReceipt = {
      type: data.cashReceipt.type,
      receiptUrl: data.cashReceipt.receiptUrl,
    };
  }

  return {
    paymentKey: data.paymentKey ?? "",
    orderId: data.orderId ?? "",
    status: data.status ?? "",
    amount: data.totalAmount ?? 0,
    cashReceipt,
  };
}

/**
 * Toss 서버 confirm API 호출.
 *
 * - TOSS_SECRET_KEY 있음: Toss API 호출. "이미 처리된 결제"(ALREADY_PROCESSED_PAYMENT)는
 *   성공으로 취급한다 — FAILED 상태 재시도 시 Toss는 이미 캡처한 결제를 재확인할 수 없으나
 *   결제는 유효하므로 DB 처리를 이어 진행한다.
 * - TOSS_SECRET_KEY 없음 + production: 에러 (결제 위조 방지)
 * - TOSS_SECRET_KEY 없음 + dev/test: 경고 후 통과
 */
export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<void> {
  const secret = process.env.TOSS_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOSS_SECRET_KEY is required in production");
    }
    console.warn(
      "[toss-payments] TOSS_SECRET_KEY not set — skipping Toss confirm (dev-only bypass)",
    );
    return;
  }

  if (!paymentKey) {
    throw new Error("TOSS_CONFIRM_MISSING_PAYMENT_KEY");
  }

  const credentials = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (res.ok) return;

  let errorCode = "";
  try {
    const json = (await res.json()) as { code?: string; message?: string };
    errorCode = json.code ?? "";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // ignore parse error
  }

  // Toss returns this when the payment was already confirmed (e.g., FAILED-retry path).
  // The capture already succeeded; proceed to finish the DB work.
  if (errorCode === "ALREADY_PROCESSED_PAYMENT") return;

  throw new Error(`TOSS_CONFIRM_FAILED:${errorCode}`);
}
