"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";

import { TeacherPortalEntryTopBar } from "./TeacherPortalEntryTopBar";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

type Tab = "login" | "signup";

function GoldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="9" cy="9" r="9" fill="#C9A84C" fillOpacity="0.2" />
      <path
        d="M5 9l2.5 2.5L13 6"
        stroke="#C9A84C"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessCheckLarge() {
  return (
    <div
      className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-gold/40 bg-gold/10"
      aria-hidden
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 20l7 7 13-14"
          stroke="#C9A84C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TeacherPortalHomeClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerConflict, setRegisterConflict] = useState("");

  function toggleSubject(s: string) {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirectTo: "/teacher-portal/dashboard",
        redirect: false,
      });
      if (result?.error) {
        setLoginError("이메일 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      if (result?.ok) {
        const nextSession = await getSession();
        if (nextSession?.user?.role !== "TEACHER") {
          await signOut({ redirect: false });
          setLoginError("선생님 계정으로만 로그인할 수 있습니다.");
          return;
        }
        router.push(result.url ?? "/teacher-portal/dashboard");
        router.refresh();
      }
    } finally {
      setLoginLoading(false);
    }
  }

  function validateRegister(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "이름을 입력해 주세요.";
    if (!email.trim()) next.email = "이메일을 입력해 주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "올바른 이메일 형식이 아닙니다.";
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    else if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (!passwordConfirm) next.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
    else if (password !== passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!phone.trim()) next.phone = "전화번호를 입력해 주세요.";
    if (subjects.length === 0) next.subjects = "담당 과목을 한 개 이상 선택해 주세요.";
    if (!education.trim()) next.education = "최종 학력을 입력해 주세요.";
    if (!experience.trim()) next.experience = "주요 경력을 입력해 주세요.";
    if (!bio.trim()) next.bio = "자기소개를 입력해 주세요.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    setRegisterConflict("");
    if (!validateRegister()) return;
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/register/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          subjects,
          education: education.trim(),
          experience: experience.trim(),
          bio: bio.trim(),
        }),
      });
      if (res.status === 409) {
        setFieldErrors({});
        setRegisterConflict("이미 등록된 이메일입니다");
        return;
      }
      if (!res.ok) {
        setFieldErrors({ email: "가입 신청에 실패했습니다. 다시 시도해 주세요." });
        return;
      }
      setRegisterSuccess(true);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-navy">
      <TeacherPortalEntryTopBar />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-[4.5rem] sm:px-6 sm:pt-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-14">
          <aside className="lg:w-[42%] lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                선생님 포털
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-navy/65">
                검증된 강사 네트워크에 함께하세요
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "체계적인 학습 관리 시스템",
                  "안정적인 수업료 정산",
                  "전담 매니저 배정",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-snug text-navy/85">
                    <GoldCheckIcon className="mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <figure className="mt-10 border-l-4 border-gold bg-white p-5 shadow-sm">
                <blockquote className="text-sm leading-relaxed text-navy/80">
                  &ldquo;입사 후 수업에만 집중할 수 있는 환경이 마련되어 있습니다.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs font-medium text-navy/55">
                  — 김O현 선생님, 수학 담당
                </figcaption>
              </figure>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="border border-navy/10 bg-white shadow-sm">
              {!registerSuccess ? (
                <>
                  <div className="flex border-b border-navy/10">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("login");
                        setLoginError("");
                      }}
                      className={`flex-1 py-3.5 text-sm font-semibold transition ${
                        tab === "login"
                          ? "border-b-2 border-gold bg-navy/[0.02] text-navy"
                          : "text-navy/45 hover:bg-navy/[0.02] hover:text-navy/70"
                      }`}
                    >
                      로그인
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("signup");
                        setRegisterConflict("");
                      }}
                      className={`flex-1 py-3.5 text-sm font-semibold transition ${
                        tab === "signup"
                          ? "border-b-2 border-gold bg-navy/[0.02] text-navy"
                          : "text-navy/45 hover:bg-navy/[0.02] hover:text-navy/70"
                      }`}
                    >
                      회원가입
                    </button>
                  </div>

                  <div className="p-6 sm:p-8">
                    {tab === "login" ? (
                      <div className="space-y-5">
                        <div>
                          <label htmlFor="tp-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/55">
                            이메일
                          </label>
                          <input
                            id="tp-email"
                            type="email"
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none ring-gold/30 focus:border-gold focus:ring-1"
                          />
                        </div>
                        <div>
                          <label htmlFor="tp-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/55">
                            비밀번호
                          </label>
                          <input
                            id="tp-password"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none ring-gold/30 focus:border-gold focus:ring-1"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={loginLoading}
                          onClick={() => void handleLogin()}
                          className="flex w-full items-center justify-center gap-2 border border-gold/30 bg-gold py-3 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-70"
                        >
                          {loginLoading ? (
                            <>
                              <span className="size-4 animate-spin rounded-full border-2 border-navy/25 border-t-navy" />
                              처리 중…
                            </>
                          ) : (
                            "로그인"
                          )}
                        </button>
                        {loginError ? (
                          <p className="text-center text-sm text-red-600" role="alert">
                            {loginError}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <Field label="이름" htmlFor="tp-name" error={fieldErrors.name}>
                          <input
                            id="tp-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="이메일" htmlFor="tp-reg-email" error={fieldErrors.email}>
                          <input
                            id="tp-reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="비밀번호" htmlFor="tp-reg-pw" error={fieldErrors.password}>
                          <input
                            id="tp-reg-pw"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="비밀번호 확인" htmlFor="tp-reg-pw2" error={fieldErrors.passwordConfirm}>
                          <input
                            id="tp-reg-pw2"
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="전화번호" htmlFor="tp-phone" error={fieldErrors.phone}>
                          <input
                            id="tp-phone"
                            type="tel"
                            placeholder="010-0000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm outline-none placeholder:text-navy/35 focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <div>
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-navy/55">
                            담당 과목
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map((s) => {
                              const on = subjects.includes(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => toggleSubject(s)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                    on
                                      ? "border-gold bg-gold text-navy"
                                      : "border-navy/25 bg-white text-navy/80 hover:border-navy/45"
                                  }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                          {fieldErrors.subjects ? (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.subjects}</p>
                          ) : null}
                        </div>
                        <Field label="최종 학력" htmlFor="tp-edu" error={fieldErrors.education}>
                          <textarea
                            id="tp-edu"
                            rows={3}
                            placeholder="예) 서울대학교 수학교육과 졸업"
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                            className="w-full resize-y border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-navy/35 focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="주요 경력" htmlFor="tp-exp" error={fieldErrors.experience}>
                          <textarea
                            id="tp-exp"
                            rows={3}
                            placeholder="예) 대치동 OO학원 수학 강사 3년"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full resize-y border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-navy/35 focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <Field label="자기소개" htmlFor="tp-bio" error={fieldErrors.bio}>
                          <textarea
                            id="tp-bio"
                            rows={3}
                            placeholder="학생들에게 어떤 선생님인지 소개해주세요"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full resize-y border border-navy/15 bg-[#FAFAF8] px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-navy/35 focus:border-gold focus:ring-1 focus:ring-gold/30"
                          />
                        </Field>
                        <button
                          type="button"
                          disabled={registerLoading}
                          onClick={() => void handleRegister()}
                          className="flex w-full items-center justify-center gap-2 border border-gold/30 bg-gold py-3 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-70"
                        >
                          {registerLoading ? (
                            <>
                              <span className="size-4 animate-spin rounded-full border-2 border-navy/25 border-t-navy" />
                              처리 중…
                            </>
                          ) : (
                            "가입 신청하기"
                          )}
                        </button>
                        {registerConflict ? (
                          <p className="text-center text-sm text-red-600" role="alert">
                            {registerConflict}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16">
                  <SuccessCheckLarge />
                  <h3 className="mt-8 font-display text-2xl font-semibold text-navy sm:text-3xl">
                    신청이 완료되었습니다
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy/65">
                    관리자 검토 후 1-2 영업일 내에 안내드립니다.
                  </p>
                  <Link
                    href="/"
                    className="mt-10 inline-flex items-center justify-center border border-navy/15 bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/30 hover:bg-navy/[0.03]"
                  >
                    ← 메인으로 돌아가기
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/55">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
