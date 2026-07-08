"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { RegionPicker } from "@/components/common/RegionPicker";

import { GenderSelect } from "@/components/ui/GenderSelect";
import { STUDENT_GRADES, STUDENT_SUBJECTS as SUBJECTS } from "@/lib/consultation-grades";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";


type FieldKey =
  | "name"
  | "phone"
  | "guardianPhone"
  | "password"
  | "passwordConfirm"
  | "terms"
  | "guardianConsent";

type ConsultationSignupFormProps = {
  onSuccess?: () => void;
  showLoginLink?: boolean;
  /** 즉시 등록: 대표 매니저 배정 후 방문 시간 입력 */
  instantEnroll?: boolean;
  /** signup_modal CMS 문구 (없으면 기본값) */
  copy?: Record<string, string>;
};

export function ConsultationSignupForm({
  onSuccess,
  showLoginLink = true,
  instantEnroll = false,
  copy = {},
}: ConsultationSignupFormProps) {
  const c = (key: string, fallback: string) => copy[key] ?? fallback;
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [region, setRegion] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [conflictError, setConflictError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function fieldError(key: FieldKey): string | undefined {
    switch (key) {
      case "name":
        return name.trim() ? undefined : "이름을 입력해 주세요.";
      case "phone": {
        if (!phone.trim()) return "전화번호를 입력해 주세요.";
        const d = normalizePhoneDigits(phone);
        return d.length < 10 || d.length > 11 ? "올바른 휴대전화 번호를 입력해 주세요." : undefined;
      }
      case "password":
        if (!password) return "비밀번호를 입력해 주세요.";
        return password.length < 8 ? "비밀번호는 8자 이상이어야 합니다." : undefined;
      case "passwordConfirm":
        if (!passwordConfirm) return "비밀번호 확인을 입력해 주세요.";
        return password !== passwordConfirm ? "비밀번호가 일치하지 않습니다." : undefined;
      case "terms":
        return termsAgreed ? undefined : "이용약관과 개인정보처리방침에 동의해 주세요.";
      case "guardianConsent":
        return guardianConsent ? undefined : "보호자 동의가 필요합니다.";
      default:
        return undefined;
    }
  }

  /** 필드를 벗어날 때(blur) 해당 필드만 검사해 즉시 표시 */
  function validateOnBlur(key: FieldKey) {
    setFieldErrors((prev) => ({ ...prev, [key]: fieldError(key) }));
  }

  function clearError(key: FieldKey) {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validate(): boolean {
    const keys: FieldKey[] = ["name", "phone", "password", "passwordConfirm", "terms", "guardianConsent"];
    const next: Partial<Record<FieldKey, string>> = {};
    keys.forEach((k) => {
      const err = fieldError(k);
      if (err) next[k] = err;
    });
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    const visitQuery = instantEnroll ? "?visit=1" : "";
    onSuccess?.();
    router.push(`/dashboard/consultation${visitQuery}`);
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
          phone: phone.trim(),
          instantEnroll,
          guardianConsent: true,
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
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtraSave() {
    setLoading(true);
    try {
      await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: grade || undefined,
          gender: gender || undefined,
          region: region || undefined,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          guardianPhone: guardianPhone.trim() || undefined,
        }),
      });
    } catch {
      // 선택 정보라 저장 실패해도 흐름을 막지 않는다
    } finally {
      setLoading(false);
      goNext();
    }
  }

  if (step === 2) {
    return (
      <div className="signup-form">
        <div className="signup-form-head mb-6" style={{ paddingRight: 36 }}>
          <p className="eyebrow">Consultation</p>
          <h2 id="consultation-signup-title" className="mt-2 text-2xl font-black" style={{ color: "var(--fg)" }}>
            {c("step2_title", "상담 신청 완료")}
          </h2>
          <p className="sub" style={{ marginTop: 8, textAlign: "left" }}>
            {c("step2_subtext", "추가 정보를 남겨 주시면 매니저가 더 정확하게 준비해서 연락드려요. (선택사항)")}
          </p>
        </div>
        <div className="space-y-5">
          <div className="field">
            <label htmlFor="reg-guardian-phone">{c("label_guardian_phone", "학부모 연락처")}</label>
            <input
              id="reg-guardian-phone"
              type="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-4">
            <GenderSelect value={gender} onChange={setGender} size="sm" className="shrink-0" />
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="reg-grade">{c("step2_label_grade", "학년")}</label>
              <select id="reg-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">{c("step2_ph_grade", "학년 선택")}</option>
                {STUDENT_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <span>{c("step2_label_region", "거주 지역")}</span>
            <div style={{ marginTop: 8 }}>
              <RegionPicker value={region} onChange={setRegion} labels={copy} />
            </div>
          </div>
          <div className="field">
            <span>{c("step2_label_subjects", "희망 과목")}</span>
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
          </div>
        </div>
        <div className="signup-form-actions">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleExtraSave()}
            className="btn btn-acc btn-block"
          >
            {loading ? c("btn_submitting", "저장 중…") : c("step2_btn_save", "저장하고 계속")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={goNext}
            className="btn btn-ghost btn-block"
            style={{ marginTop: 10 }}
          >
            {c("step2_btn_skip", "건너뛰기")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-form">
      <div className="signup-form-head mb-5" style={{ paddingRight: 36 }}>
        <p className="eyebrow">Consultation</p>
        <h2 id="consultation-signup-title" className="mt-2 text-2xl font-black" style={{ color: "var(--fg)" }}>
          {c("title", "상담 신청")}
        </h2>
        <p className="sub" style={{ marginTop: 8, textAlign: "left" }}>
          {instantEnroll
            ? c("subtext_instant", "등록 후 담당 매니저가 배정되며, 방문 상담 가능 시간을 바로 입력할 수 있습니다.")
            : c("subtext", "이름과 연락처만 남기면 매니저가 연락드립니다.")}
        </p>
      </div>
      <div className="space-y-4">
        <div className="field">
          <label htmlFor="reg-name">{c("label_name", "이름")}</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            onBlur={() => validateOnBlur("name")}
          />
          {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="reg-phone">{c("label_phone", "학생 전화번호 (ID)")}</label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            onBlur={() => validateOnBlur("phone")}
          />
          {fieldErrors.phone ? <p className="field-error">{fieldErrors.phone}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="reg-password">{c("label_password", "비밀번호")}</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            onBlur={() => validateOnBlur("password")}
          />
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="reg-password2">{c("label_password_confirm", "비밀번호 확인")}</label>
          <input
            id="reg-password2"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              clearError("passwordConfirm");
            }}
            onBlur={() => validateOnBlur("passwordConfirm")}
          />
          {fieldErrors.passwordConfirm ? (
            <p className="field-error">{fieldErrors.passwordConfirm}</p>
          ) : null}
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-background/60 p-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={(e) => {
              setTermsAgreed(e.target.checked);
              if (e.target.checked) clearError("terms");
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
          />
          <span>
            상담 신청을 위해{" "}
            <Link href="/terms" target="_blank" rel="noopener" className="font-semibold text-primary underline">
              이용약관
            </Link>
            과{" "}
            <Link href="/privacy" target="_blank" rel="noopener" className="font-semibold text-primary underline">
              개인정보처리방침
            </Link>
            에 동의합니다.
            {fieldErrors.terms ? <span className="field-error block">{fieldErrors.terms}</span> : null}
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-background/60 p-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={guardianConsent}
            onChange={(e) => {
              setGuardianConsent(e.target.checked);
              if (e.target.checked) clearError("guardianConsent");
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
          />
          <span>
            {c("guardian_consent_text", "만 14세 미만 학생은 법정대리인(보호자)의 동의가 필요합니다. 보호자로서 가입 및 개인정보 수집·이용에 동의합니다.")}
            {fieldErrors.guardianConsent ? (
              <span className="field-error block">{fieldErrors.guardianConsent}</span>
            ) : null}
          </span>
        </label>
      </div>
      <div className="signup-form-actions">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="btn btn-acc btn-block"
        >
          {loading ? (
            <>
              <span
                className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
              <span>{c("btn_submitting", "처리 중…")}</span>
            </>
          ) : (
            instantEnroll ? c("btn_submit_instant", "등록하고 시작하기") : c("btn_submit", "상담 신청")
          )}
        </button>
        {conflictError ? (
          <p className="field-error mt-4 text-center text-sm" role="alert">
            {conflictError}
          </p>
        ) : null}
        {showLoginLink ? (
          <p className="auth-alt">
            {c("login_hint", "이미 계정이 있으신가요?")}{" "}
            <Link href="/login">{c("login_link", "로그인")}</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
