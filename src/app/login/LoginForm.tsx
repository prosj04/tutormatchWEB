"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") ?? "/";

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirectTo,
        redirect: false,
      });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (result?.ok) {
        router.push(result.url ?? redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_24px_60px_rgba(15,30,60,0.18)] sm:p-10">
        <p className="text-center text-xl font-bold italic text-navy">Concord.</p>
        <h1 className="mt-6 text-center font-display text-3xl font-semibold text-navy">
          로그인
        </h1>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-navy/80">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              className="w-full rounded-lg border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-gold/40 transition focus:border-gold focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-navy/80">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              className="w-full rounded-lg border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-gold/40 transition focus:border-gold focus:ring-2"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <span
                className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-navy/30 border-t-navy"
                aria-hidden
              />
              <span>로그인 중…</span>
            </>
          ) : (
            "로그인"
          )}
        </button>

        {error ? (
          <p className="mt-3 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-8 text-center text-sm text-navy/60">
          아직 계정이 없으신가요? →{" "}
          <Link href="/register" className="font-semibold text-gold underline-offset-2 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
