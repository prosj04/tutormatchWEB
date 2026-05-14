"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

import { TeacherPortalEntryTopBar } from "./TeacherPortalEntryTopBar";

export function TeacherPortalLoginClient() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        loginId,
        password,
        redirectTo: "/teacher-portal/dashboard",
        redirect: false,
      });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (result?.ok) {
        const nextSession = await getSession();
        if (nextSession?.user?.role !== "TEACHER") {
          await signOut({ redirect: false });
          setError("선생님 계정으로만 로그인할 수 있습니다.");
          return;
        }
        router.push(result.url ?? "/teacher-portal/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-navy">
      <TeacherPortalEntryTopBar />
      <div className="mx-auto max-w-md px-4 pb-16 pt-[5.5rem] sm:px-6 sm:pt-24">
        <div className="border border-navy/10 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-center font-display text-2xl font-semibold text-navy sm:text-3xl">
            선생님 로그인
          </h1>
          <p className="mt-2 text-center text-xs text-navy/55">
            승인된 선생님 계정으로 로그인해 주세요.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="tp-login-id"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/55"
              >
                이메일
              </label>
              <input
                id="tp-login-id"
                type="email"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none ring-gold/30 focus:border-gold focus:ring-1"
              />
            </div>
            <div>
              <label
                htmlFor="tp-login-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/55"
              >
                비밀번호
              </label>
              <input
                id="tp-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none ring-gold/30 focus:border-gold focus:ring-1"
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleLogin()}
              className="flex w-full items-center justify-center gap-2 border border-gold/30 bg-gold py-3 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-navy/25 border-t-navy" />
                  처리 중…
                </>
              ) : (
                "로그인"
              )}
            </button>
            {error ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <p className="mt-8 text-center text-xs text-navy/60">
            아직 계정이 없으신가요?{" "}
            <Link href="/teacher-portal/apply" className="font-semibold text-gold underline-offset-2 hover:underline">
              가입 신청
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
