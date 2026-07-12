"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { useConsultationCta } from "@/hooks/useConsultationCta";

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
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--acc-text)" }} role="status">
          관리자 계정이 생성되었습니다.
        </p>
        <button type="button" onClick={onSuccess} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
          이 안내 닫기
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div className="field">
        <label htmlFor="admin-email">관리자 이메일</label>
        <input id="admin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="admin-password">비밀번호</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password-confirm">비밀번호 확인</label>
        <input
          id="admin-password-confirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-secret">설정 비밀키</label>
        <input id="admin-secret" type="text" autoComplete="off" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
      </div>
      <button type="button" disabled={loading} onClick={() => void handleCreate()} className="btn btn-ghost btn-block">
        {loading ? "생성 중…" : "생성하기"}
      </button>
      {error ? (
        <p className="field-error" style={{ marginTop: 12, textAlign: "center", fontSize: 14 }} role="alert">
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
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--acc-text)" }} role="status">
          비밀번호가 변경되었습니다.
        </p>
        <button type="button" onClick={onSuccess} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
          이 안내 닫기
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div className="field">
        <label htmlFor="admin-recover-email">관리자 이메일</label>
        <input
          id="admin-recover-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-recover-password">새 비밀번호</label>
        <input
          id="admin-recover-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-recover-password-confirm">새 비밀번호 확인</label>
        <input
          id="admin-recover-password-confirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-recover-secret">설정 비밀키</label>
        <input
          id="admin-recover-secret"
          type="password"
          autoComplete="off"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
      </div>
      <button type="button" disabled={loading} onClick={() => void handleRecover()} className="btn btn-ghost btn-block">
        {loading ? "처리 중…" : "비밀번호 재설정"}
      </button>
      {error ? (
        <p className="field-error" style={{ marginTop: 12, textAlign: "center", fontSize: 14 }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AdminToolsSection({ onDismiss }: { onDismiss: () => void }) {
  const [tab, setTab] = useState<"recover" | "create">("recover");

  return (
    <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
      <div className="seg-tabs">
        <button type="button" className={tab === "recover" ? "on" : undefined} onClick={() => setTab("recover")}>
          비밀번호 재설정
        </button>
        <button type="button" className={tab === "create" ? "on" : undefined} onClick={() => setTab("create")}>
          최초 생성
        </button>
      </div>
      {tab === "recover" ? <AdminRecoverSection onSuccess={onDismiss} /> : <AdminSetupSection onSuccess={onDismiss} />}
    </div>
  );
}

const LOGIN_LOCKED_MESSAGE =
  "여러 번 실패해 잠시 잠겼어요. 약 15분 후 다시 시도해 주세요";

export function LoginForm({
  isEditMode = false,
  defaultTitle = "다시 오신 것을 환영해요",
  defaultSubtext = "학습 플래너와 상담 내역을 확인하세요.",
  contactPhone = "010-0000-0000",
}: {
  siteContent?: Record<string, Record<string, string>>;
  isEditMode?: boolean;
  defaultTitle?: string;
  defaultSubtext?: string;
  contactPhone?: string;
}) {
  const searchParams = useSearchParams();
  const goConsultation = useConsultationCta();
  const showAdminSetup = searchParams.get("setup") === "admin";
  // 상담 접수 후 자동 로그인 실패 경로에서 넘어온 안내 배너 (A2-8)
  const justRegistered = searchParams.get("registered") === "1";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminSetupHidden, setAdminSetupHidden] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  async function handleSubmit() {
    setError("");
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("이메일 또는 전화번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      // signIn 이전에 잠금 여부를 확인해 "비밀번호 오류"와 "잠김"을 구분한다 (A2-3).
      try {
        const statusRes = await fetch("/api/auth/login-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: trimmed }),
          cache: "no-store",
        });
        if (statusRes.ok) {
          const { locked } = (await statusRes.json()) as { locked?: boolean };
          if (locked) {
            setError(LOGIN_LOCKED_MESSAGE);
            return;
          }
        }
      } catch {
        // 사전 체크 실패는 무시하고 정상 로그인 흐름으로 진행한다.
      }

      let result: Awaited<ReturnType<typeof signIn>>;
      try {
        result = await signIn("credentials", {
          identifier: trimmed,
          password,
          redirect: false,
        });
      } catch {
        setError("로그인 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (result?.error) {
        // 실패 후 잠금 임계에 도달했으면 잠금 안내로 전환한다 (A2-3).
        try {
          const statusRes = await fetch("/api/auth/login-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: trimmed }),
            cache: "no-store",
          });
          if (statusRes.ok) {
            const { locked } = (await statusRes.json()) as { locked?: boolean };
            if (locked) {
              setError(LOGIN_LOCKED_MESSAGE);
              return;
            }
          }
        } catch {
          // 무시
        }
        setError("이메일·전화번호 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (!result?.ok) {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const sessionRes = await fetch(`${window.location.origin}/api/auth/session`, {
        credentials: "include",
        cache: "no-store",
      });
      let userRole: string | undefined;
      if (sessionRes.ok) {
        const data = (await sessionRes.json()) as { user?: { role?: string } };
        userRole = data?.user?.role;
      }
      const destination =
        userRole === "ADMIN"
          ? "/admin"
          : userRole === "TEACHER" || userRole === "MANAGER" || userRole === "CHIEF_MANAGER"
            ? "/teacher-portal/dashboard"
            : userRole === "PARENT"
              ? "/parent"
              : "/dashboard";
      window.location.assign(destination);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="auth-wrap">
        <div className="auth-bg" />
        {/* 로그인 카드는 JS 리빌에 의존하지 않음 — 스크립트 로드 실패 시에도 보여야 하는 핵심 UI */}
        <div className="auth-card">
          <div className="brand">
            Concord<span>.</span>
          </div>
          <h1>
            <CmsEdit active={isEditMode} section="login_page" cmsKey="title" type="text">
              {defaultTitle}
            </CmsEdit>
          </h1>
          <p className="sub">
            <CmsEdit active={isEditMode} section="login_page" cmsKey="subtext" type="text">
              {defaultSubtext}
            </CmsEdit>
          </p>

          {justRegistered ? (
            <p
              role="status"
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--acc-weak, rgba(0,0,0,0.04))",
                color: "var(--acc-text)",
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              상담이 접수되었어요. 방금 만든 계정으로 로그인해 주세요.
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="id">전화번호 또는 이메일</label>
            <input
              id="id"
              type="text"
              placeholder="010-0000-0000"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
            />
          </div>
          <div className="field">
            <label htmlFor="pw">비밀번호</label>
            <input
              id="pw"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
            />
          </div>

          <button
            type="button"
            disabled={loading}
            className="btn btn-acc btn-block btn-lg"
            onClick={() => void handleSubmit()}
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>

          {error ? (
            <p className="field-error" style={{ marginTop: 12, textAlign: "center", fontSize: 14 }} role="alert">
              {error}
            </p>
          ) : null}

          {/* 비밀번호 찾기 — 로그인 전 셀프 리셋 불가, 담당 매니저 재설정 안내 (A2-1/A2-4) */}
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 13 }}
              aria-expanded={showRecover}
              onClick={() => setShowRecover((v) => !v)}
            >
              비밀번호를 잊으셨나요?
            </button>
            {showRecover ? (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--mut, #666)",
                }}
              >
                로그인 전에는 직접 재설정할 수 없어요.
                <br />
                담당 매니저에게 재설정을 요청할 수 있어요.
                <br />
                상담 전화 <a href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`}>{contactPhone}</a>
              </p>
            ) : null}
          </div>

          <div className="auth-alt">
            아직 회원이 아니신가요?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goConsultation();
              }}
            >
              무료 상담으로 시작하기
            </a>
          </div>

          {showAdminSetup && !adminSetupHidden ? (
            <AdminToolsSection onDismiss={() => setAdminSetupHidden(true)} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
