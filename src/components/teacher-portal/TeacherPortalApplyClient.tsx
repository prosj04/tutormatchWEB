"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary";
const textareaClass = inputClass + " resize-y leading-relaxed";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-muted";

function SuccessCheckLarge() {
  return (
    <div
      className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10"
      aria-hidden
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 20l7 7 13-14"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TeacherPortalApplyClient() {
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
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-24">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Apply</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-primary sm:text-6xl">선생님 가입 신청</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            제출 후 관리자 검토를 거쳐 안내드립니다.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-lg px-8 py-16 md:py-24">
        <article className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!registerSuccess ? (
            <div className="p-8 md:p-10">
              <div className="space-y-5">
                <Field label="이름" htmlFor="apply-name" error={fieldErrors.name}>
                  <input
                    id="apply-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="이메일" htmlFor="apply-email" error={fieldErrors.email}>
                  <input
                    id="apply-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="비밀번호" htmlFor="apply-pw" error={fieldErrors.password}>
                  <input
                    id="apply-pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="비밀번호 확인" htmlFor="apply-pw2" error={fieldErrors.passwordConfirm}>
                  <input
                    id="apply-pw2"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="전화번호" htmlFor="apply-phone" error={fieldErrors.phone}>
                  <input
                    id="apply-phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <div>
                  <span className={labelClass}>담당 과목</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => {
                      const on = subjects.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                            on
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 bg-white text-text-secondary hover:border-gray-300"
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
                <Field label="최종 학력" htmlFor="apply-edu" error={fieldErrors.education}>
                  <textarea
                    id="apply-edu"
                    rows={3}
                    placeholder="예) 서울대학교 수학교육과 졸업"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className={textareaClass}
                  />
                </Field>
                <Field label="주요 경력" htmlFor="apply-exp" error={fieldErrors.experience}>
                  <textarea
                    id="apply-exp"
                    rows={3}
                    placeholder="예) 대치동 OO학원 수학 강사 3년"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className={textareaClass}
                  />
                </Field>
                <Field label="자기소개" htmlFor="apply-bio" error={fieldErrors.bio}>
                  <textarea
                    id="apply-bio"
                    rows={3}
                    placeholder="학생들에게 어떤 선생님인지 소개해주세요"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={textareaClass}
                  />
                </Field>
                <button
                  type="button"
                  disabled={registerLoading}
                  onClick={() => void handleRegister()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registerLoading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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

              <p className="mt-8 text-center text-sm text-text-secondary">
                이미 계정이 있으신가요?{" "}
                <Link href="/teacher-portal" className="font-semibold text-primary underline-offset-4 hover:underline">
                  로그인
                </Link>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16">
              <SuccessCheckLarge />
              <h2 className="mt-8 text-2xl font-black text-text-primary sm:text-3xl">
                신청이 완료되었습니다
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
                관리자 검토 후 1-2 영업일 내에 안내드립니다.
              </p>
              <Link
                href="/"
                className="mt-10 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-text-primary transition hover:border-gray-300 hover:bg-gray-50"
              >
                ← 메인으로 돌아가기
              </Link>
            </div>
          )}
        </article>
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
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
