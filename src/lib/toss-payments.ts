const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
const TOSS_FETCH_URL = "https://api.tosspayments.com/v1/payments";
const TOSS_BILLING_ISSUE_URL =
  "https://api.tosspayments.com/v1/billing/authorizations/issue";
const TOSS_BILLING_CHARGE_URL = "https://api.tosspayments.com/v1/billing";

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

export type IssuedBillingKey = {
  billingKey: string;
  customerKey: string;
  cardCompany: string | null;
  cardNumberMasked: string | null;
};

/**
 * Toss 빌링키 발급 API. successUrl 리다이렉트로 받은 authKey를 서버에서 교환하여
 * 재사용 가능한 billingKey를 발급받는다. TOSS_SECRET_KEY 필요 (Basic auth).
 * 개발 환경(dev)에서 secret 미설정 시 결제 위조 방지를 위해 명시적으로 에러를 던진다.
 * — 빌링키는 이후 정기결제 청구에 그대로 쓰이므로 dev-only bypass를 두지 않는다.
 */
export async function issueBillingKey(
  authKey: string,
  customerKey: string,
): Promise<IssuedBillingKey> {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    throw new Error("TOSS_SECRET_KEY is required for billing key issuance");
  }
  if (!authKey) {
    throw new Error("TOSS_BILLING_MISSING_AUTH_KEY");
  }
  if (!customerKey) {
    throw new Error("TOSS_BILLING_MISSING_CUSTOMER_KEY");
  }

  const credentials = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(TOSS_BILLING_ISSUE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
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
    throw new Error(`TOSS_BILLING_ISSUE_FAILED:${errorCode}`);
  }

  const data = (await res.json()) as {
    billingKey?: string;
    customerKey?: string;
    cardCompany?: string | null;
    card?: { company?: string | null; number?: string | null } | null;
    cardNumber?: string | null;
  };

  return {
    billingKey: data.billingKey ?? "",
    customerKey: data.customerKey ?? customerKey,
    cardCompany: data.cardCompany ?? data.card?.company ?? null,
    cardNumberMasked: data.card?.number ?? data.cardNumber ?? null,
  };
}

export type ChargeBillingKeyParams = {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
};

export type ChargedBillingResult = {
  paymentKey: string;
  orderId: string;
  status: string;
  amount: number;
};

/**
 * Toss 빌링키 청구. 이미 발급된 billingKey에 대해 지정 금액을 즉시 캡처한다.
 * Toss는 동일 orderId에 대한 중복 청구를 거절하므로 호출부에서 PaymentCompletion
 * COMPLETED 사전 체크로 idempotency를 유지한다. 실패 시 `TOSS_BILLING_CHARGE_FAILED:{code}`
 * 형태의 에러를 던져 상위 로직이 dunning 트랙(PAST_DUE)으로 유도할 수 있도록 한다.
 */
export async function chargeBillingKey({
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
  customerName,
}: ChargeBillingKeyParams): Promise<ChargedBillingResult> {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    throw new Error("TOSS_SECRET_KEY is required for billing charge");
  }
  if (!billingKey) throw new Error("TOSS_BILLING_MISSING_BILLING_KEY");
  if (!customerKey) throw new Error("TOSS_BILLING_MISSING_CUSTOMER_KEY");
  if (!orderId) throw new Error("TOSS_BILLING_MISSING_ORDER_ID");
  if (!(amount > 0 && Number.isFinite(amount))) {
    throw new Error("TOSS_BILLING_INVALID_AMOUNT");
  }

  const credentials = Buffer.from(`${secret}:`).toString("base64");
  const url = `${TOSS_BILLING_CHARGE_URL}/${encodeURIComponent(billingKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
      customerName,
    }),
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
    throw new Error(`TOSS_BILLING_CHARGE_FAILED:${errorCode}`);
  }

  const data = (await res.json()) as {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
  };

  return {
    paymentKey: data.paymentKey ?? "",
    orderId: data.orderId ?? orderId,
    status: data.status ?? "",
    amount: data.totalAmount ?? amount,
  };
}
