import crypto from "crypto";

const SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send";

function makeAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/** 한국 전화번호를 숫자만 남겨 Solapi 포맷으로 변환 (01012345678) */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * SMS 단문 발송 (Solapi REST API).
 * 환경변수 미설정 시 no-op, 실패해도 예외를 던지지 않음.
 */
export async function sendSms(to: string, text: string): Promise<void> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_PHONE;

  if (!apiKey || !apiSecret || !from) return;

  const normalized = normalizePhone(to);
  if (!normalized) return;

  try {
    const res = await fetch(SOLAPI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({
        message: { to: normalized, from: normalizePhone(from), text },
      }),
    });
    if (!res.ok) {
      console.error("[SMS] Solapi error:", await res.text());
    }
  } catch (e) {
    console.error("[SMS] Failed to send:", e);
  }
}
