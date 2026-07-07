/**
 * 카카오톡 채널 연동 헬퍼 (https://developers.kakao.com/docs/ko/kakaotalk-channel/js)
 *
 * NEXT_PUBLIC_KAKAO_JS_KEY가 설정돼 있으면 JS SDK(Kakao.Channel.chat / addChannel)를 사용하고,
 * 없거나 SDK 로드에 실패하면 pf.kakao.com 채널 URL을 새 창으로 열어 동일 UX를 보장한다.
 */

export const KAKAO_CHANNEL_PUBLIC_ID = "_xlxcjwX";
export const KAKAO_CHANNEL_URL = `https://pf.kakao.com/${KAKAO_CHANNEL_PUBLIC_ID}`;
export const KAKAO_CHANNEL_CHAT_URL = `${KAKAO_CHANNEL_URL}/chat`;

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

type KakaoChannelParams = { channelPublicId: string };
type KakaoSdk = {
  init: (jsKey: string) => void;
  isInitialized: () => boolean;
  Channel: {
    chat: (params: KakaoChannelParams) => void;
    addChannel: (params: KakaoChannelParams) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let sdkPromise: Promise<KakaoSdk | null> | null = null;

/** SDK를 1회만 로드·init. JS 키가 없으면 null을 resolve해 URL 폴백을 태운다. */
function loadKakaoSdk(): Promise<KakaoSdk | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) return Promise.resolve(null);

  if (window.Kakao?.isInitialized?.()) return Promise.resolve(window.Kakao);

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = KAKAO_SDK_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        try {
          if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(jsKey);
          resolve(window.Kakao ?? null);
        } catch {
          resolve(null);
        }
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/** 카카오톡 1:1 상담 채팅 열기 (SDK 우선, 실패 시 채널 채팅 URL) */
export async function openKakaoChannelChat() {
  const kakao = await loadKakaoSdk();
  if (kakao) {
    kakao.Channel.chat({ channelPublicId: KAKAO_CHANNEL_PUBLIC_ID });
    return;
  }
  window.open(KAKAO_CHANNEL_CHAT_URL, "_blank", "noopener,noreferrer");
}

/** 카카오톡 채널 추가 (SDK 우선, 실패 시 채널 홈 URL) */
export async function addKakaoChannel() {
  const kakao = await loadKakaoSdk();
  if (kakao) {
    kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_PUBLIC_ID });
    return;
  }
  window.open(KAKAO_CHANNEL_URL, "_blank", "noopener,noreferrer");
}
