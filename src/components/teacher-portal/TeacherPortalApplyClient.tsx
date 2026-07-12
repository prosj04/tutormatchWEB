"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type ReactNode } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { GenderSelect } from "@/components/ui/GenderSelect";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;

function SuccessCheckLarge() {
  return (
    <div
      style={{
        margin: "0 auto",
        width: 80,
        height: 80,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        border: "2px solid rgba(var(--acc-rgb),.3)",
        background: "rgba(var(--acc-rgb),.1)",
      }}
      aria-hidden
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 20l7 7 13-14"
          stroke="currentColor"
          style={{ color: "var(--acc-text)" }}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TeacherPortalApplyClient() {
  const router = useRouter();
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<ProfileGender | "">("");
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
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    else if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (!passwordConfirm) next.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
    else if (password !== passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!phone.trim()) next.phone = "전화번호를 입력해 주세요.";
    else if (normalizePhoneDigits(phone).length < 10) next.phone = "올바른 전화번호를 입력해 주세요.";
    if (!gender) next.gender = "성별을 선택해 주세요.";
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
          password,
          gender,
          phone: phone.trim(),
          subjects,
          education: education.trim(),
          experience: experience.trim(),
          bio: bio.trim(),
        }),
      });
      if (res.status === 409) {
        setFieldErrors({});
        setRegisterConflict("이미 등록된 전화번호입니다");
        return;
      }
      if (!res.ok) {
        setFieldErrors({ phone: "가입 신청에 실패했습니다. 다시 시도해 주세요." });
        return;
      }
      const loginId = normalizePhoneDigits(phone);
      const signInResult = await signIn("credentials", {
        identifier: loginId,
        password,
        redirect: false,
      });
      if (!signInResult?.error) {
        router.push("/teacher-portal/dashboard");
        router.refresh();
        return;
      }
      setRegisterSuccess(true);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <main>
      <ConcordPageHead
        eyebrow="Apply"
        title="선생님 가입 신청"
        description="제출 후 관리자 검토를 거쳐 안내드립니다."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <article className="card panel-card" style={{ maxWidth: 560, margin: "0 auto" }}>
            {!registerSuccess ? (
              <>
                <Field label="이름" htmlFor="apply-name" error={fieldErrors.name}>
                  <input
                    id="apply-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="전화번호 (로그인 ID)" htmlFor="apply-phone" error={fieldErrors.phone}>
                  <input
                    id="apply-phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
                <GenderSelect value={gender} onChange={setGender} error={fieldErrors.gender} />
                <Field label="비밀번호" htmlFor="apply-pw" error={fieldErrors.password}>
                  <input
                    id="apply-pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field label="비밀번호 확인" htmlFor="apply-pw2" error={fieldErrors.passwordConfirm}>
                  <input
                    id="apply-pw2"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </Field>
                <div className="field">
                  <label>담당 과목</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {SUBJECTS.map((s) => {
                      const on = subjects.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`chip-f${on ? " on" : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.subjects ? (
                    <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }}>{fieldErrors.subjects}</p>
                  ) : null}
                </div>
                <Field label="최종 학력" htmlFor="apply-edu" error={fieldErrors.education}>
                  <textarea
                    id="apply-edu"
                    rows={3}
                    placeholder="예) 서울대학교 수학교육과 졸업"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  />
                </Field>
                <Field label="주요 경력" htmlFor="apply-exp" error={fieldErrors.experience}>
                  <textarea
                    id="apply-exp"
                    rows={3}
                    placeholder="예) 대치동 OO학원 수학 강사 3년"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </Field>
                <Field label="자기소개" htmlFor="apply-bio" error={fieldErrors.bio}>
                  <textarea
                    id="apply-bio"
                    rows={3}
                    placeholder="학생들에게 어떤 선생님인지 소개해주세요"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  disabled={registerLoading}
                  onClick={() => void handleRegister()}
                  className="btn btn-acc btn-block"
                  style={{ marginTop: 8 }}
                >
                  {registerLoading ? "처리 중…" : "가입 신청하기"}
                </button>
                {registerConflict ? (
                  <p style={{ marginTop: 16, fontSize: 14, color: "var(--acc-text)", textAlign: "center" }} role="alert">
                    {registerConflict}
                  </p>
                ) : null}

                <p className="auth-alt">
                  이미 계정이 있으신가요? <Link href="/teacher-portal">로그인</Link>
                </p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <SuccessCheckLarge />
                <h2 className="panel-title" style={{ marginTop: 24, fontSize: 24 }}>
                  신청이 완료되었습니다
                </h2>
                <p className="panel-note" style={{ marginTop: 12 }}>
                  선생님 등록 심사 위하여 곧 개별 연락드리겠습니다. 승인 후 로그인하시면 포털을 이용하실 수 있습니다.
                </p>
                <Link href="/teacher-portal" className="btn btn-acc" style={{ marginTop: 28 }}>
                  로그인하러 가기
                </Link>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
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
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }}>{error}</p>
      ) : null}
    </div>
  );
}
