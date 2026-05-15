"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-dark outline-none transition focus:border-primary";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-light";

export function TeacherPortalLoginClient() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirectTo: "/teacher-portal/dashboard",
        redirect: false,
      });
      if (result?.error) {
        setError("이메일·전화번호 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (result?.ok) {
        const nextSession = await getSession();
        const role = nextSession?.user?.role;
        if (role !== "TEACHER" && role !== "MANAGER") {
          await signOut({ redirect: false });
          setError("선생님·매니저 계정으로만 로그인할 수 있습니다.");
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
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-24">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-light">Teachers</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-dark sm:text-6xl">
            선생님 로그인
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-mid">
            승인된 선생님 계정으로 로그인해 주세요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-8 py-16 md:py-24">
        <article className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-5">
            <div>
              <label htmlFor="tp-login-id" className={labelClass}>
                이메일 또는 전화번호
              </label>
              <input
                id="tp-login-id"
                type="text"
                autoComplete="username"
                placeholder="이메일 또는 010-0000-0000"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tp-login-password" className={labelClass}>
                비밀번호
              </label>
              <input
                id="tp-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleLogin()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  처리 중…
                </>
              ) : (
                "로그인"
              )}
            </button>
            {error ? (
              <p className="text-center text-sm text-accent" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <p className="mt-8 text-center text-sm text-text-mid">
            아직 계정이 없으신가요?{" "}
            <Link
              href="/teacher-portal/apply"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              가입 신청
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
