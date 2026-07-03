import crypto from "crypto";

const SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send";

/**
 * Kakao Alimtalk template mapping.
 *
 * Set env vars to enable:
 *   SOLAPI_KAKAO_PF_ID          — Kakao channel Plus Friend ID (required for Alimtalk)
 *   SOLAPI_KAKAO_TEMPLATE_<KEY> — Solapi template ID per logical key, e.g.
 *     SOLAPI_KAKAO_TEMPLATE_CONSULTATION_REMINDER
 *     SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRY_SOON
 *     SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRED_SOON
 *     SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRED
 *     SOLAPI_KAKAO_TEMPLATE_SATISFACTION_CHECKIN
 *
 * When SOLAPI_KAKAO_PF_ID is set and the resolved templateId is non-empty,
 * the message is sent as Alimtalk with disableSms:false so Solapi auto-falls
 * back to plain SMS if the KakaoTalk channel fails.  Callers that do not pass
 * templateCode keep the existing plain-SMS path.
 */
const KAKAO_TEMPLATE_ENV_KEYS: Record<string, string> = {
  CONSULTATION_REMINDER: "SOLAPI_KAKAO_TEMPLATE_CONSULTATION_REMINDER",
  SUBSCRIPTION_EXPIRY_SOON: "SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRY_SOON",
  SUBSCRIPTION_EXPIRED_SOON: "SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRED_SOON",
  SUBSCRIPTION_EXPIRED: "SOLAPI_KAKAO_TEMPLATE_SUBSCRIPTION_EXPIRED",
  SATISFACTION_CHECKIN: "SOLAPI_KAKAO_TEMPLATE_SATISFACTION_CHECKIN",
};

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
 *
 * @param to           - 수신 전화번호
 * @param text         - 메시지 본문 (Alimtalk fallback body로도 사용)
 * @param templateCode - 선택적 논리 키 (KAKAO_TEMPLATE_ENV_KEYS 참조).
 *                       설정 시 Alimtalk-first 경로를 시도하고,
 *                       미설정·실패 시 plain SMS로 폴백.
 */
export async function sendSms(
  to: string,
  text: string,
  templateCode?: string,
): Promise<void> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_PHONE;

  if (!apiKey || !apiSecret || !from) return;

  const normalized = normalizePhone(to);
  if (!normalized) return;

  const pfId = process.env.SOLAPI_KAKAO_PF_ID;
  const templateId =
    templateCode && pfId
      ? (process.env[KAKAO_TEMPLATE_ENV_KEYS[templateCode] ?? ""] ?? "")
      : "";

  // Build base message payload.
  const baseMessage: Record<string, unknown> = {
    to: normalized,
    from: normalizePhone(from),
    text,
  };

  // Alimtalk-first path: merge kakaoOptions when pfId + templateId are both set.
  if (pfId && templateId) {
    try {
      const res = await fetch(SOLAPI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: makeAuthHeader(apiKey, apiSecret),
        },
        body: JSON.stringify({
          message: {
            ...baseMessage,
            kakaoOptions: { pfId, templateId, disableSms: false },
          },
        }),
      });
      if (!res.ok) {
        // Log and fall through to plain SMS.
        console.error("[SMS] Solapi Alimtalk error:", await res.text());
      } else {
        return;
      }
    } catch (e) {
      console.error("[SMS] Alimtalk request failed, falling back to SMS:", e);
    }
  }

  // Plain SMS path (original logic, also serves as Alimtalk fallback).
  try {
    const res = await fetch(SOLAPI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({ message: baseMessage }),
    });
    if (!res.ok) {
      console.error("[SMS] Solapi error:", await res.text());
    }
  } catch (e) {
    console.error("[SMS] Failed to send:", e);
  }
}
