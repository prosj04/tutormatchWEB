"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { GenderSelect } from "@/components/ui/GenderSelect";
import { normalizePhoneDigits } from "@/lib/phone-login";
import type { ProfileGender } from "@/lib/profile-gender";
import { uploadTeacherDocument } from "@/lib/supabase-client";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary";
const textareaClass = `${inputClass} resize-y leading-relaxed`;
const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-muted";

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

      const resumeUrls = await Promise.all(
        resumeFiles.map((item) => uploadTeacherDocument(registerData.teacherId!, item.file, "resume")),
      );
      const documentUrls = await Promise.all(
        documentFiles.map((item) =>
          uploadTeacherDocument(registerData.teacherId!, item.file, "document"),
        ),
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
      router.refresh();
      return;
    } catch {
      setError("가입 신청 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-24 text-center">
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
              <path
                d="M10 20l7 7 13-14"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-8 text-3xl font-black text-text-primary">
            신청이 완료되었습니다.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            선생님 등록 심사 위하여 곧 개별 연락드리겠습니다.
          </p>
          <Link
            href="/teacher-portal/dashboard"
            className="mt-8 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
          >
            선생님 포털로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Teacher Apply
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
            선생님 가입 신청
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:mt-6 sm:text-lg">
            3단계 신청서를 작성해 주세요. 서류는 선택사항이며 나중에 선생님 포털에서도 수정할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-20">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold ${
                step === item ? "bg-primary text-white" : "text-text-muted"
              }`}
            >
              {item}/3
            </div>
          ))}
        </div>

        <article className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
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

          {error ? <p className="mt-6 text-sm text-accent">{error}</p> : null}

          <div className="mt-8 flex gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="flex-1 rounded-2xl border border-gray-200 py-4 text-sm font-semibold text-text-primary"
              >
                이전
              </button>
            ) : null}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-2xl bg-primary py-4 text-sm font-semibold text-white"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="flex-1 rounded-2xl bg-primary py-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "처리 중…" : "가입 완료"}
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
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
    <div className="space-y-5">
      <Field label="이름" error={fieldErrors.name}>
        <input value={name} onChange={(e) => onName(e.target.value)} className={inputClass} />
      </Field>
      <GenderSelect value={gender} onChange={onGender} error={fieldErrors.gender} />
      <Field label="전화번호 (로그인 ID)" error={fieldErrors.phone}>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="비밀번호" error={fieldErrors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="비밀번호 확인" error={fieldErrors.passwordConfirm}>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => onPasswordConfirm(e.target.value)}
          className={inputClass}
        />
      </Field>
      <div>
        <span className={labelClass}>담당 과목</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => {
            const selected = subjects.includes(subject);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => onToggleSubject(subject)}
                className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-text-secondary"
                }`}
              >
                {subject}
              </button>
            );
          })}
        </div>
        {fieldErrors.subjects ? (
          <p className="mt-2 text-xs text-accent">{fieldErrors.subjects}</p>
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
    <div className="space-y-5">
      <Field label="최종 학력" error={fieldErrors.education}>
        <textarea
          rows={4}
          value={education}
          onChange={(e) => onEducation(e.target.value)}
          className={textareaClass}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between">
          <span className={labelClass}>주요 경력</span>
          <button
            type="button"
            onClick={() => onCareers([...careers, { org: "", period: "" }])}
            className="text-xs font-semibold text-primary"
          >
            항목 추가
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {careers.map((career, index) => (
            <div key={index} className="grid gap-2 rounded-xl bg-background p-3 md:grid-cols-2">
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
                className={inputClass}
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
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onCareers(careers.filter((_, i) => i !== index))}
                className="text-left text-xs font-semibold text-accent md:col-span-2"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        {fieldErrors.career ? (
          <p className="mt-2 text-xs text-accent">{fieldErrors.career}</p>
        ) : null}
      </div>

      <Field label="자기소개" error={fieldErrors.bio}>
        <textarea
          rows={5}
          value={bio}
          onChange={(e) => onBio(e.target.value)}
          className={textareaClass}
        />
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
    <div className="space-y-6">
      <p className="rounded-2xl bg-primary/10 p-4 text-sm leading-relaxed text-text-secondary">
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
    <section className="rounded-2xl border border-gray-100 bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-text-secondary">
          파일 선택
          <input
            type="file"
            accept="application/pdf,image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              onAdd(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <ul className="mt-3 space-y-2">
        {files.length === 0 ? (
          <li className="text-sm text-text-muted">선택된 파일이 없습니다.</li>
        ) : (
          files.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-text-secondary">{item.file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 text-xs font-semibold text-accent"
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
    <div>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? <p className="mt-2 text-xs text-accent">{error}</p> : null}
    </div>
  );
}
