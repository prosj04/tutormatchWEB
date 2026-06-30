"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { GenderSelect } from "@/components/ui/GenderSelect";
import { STUDENT_GRADES } from "@/lib/consultation-grades";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

type FieldKey =
  | "name"
  | "phone"
  | "password"
  | "passwordConfirm"
  | "grade"
  | "subjects"
  | "gender";

type ConsultationSignupFormProps = {
  onSuccess?: () => void;
  showLoginLink?: boolean;
  /** 즉시 등록: 대표 매니저 배정 후 방문 시간 입력 */
  instantEnroll?: boolean;
};

export function ConsultationSignupForm({
  onSuccess,
  showLoginLink = true,
  instantEnroll = false,
}: ConsultationSignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [conflictError, setConflictError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) next.name = "이름을 입력해 주세요.";
    if (!phone.trim()) next.phone = "전화번호를 입력해 주세요.";
    else {
      const d = normalizePhoneDigits(phone);
      if (d.length < 10 || d.length > 11) next.phone = "올바른 휴대전화 번호를 입력해 주세요.";
    }
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    else if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (!passwordConfirm) next.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
    else if (password !== passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!grade) next.grade = "학년을 선택해 주세요.";
    if (!gender) next.gender = "성별을 선택해 주세요.";
    if (selectedSubjects.length === 0) next.subjects = "희망 과목을 한 개 이상 선택해 주세요.";
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
          gender,
          subjects: selectedSubjects,
          phone: phone.trim(),
          instantEnroll,
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
          phone: data?.error ?? "신청에 실패했습니다. 다시 시도해 주세요.",
        });
        return;
      }
      const signResult = await signIn("credentials", {
        identifier: normalizePhoneDigits(phone),
        password,
        redirect: false,
      });
      if (signResult?.error) {
        setConflictError("");
        setFieldErrors({
          phone: "신청은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 시도해 주세요.",
        });
        onSuccess?.();
        router.push("/login");
        return;
      }
      onSuccess?.();
      const visitQuery = instantEnroll ? "?visit=1" : "";
      router.push(`/dashboard/consultation${visitQuery}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6" style={{ paddingRight: 36 }}>
        <p className="eyebrow">Consultation</p>
        <h2 id="consultation-signup-title" className="mt-2 text-2xl font-black" style={{ color: "var(--fg)" }}>
          상담 신청
        </h2>
        <p className="sub" style={{ marginTop: 8, textAlign: "left" }}>
          {instantEnroll
            ? "등록 후 담당 매니저가 배정되며, 방문 상담 가능 시간을 바로 입력할 수 있습니다."
            : "학년과 희망 과목을 입력하시면 매니저가 연락드립니다."}
        </p>
      </div>
      <div className="space-y-5">
        <div className="field">
          <label htmlFor="reg-name">이름</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name ? (
            <p className="field-error">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="reg-phone">전화번호</label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldErrors.phone ? <p className="field-error">{fieldErrors.phone}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="reg-password">비밀번호</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="reg-password2">비밀번호 확인</label>
          <input
            id="reg-password2"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {fieldErrors.passwordConfirm ? (
            <p className="field-error">{fieldErrors.passwordConfirm}</p>
          ) : null}
        </div>
        <GenderSelect value={gender} onChange={setGender} error={fieldErrors.gender} />
        <div className="field">
          <label htmlFor="reg-grade">학년</label>
          <select id="reg-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {STUDENT_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {fieldErrors.grade ? <p className="field-error">{fieldErrors.grade}</p> : null}
        </div>
        <div className="field">
          <span>희망 과목</span>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUBJECTS.map((s) => {
              const on = selectedSubjects.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={on ? "chip-f on" : "chip-f"}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {fieldErrors.subjects ? <p className="field-error">{fieldErrors.subjects}</p> : null}
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSubmit()}
        className="btn btn-acc btn-block"
        style={{ marginTop: 28 }}
      >
        {loading ? (
          <>
            <span
              className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden
            />
            <span>처리 중…</span>
          </>
        ) : (
          instantEnroll ? "등록하고 시작하기" : "상담 신청"
        )}
      </button>
      {conflictError ? (
        <p className="field-error mt-4 text-center text-sm" role="alert">
          {conflictError}
        </p>
      ) : null}
      {showLoginLink ? (
        <p className="auth-alt">
          이미 계정이 있으신가요?{" "}
          <Link href="/login">로그인</Link>
        </p>
      ) : null}
    </div>
  );
}
