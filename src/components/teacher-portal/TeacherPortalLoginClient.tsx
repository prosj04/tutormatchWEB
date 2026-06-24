"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";

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
    <main>
      <ConcordPageHead
        eyebrow="Teachers"
        title="선생님 로그인"
        description="전화번호와 비밀번호로 로그인해 주세요."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <article className="card panel-card" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="field">
              <label htmlFor="tp-login-id">이메일 또는 전화번호</label>
              <input
                id="tp-login-id"
                type="text"
                autoComplete="username"
                placeholder="이메일 또는 010-0000-0000"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
              />
            </div>
            <div className="field">
              <label htmlFor="tp-login-password">비밀번호</label>
              <input
                id="tp-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleLogin()}
              className="btn btn-acc btn-block"
              style={{ marginTop: 8 }}
            >
              {loading ? "처리 중…" : "로그인"}
            </button>
            {error ? (
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--acc-text)", textAlign: "center" }} role="alert">
                {error}
              </p>
            ) : null}

            <p className="auth-alt">
              아직 계정이 없으신가요?{" "}
              <Link href="/teacher-portal/apply">가입 신청</Link>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
