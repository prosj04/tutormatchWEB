"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { GenderSelect } from "@/components/ui/GenderSelect";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type CareerEntry = {
  org: string;
  period: string;
};

type SelectedFile = {
  id: string;
  file: File;
};

type FieldErrors = Partial<
  Record<
    | "name"
    | "password"
    | "passwordConfirm"
    | "phone"
    | "gender"
    | "subjects"
    | "education"
    | "career"
    | "bio",
    string
  >
>;

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [subjects, setSubjects] = useState<string[]>([]);

  const [education, setEducation] = useState("");
  const [careers, setCareers] = useState<CareerEntry[]>([{ org: "", period: "" }]);
  const [bio, setBio] = useState("");

  const [resumeFiles, setResumeFiles] = useState<SelectedFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<SelectedFile[]>([]);

  function toggleSubject(subject: string) {
    setSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  }

  function validateStep(targetStep = step): boolean {
    const next: FieldErrors = {};

    if (targetStep === 1) {
      if (!name.trim()) next.name = "이름을 입력해 주세요.";
      if (!password) next.password = "비밀번호를 입력해 주세요.";
      else if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
      if (!passwordConfirm) next.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
      else if (password !== passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
      if (!phone.trim()) next.phone = "전화번호를 입력해 주세요.";
      else if (normalizePhoneDigits(phone).length < 10) {
        next.phone = "올바른 전화번호를 입력해 주세요.";
      }
      if (!gender) next.gender = "성별을 선택해 주세요.";
      if (subjects.length === 0) next.subjects = "담당 과목을 한 개 이상 선택해 주세요.";
    }

    if (targetStep === 2) {
      if (!education.trim()) next.education = "최종 학력을 입력해 주세요.";
      if (!careers.some((career) => career.org.trim() || career.period.trim())) {
        next.career = "주요 경력을 한 개 이상 입력해 주세요.";
      }
      if (!bio.trim()) next.bio = "자기소개를 입력해 주세요.";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    setStep((current) => Math.min(3, current + 1));
  }

  function addFiles(files: FileList | null, type: "resume" | "document") {
    if (!files) return;

    const nextFiles: SelectedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert("10MB 이하 파일만 업로드할 수 있습니다.");
        continue;
      }
      if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
        alert("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
        continue;
      }
      nextFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
      });
    }

    if (type === "resume") {
      setResumeFiles(nextFiles.slice(0, 1));
    } else {
      setDocumentFiles((current) => [...current, ...nextFiles]);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!validateStep(1) || !validateStep(2)) {
      setStep(!validateStep(1) ? 1 : 2);
      return;
    }

    setSubmitting(true);
    try {
      const careerEntries = careers
        .map((career) => ({
          org: career.org.trim(),
          role: "",
          period: career.period.trim(),
        }))
        .filter((career) => career.org || career.period);

      const registerRes = await fetch("/api/register/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          gender,
          phone: phone.trim(),
          subjects,
          education: education.trim(),
          experience: careerEntries
            .map((career) => [career.org, career.period].filter(Boolean).join(" · "))
            .join("\n"),
          careerEntries,
          bio: bio.trim(),
        }),
      });

      if (registerRes.status === 409) {
        setStep(1);
        setFieldErrors({ phone: "이미 등록된 전화번호입니다." });
        return;
      }

      if (!registerRes.ok) {
        setError("가입 신청에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      const registerData = (await registerRes.json()) as { teacherId?: string };
      if (!registerData.teacherId) {
        setError("선생님 프로필 생성에 실패했습니다.");
        return;
      }

      const uploadDocument = async (file: File, type: "resume" | "document"): Promise<string> => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);
        fd.append("teacherId", registerData.teacherId!);
        const res = await fetch("/api/register/teacher/documents", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Document upload failed");
        const data = (await res.json()) as { path: string };
        return data.path;
      }

      const resumeUrls = await Promise.all(
        resumeFiles.map((item) => uploadDocument(item.file, "resume")),
      );
      const documentUrls = await Promise.all(
        documentFiles.map((item) => uploadDocument(item.file, "document")),
      );

      if (resumeUrls.length > 0 || documentUrls.length > 0) {
        await fetch("/api/register/teacher", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId: registerData.teacherId,
            resumeUrls,
            documentUrls,
          }),
        });
      }

      const loginId = normalizePhoneDigits(phone);
      const signInResult = await signIn("credentials", {
        identifier: loginId,
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        setSuccess(true);
        return;
      }
      router.push("/teacher-portal/dashboard");
      return;
    } catch {
      setError("가입 신청 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main>
        <section className="sec">
          <div className="wrap">
            <article className="card panel-card" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
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
                  color: "var(--acc-text)",
                }}
                aria-hidden
              >
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M10 20l7 7 13-14"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="panel-title" style={{ marginTop: 24, fontSize: 28 }}>
                신청이 완료되었습니다.
              </h1>
              <p className="panel-note" style={{ marginTop: 12 }}>
                선생님 등록 심사 위하여 곧 개별 연락드리겠습니다.
              </p>
              <Link href="/teacher-portal/dashboard" className="btn btn-acc" style={{ marginTop: 28 }}>
                선생님 포털로 이동
              </Link>
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <ConcordPageHead
        eyebrow="Teacher Apply"
        title="선생님 가입 신청"
        description="3단계 신청서를 작성해 주세요. 서류는 선택사항이며 나중에 선생님 포털에서도 수정할 수 있습니다."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="seg-tabs" style={{ marginBottom: 24 }}>
            {[1, 2, 3].map((item) => (
              <button key={item} type="button" className={step === item ? "on" : undefined} disabled>
                {item}/3
              </button>
            ))}
          </div>

          <article className="card panel-card">
          {step === 1 ? (
            <StepOne
              name={name}
              password={password}
              passwordConfirm={passwordConfirm}
              phone={phone}
              gender={gender}
              subjects={subjects}
              fieldErrors={fieldErrors}
              onName={setName}
              onPassword={setPassword}
              onPasswordConfirm={setPasswordConfirm}
              onPhone={setPhone}
              onGender={setGender}
              onToggleSubject={toggleSubject}
            />
          ) : null}

          {step === 2 ? (
            <StepTwo
              education={education}
              careers={careers}
              bio={bio}
              fieldErrors={fieldErrors}
              onEducation={setEducation}
              onCareers={setCareers}
              onBio={setBio}
            />
          ) : null}

          {step === 3 ? (
            <StepThree
              resumeFiles={resumeFiles}
              documentFiles={documentFiles}
              onAddFiles={addFiles}
              onRemoveResume={(id) =>
                setResumeFiles((current) => current.filter((item) => item.id !== id))
              }
              onRemoveDocument={(id) =>
                setDocumentFiles((current) => current.filter((item) => item.id !== id))
              }
            />
          ) : null}

          {error ? (
            <p style={{ marginTop: 24, fontSize: 14, color: "var(--acc-text)" }} role="alert">
              {error}
            </p>
          ) : null}

          <div className="form-actions" style={{ marginTop: 32 }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="btn btn-ghost" style={{ flex: 1 }}>
                이전
              </button>
            ) : null}
            {step < 3 ? (
              <button type="button" onClick={goNext} className="btn btn-acc" style={{ flex: 1 }}>
                다음
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="btn btn-acc"
                style={{ flex: 1 }}
              >
                {submitting ? "처리 중…" : "가입 완료"}
              </button>
            )}
          </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function StepOne({
  name,
  password,
  passwordConfirm,
  phone,
  gender,
  subjects,
  fieldErrors,
  onName,
  onPassword,
  onPasswordConfirm,
  onPhone,
  onGender,
  onToggleSubject,
}: {
  name: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  gender: ProfileGender | "";
  subjects: string[];
  fieldErrors: FieldErrors;
  onName: (value: string) => void;
  onPassword: (value: string) => void;
  onPasswordConfirm: (value: string) => void;
  onPhone: (value: string) => void;
  onGender: (value: ProfileGender) => void;
  onToggleSubject: (value: string) => void;
}) {
  return (
    <div>
      <Field label="이름" error={fieldErrors.name}>
        <input value={name} onChange={(e) => onName(e.target.value)} />
      </Field>
      <GenderSelect value={gender} onChange={onGender} error={fieldErrors.gender} />
      <Field label="전화번호 (로그인 ID)" error={fieldErrors.phone}>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
        />
      </Field>
      <Field label="비밀번호" error={fieldErrors.password}>
        <input type="password" value={password} onChange={(e) => onPassword(e.target.value)} />
      </Field>
      <Field label="비밀번호 확인" error={fieldErrors.passwordConfirm}>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => onPasswordConfirm(e.target.value)}
        />
      </Field>
      <div className="field">
        <label>담당 과목</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {SUBJECTS.map((subject) => {
            const selected = subjects.includes(subject);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => onToggleSubject(subject)}
                className={`chip-f${selected ? " on" : ""}`}
              >
                {subject}
              </button>
            );
          })}
        </div>
        {fieldErrors.subjects ? (
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }}>{fieldErrors.subjects}</p>
        ) : null}
      </div>
    </div>
  );
}

function StepTwo({
  education,
  careers,
  bio,
  fieldErrors,
  onEducation,
  onCareers,
  onBio,
}: {
  education: string;
  careers: CareerEntry[];
  bio: string;
  fieldErrors: FieldErrors;
  onEducation: (value: string) => void;
  onCareers: (value: CareerEntry[]) => void;
  onBio: (value: string) => void;
}) {
  return (
    <div>
      <Field label="최종 학력" error={fieldErrors.education}>
        <textarea rows={4} value={education} onChange={(e) => onEducation(e.target.value)} />
      </Field>

      <div className="field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label>주요 경력</label>
          <button
            type="button"
            onClick={() => onCareers([...careers, { org: "", period: "" }])}
            style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-text)", background: "none", border: 0, cursor: "pointer" }}
          >
            항목 추가
          </button>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {careers.map((career, index) => (
            <div key={index} className="card panel-card" style={{ padding: 16 }}>
              <input
                value={career.org}
                onChange={(e) =>
                  onCareers(
                    careers.map((item, i) =>
                      i === index ? { ...item, org: e.target.value } : item,
                    ),
                  )
                }
                placeholder="기관명"
              />
              <input
                value={career.period}
                onChange={(e) =>
                  onCareers(
                    careers.map((item, i) =>
                      i === index ? { ...item, period: e.target.value } : item,
                    ),
                  )
                }
                placeholder="기간"
                style={{ marginTop: 8 }}
              />
              <button
                type="button"
                onClick={() => onCareers(careers.filter((_, i) => i !== index))}
                style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--acc-text)", background: "none", border: 0, cursor: "pointer" }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        {fieldErrors.career ? (
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }}>{fieldErrors.career}</p>
        ) : null}
      </div>

      <Field label="자기소개" error={fieldErrors.bio}>
        <textarea rows={5} value={bio} onChange={(e) => onBio(e.target.value)} />
      </Field>
    </div>
  );
}

function StepThree({
  resumeFiles,
  documentFiles,
  onAddFiles,
  onRemoveResume,
  onRemoveDocument,
}: {
  resumeFiles: SelectedFile[];
  documentFiles: SelectedFile[];
  onAddFiles: (files: FileList | null, type: "resume" | "document") => void;
  onRemoveResume: (id: string) => void;
  onRemoveDocument: (id: string) => void;
}) {
  return (
    <div>
      <p className="panel-note" style={{ padding: 16, borderRadius: "var(--r-card)", background: "rgba(var(--acc-rgb),.08)" }}>
        서류는 선택사항입니다. 서류는 나중에 선생님 포털에서도 수정할 수 있습니다.
      </p>
      <FilePicker
        title="이력서 파일"
        files={resumeFiles}
        multiple={false}
        onAdd={(files) => onAddFiles(files, "resume")}
        onRemove={onRemoveResume}
      />
      <FilePicker
        title="인증서류 파일"
        files={documentFiles}
        multiple
        onAdd={(files) => onAddFiles(files, "document")}
        onRemove={onRemoveDocument}
      />
    </div>
  );
}

function FilePicker({
  title,
  files,
  multiple,
  onAdd,
  onRemove,
}: {
  title: string;
  files: SelectedFile[];
  multiple?: boolean;
  onAdd: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="card panel-card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="panel-title" style={{ fontSize: 15 }}>{title}</h2>
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
          파일 선택
          <input
            type="file"
            accept="application/pdf,image/*"
            multiple={multiple}
            style={{ display: "none" }}
            onChange={(e) => {
              onAdd(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
        {files.length === 0 ? (
          <li className="panel-note">선택된 파일이 없습니다.</li>
        ) : (
          files.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--r-control)",
                background: "var(--panel-2)",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--mut)" }}>
                {item.file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--acc-text)", background: "none", border: 0, cursor: "pointer" }}
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }}>{error}</p>
      ) : null}
    </div>
  );
}
