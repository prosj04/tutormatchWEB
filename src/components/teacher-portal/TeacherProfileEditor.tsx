"use client";

import { useEffect, useRef, useState } from "react";

import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { uploadTeacherPhoto } from "@/lib/supabase-client";
import {
  emptyCareer,
  emptyCertificate,
  emptyEducation,
  type CareerEntry,
  type CertificateEntry,
  type EducationEntry,
  type TeacherProfileFormData,
} from "@/lib/teacher-profile-types";

import { TeacherProfilePreview } from "./TeacherProfilePreview";

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-muted";
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

type DocumentType = "resume" | "document";

type UploadedDocumentFile = {
  url: string;
  signedUrl: string;
  name: string;
};

type DocumentsResponse = {
  resumeFiles: UploadedDocumentFile[];
  documentFiles: UploadedDocumentFile[];
};

type TeacherProfileEditorProps = {
  teacherId: string;
  teacherName: string;
  subjects: string[];
  gender: string | null;
  initialForm: TeacherProfileFormData;
};

export function TeacherProfileEditor({
  teacherId,
  teacherName,
  subjects,
  gender,
  initialForm,
}: TeacherProfileEditorProps) {
  const [form, setForm] = useState<TeacherProfileFormData>(initialForm);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState<DocumentType | null>(null);
  const [resumeFiles, setResumeFiles] = useState<UploadedDocumentFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<UploadedDocumentFile[]>([]);
  const [toast, setToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(initialForm);
    setPendingPhoto(null);
  }, [initialForm]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      console.time("[perf] client.teacherProfile.documentsFetch");
      setDocumentLoading(true);
      try {
        const res = await fetch("/api/teacher/profile/documents");
        if (!res.ok) return;
        const data = (await res.json()) as DocumentsResponse;
        if (cancelled) return;
        setResumeFiles(data.resumeFiles);
        setDocumentFiles(data.documentFiles);
      } finally {
        if (!cancelled) setDocumentLoading(false);
        console.timeEnd("[perf] client.teacherProfile.documentsFetch");
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    setForm((f) => ({
      ...f,
      education: f.education.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }

  function updateCareer(index: number, patch: Partial<CareerEntry>) {
    setForm((f) => ({
      ...f,
      career: f.career.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }

  function updateCertificate(index: number, patch: Partial<CertificateEntry>) {
    setForm((f) => ({
      ...f,
      certificates: f.certificates.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }

  function handlePhotoSelect(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setPendingPhoto(file);
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, photoUrl: url }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let photoUrl = form.photoUrl;
      if (pendingPhoto) {
        photoUrl = await uploadTeacherPhoto(teacherId, pendingPhoto);
      } else if (photoUrl?.startsWith("blob:")) {
        photoUrl = initialForm.photoUrl;
      }

      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          intro: form.intro,
          education: form.education,
          career: form.career,
          certificates: form.certificates,
        }),
      });

      if (!res.ok) throw new Error("저장에 실패했습니다.");

      const data = (await res.json()) as {
        profile: TeacherProfileFormData;
      };

      setForm({
        photoUrl: data.profile.photoUrl,
        intro: data.profile.intro ?? "",
        education: data.profile.education ?? [],
        career: data.profile.career ?? [],
        certificates: data.profile.certificates ?? [],
        resumeUrls: data.profile.resumeUrls ?? [],
        documentUrls: data.profile.documentUrls ?? [],
      });
      setPendingPhoto(null);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch {
      alert("프로필 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  function handleDocumentsResponse(data: DocumentsResponse) {
    setResumeFiles(data.resumeFiles);
    setDocumentFiles(data.documentFiles);
    setForm((f) => ({
      ...f,
      resumeUrls: data.resumeFiles.map((file) => file.url),
      documentUrls: data.documentFiles.map((file) => file.url),
    }));
  }

  async function uploadDocument(file: File | undefined, type: DocumentType) {
    if (!file) return;
    if (file.size > MAX_DOCUMENT_SIZE) {
      alert("10MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setDocumentUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/teacher/profile/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Document upload failed");
      handleDocumentsResponse((await res.json()) as DocumentsResponse);
    } catch {
      alert("서류 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDocumentUploading(null);
    }
  }

  async function deleteDocument(url: string, type: DocumentType) {
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;

    setDocumentUploading(type);
    try {
      const res = await fetch("/api/teacher/profile/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (!res.ok) throw new Error("Document delete failed");
      handleDocumentsResponse((await res.json()) as DocumentsResponse);
    } catch {
      alert("서류 삭제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDocumentUploading(null);
    }
  }

  const displayPhoto =
    form.photoUrl?.startsWith("blob:") ?
      form.photoUrl
    : getEffectivePhotoUrl(form.photoUrl, gender);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="lg:sticky lg:top-[7.5rem] lg:self-start">
          <TeacherProfilePreview
            teacherId={teacherId}
            name={teacherName}
            subjects={subjects}
            gender={gender}
            form={form}
          />
        </div>

        <div className="space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <section>
            <h2 className="text-sm font-bold text-text-primary">프로필 사진</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayPhoto}
                  alt="프로필"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-text-secondary hover:border-primary hover:text-primary"
                >
                  사진 변경
                </button>
              </div>
            </div>
          </section>

          <section>
            <label className={labelClass}>자기소개</label>
            <textarea
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
              rows={5}
              className={`${inputClass} mt-2 resize-none`}
              placeholder="학생과 학부모에게 보여질 소개를 작성해 주세요."
            />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">학력</h2>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    education: [...f.education, emptyEducation()],
                  }))
                }
                className="text-xs font-semibold text-primary hover:underline"
              >
                항목 추가
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {form.education.length === 0 ? (
                <li className="text-sm text-text-muted">학력 항목이 없습니다.</li>
              ) : (
                form.education.map((entry, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-gray-100 bg-background p-4 space-y-2"
                  >
                    <input
                      value={entry.school}
                      onChange={(e) => updateEducation(i, { school: e.target.value })}
                      placeholder="학교명"
                      className={inputClass}
                    />
                    <input
                      value={entry.major}
                      onChange={(e) => updateEducation(i, { major: e.target.value })}
                      placeholder="전공"
                      className={inputClass}
                    />
                    <input
                      value={entry.year}
                      onChange={(e) => updateEducation(i, { year: e.target.value })}
                      placeholder="졸업년도"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          education: f.education.filter((_, j) => j !== i),
                        }))
                      }
                      className="text-xs text-accent hover:underline"
                    >
                      삭제
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">경력</h2>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, career: [...f.career, emptyCareer()] }))
                }
                className="text-xs font-semibold text-primary hover:underline"
              >
                항목 추가
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {form.career.length === 0 ? (
                <li className="text-sm text-text-muted">경력 항목이 없습니다.</li>
              ) : (
                form.career.map((entry, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-gray-100 bg-background p-4 space-y-2"
                  >
                    <input
                      value={entry.org}
                      onChange={(e) => updateCareer(i, { org: e.target.value })}
                      placeholder="기관명"
                      className={inputClass}
                    />
                    <input
                      value={entry.role}
                      onChange={(e) => updateCareer(i, { role: e.target.value })}
                      placeholder="역할"
                      className={inputClass}
                    />
                    <input
                      value={entry.period}
                      onChange={(e) => updateCareer(i, { period: e.target.value })}
                      placeholder="기간 (예: 2020-2023)"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          career: f.career.filter((_, j) => j !== i),
                        }))
                      }
                      className="text-xs text-accent hover:underline"
                    >
                      삭제
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">자격증</h2>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    certificates: [...f.certificates, emptyCertificate()],
                  }))
                }
                className="text-xs font-semibold text-primary hover:underline"
              >
                항목 추가
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {form.certificates.length === 0 ? (
                <li className="text-sm text-text-muted">자격증 항목이 없습니다.</li>
              ) : (
                form.certificates.map((entry, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-gray-100 bg-background p-4 space-y-2"
                  >
                    <input
                      value={entry.name}
                      onChange={(e) => updateCertificate(i, { name: e.target.value })}
                      placeholder="자격증명"
                      className={inputClass}
                    />
                    <input
                      value={entry.year}
                      onChange={(e) => updateCertificate(i, { year: e.target.value })}
                      placeholder="취득년도"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          certificates: f.certificates.filter((_, j) => j !== i),
                        }))
                      }
                      className="text-xs text-accent hover:underline"
                    >
                      삭제
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <div>
              <h2 className="text-sm font-bold text-text-primary">서류 업로드</h2>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                PDF 또는 이미지 파일을 업로드할 수 있습니다. 파일당 최대 10MB까지 허용됩니다.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                {
                  type: "resume" as const,
                  title: "이력서",
                  files: resumeFiles,
                  empty: "업로드된 이력서가 없습니다.",
                },
                {
                  type: "document" as const,
                  title: "인증서류",
                  files: documentFiles,
                  empty: "업로드된 인증서류가 없습니다.",
                },
              ].map((group) => (
                <div
                  key={group.type}
                  className="rounded-xl border border-gray-100 bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-text-primary">{group.title}</h3>
                    <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary hover:text-primary">
                      {documentUploading === group.type ? "업로드 중…" : "파일 추가"}
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        disabled={documentUploading !== null}
                        onChange={(e) => {
                          void uploadDocument(e.target.files?.[0], group.type);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {documentLoading ? (
                      <li className="text-xs text-text-muted">서류를 불러오는 중…</li>
                    ) : group.files.length === 0 ? (
                      <li className="text-xs text-text-muted">{group.empty}</li>
                    ) : (
                      group.files.map((file) => (
                        <li
                          key={file.url}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs"
                        >
                          <span className="min-w-0 truncate text-text-secondary">
                            {file.name}
                          </span>
                          <span className="flex shrink-0 gap-2">
                            <a
                              href={file.signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-primary hover:underline"
                            >
                              열기
                            </a>
                            <button
                              type="button"
                              onClick={() => void deleteDocument(file.url, group.type)}
                              className="font-semibold text-accent hover:underline"
                            >
                              삭제
                            </button>
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-text-primary px-6 py-3 text-sm font-medium text-white shadow-lg"
        >
          프로필이 저장되었습니다
        </div>
      )}
    </>
  );
}
