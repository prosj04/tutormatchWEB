"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { normalizePhoneDigits } from "@/lib/phone-login";

const GRADES = [
  "초등 4학년",
  "초등 5학년",
  "초등 6학년",
  "중학교 1학년",
  "중학교 2학년",
  "중학교 3학년",
  "고등학교 1학년",
  "고등학교 2학년",
  "고등학교 3학년",
] as const;

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

type FieldKey =
  | "name"
  | "password"
  | "passwordConfirm"
  | "grade"
  | "subjects"
  | "phone";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [conflictError, setConflictError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) next.name = "이름을 입력해 주세요.";
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    else if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (!passwordConfirm) next.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
    else if (password !== passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!grade) next.grade = "학년을 선택해 주세요.";
    if (selectedSubjects.length === 0) next.subjects = "희망 과목을 한 개 이상 선택해 주세요.";
    if (!phone.trim()) next.phone = "전화번호를 입력해 주세요.";
    else {
      const d = normalizePhoneDigits(phone);
      if (d.length < 10 || d.length > 11) next.phone = "올바른 휴대전화 번호를 입력해 주세요.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setConflictError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          grade,
          subjects: selectedSubjects,
          phone: phone.trim(),
        }),
      });
      if (res.status === 409) {
        setFieldErrors({});
        setConflictError("이미 가입된 전화번호입니다");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setFieldErrors({
          phone: data?.error ?? "가입에 실패했습니다. 다시 시도해 주세요.",
        });
        return;
      }
      const loginId = normalizePhoneDigits(phone);
      const signResult = await signIn("credentials", {
        loginId,
        password,
        redirectTo: "/",
        redirect: false,
      });
      if (signResult?.error) {
        setConflictError("");
        setFieldErrors({
          phone: "가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 시도해 주세요.",
        });
        router.push("/login");
        return;
      }
      router.push(signResult?.url ?? "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_24px_60px_rgba(15,30,60,0.18)] sm:p-10">
        <p className="text-center text-xl font-bold italic text-navy">Concord.</p>
        <h1 className="mt-6 text-center font-display text-3xl font-semibold text-navy">
          학생 회원가입
        </h1>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-navy/80">
              이름
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy outline-none ring-gold/40 focus:border-gold focus:ring-2"
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-navy/80">
              비밀번호
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy outline-none ring-gold/40 focus:border-gold focus:ring-2"
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="reg-password2" className="mb-1.5 block text-sm font-medium text-navy/80">
              비밀번호 확인
            </label>
            <input
              id="reg-password2"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy outline-none ring-gold/40 focus:border-gold focus:ring-2"
            />
            {fieldErrors.passwordConfirm ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordConfirm}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="reg-grade" className="mb-1.5 block text-sm font-medium text-navy/80">
              학년
            </label>
            <select
              id="reg-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full appearance-none rounded-lg border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-gold/40 focus:border-gold focus:ring-2"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {fieldErrors.grade ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.grade}</p>
            ) : null}
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-navy/80">희망 과목</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => {
                const on = selectedSubjects.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                      on
                        ? "border-gold bg-gold text-navy"
                        : "border-navy/40 bg-white text-navy hover:border-navy/70"
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

          <div>
            <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-medium text-navy/80">
              전화번호
            </label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy outline-none ring-gold/40 placeholder:text-navy/35 focus:border-gold focus:ring-2"
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            ) : null}
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
              <span>처리 중…</span>
            </>
          ) : (
            "회원가입"
          )}
        </button>

        {conflictError ? (
          <p className="mt-3 text-center text-sm text-red-600" role="alert">
            {conflictError}
          </p>
        ) : null}

        <p className="mt-8 text-center text-sm text-navy/60">
          이미 계정이 있으신가요? →{" "}
          <Link href="/login" className="font-semibold text-gold underline-offset-2 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
