"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";

import { useConsultationSignup } from "@/components/providers/ConsultationSignupProvider";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-muted";

function AdminSetupSection({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCreate() {
    setError("");
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, secretKey }),
      });
      if (res.status === 201) {
        setSuccess(true);
        return;
      }
      if (res.status === 403) {
        setError("이미 관리자 계정이 존재합니다");
        return;
      }
      if (res.status === 401) {
        setError("비밀키가 올바르지 않습니다");
        return;
      }
      setError("계정 생성에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-green-700" role="status">
          관리자 계정이 생성되었습니다.
        </p>
        <button
          type="button"
          onClick={onSuccess}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          이 안내 닫기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="admin-email" className={labelClass}>
            관리자 이메일
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="admin-password" className={labelClass}>
            비밀번호
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="admin-password-confirm" className={labelClass}>
            비밀번호 확인
          </label>
          <input
            id="admin-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="admin-secret" className={labelClass}>
            설정 비밀키
          </label>
          <input
            id="admin-secret"
            type="text"
            autoComplete="off"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleCreate()}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-text-secondary transition hover:border-gray-300 hover:text-text-primary disabled:opacity-50"
        >
          {loading ? "생성 중…" : "생성하기"}
        </button>
        {error ? (
          <p className="text-center text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
    </div>
  );
}

function AdminRecoverSection({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRecover() {
    setError("");
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password, secretKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setSuccess(true);
        return;
      }
      setError(data.error ?? "재설정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-green-700" role="status">
          비밀번호가 변경되었습니다.
        </p>
        <button
          type="button"
          onClick={onSuccess}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          이 안내 닫기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="admin-recover-email" className={labelClass}>
          관리자 이메일
        </label>
        <input
          id="admin-recover-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="admin-recover-password" className={labelClass}>
          새 비밀번호
        </label>
        <input
          id="admin-recover-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="admin-recover-password-confirm" className={labelClass}>
          새 비밀번호 확인
        </label>
        <input
          id="admin-recover-password-confirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="admin-recover-secret" className={labelClass}>
          설정 비밀키
        </label>
        <input
          id="admin-recover-secret"
          type="password"
          autoComplete="off"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleRecover()}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-text-secondary transition hover:border-gray-300 hover:text-text-primary disabled:opacity-50"
      >
        {loading ? "처리 중…" : "비밀번호 재설정"}
      </button>
      {error ? (
        <p className="text-center text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const adminTabBtnBase =
  "flex-1 rounded-lg py-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function AdminToolsSection({ onDismiss }: { onDismiss: () => void }) {
  const [tab, setTab] = useState<"recover" | "create">("recover");

  return (
    <section className="mt-8 border-t border-gray-100 pt-8">
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          className={`${adminTabBtnBase} ${
            tab === "recover" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setTab("recover")}
        >
          비밀번호 재설정
        </button>
        <button
          type="button"
          className={`${adminTabBtnBase} ${
            tab === "create" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setTab("create")}
        >
          최초 생성
        </button>
      </div>
      {tab === "recover" ? <AdminRecoverSection onSuccess={onDismiss} /> : <AdminSetupSection onSuccess={onDismiss} />}
    </section>
  );
}

export function LoginForm({ siteContent }: { siteContent?: GroupedSiteContent }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open: openConsultationSignup } = useConsultationSignup();
  const showAdminSetup = searchParams.get("setup") === "admin";
  const get = (key: string, fb: string) => getCmsSectionValue(siteContent, "login_page", key, fb);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminSetupHidden, setAdminSetupHidden] = useState(false);

  async function handleSubmit() {
    setError("");
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("이메일 또는 전화번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: trimmed,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("이메일·전화번호 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (result?.ok) {
        const nextSession = await getSession();
        const role = nextSession?.user?.role;
        const destination =
          role === "ADMIN"
            ? "/admin"
            : role === "TEACHER" || role === "MANAGER"
              ? "/teacher-portal/dashboard"
              : "/dashboard";
        router.push(destination);
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
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {get("kicker", "Account")}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-primary sm:text-6xl">
            {get("title", "로그인")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            {get("subtext", "이메일 또는 전화번호와 비밀번호로 Concord 계정에 로그인하세요.")}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-md px-8 py-16 md:py-24">
        <article className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-5">
            <div>
              <label htmlFor="login-identifier" className={labelClass}>
                이메일 또는 전화번호
              </label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                placeholder="이메일 또는 010-0000-0000"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={labelClass}>
                비밀번호
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span
                  className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                <span>로그인 중…</span>
              </>
            ) : (
              "로그인"
            )}
          </button>
          {error ? (
            <p className="mt-4 text-center text-sm text-accent" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-8 text-center text-sm text-text-secondary">
            {get("signup_prompt", "아직 계정이 없으신가요? ")}{" "}
            <button
              type="button"
              onClick={openConsultationSignup}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {get("signup_cta", "상담 신청")}
            </button>
          </p>

          {showAdminSetup && !adminSetupHidden ? (
            <AdminToolsSection onDismiss={() => setAdminSetupHidden(true)} />
          ) : null}
        </article>
      </div>
    </div>
  );
}
