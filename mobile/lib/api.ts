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
  let token = await getAccessToken();

  const doFetch = async (t: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(init?.headers ?? {}),
      },
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
  return res.json() as Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>;
}
