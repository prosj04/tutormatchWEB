import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";

// Vercel 배포 URL — 로컬 개발 시 localhost로 변경
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://tutormatch-web.vercel.app";

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/mobile/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json() as { accessToken: string; refreshToken: string };
    await saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const t0 = Date.now();
  let token = await getAccessToken();
  const tokenMs = Date.now() - t0;

  const doFetch = async (t: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

  const fetchStart = Date.now();
  let res = await doFetch(token);

  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await doFetch(token);
    }
  }

  const fetchMs = Date.now() - fetchStart;
  const totalMs = Date.now() - t0;
  console.log(`[perf] ${path} | token:${tokenMs}ms fetch:${fetchMs}ms total:${totalMs}ms | status:${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      await clearTokens();
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * multipart/form-data 업로드 헬퍼 — RN FormData(파일 파트: {uri,name,type})를 그대로 전송.
 * apiFetch와 달리 Content-Type을 지정하지 않아 RN이 boundary를 자동으로 붙인다.
 * 401 시 refresh 후 1회 재시도(FormData는 재사용 가능).
 */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  let token = await getAccessToken();

  const doFetch = (t: string | null) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: form,
    });

  let res = await doFetch(token);

  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await doFetch(token);
    }
  }

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      await clearTokens();
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function apiLogin(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "로그인 실패");
  }
  return res.json() as Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; role: string; name: string };
  }>;
}
