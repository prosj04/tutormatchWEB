"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getEffectivePhotoUrl } from "@/lib/profile-gender";
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
  teacherName: string;
  subjects: string[];
  gender: string | null;
  initialForm: TeacherProfileFormData;
};

export function TeacherProfileEditor({
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
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [toast, setToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(initialForm);
    setPendingPhoto(null);
  }, [initialForm]);

  const loadDocuments = useCallback(async () => {
    console.time("[perf] client.teacherProfile.documentsFetch");
    setDocumentLoading(true);
    try {
      const res = await fetch("/api/teacher/profile/documents");
      if (!res.ok) return;
      const data = (await res.json()) as DocumentsResponse;
      setResumeFiles(data.resumeFiles);
      setDocumentFiles(data.documentFiles);
      setDocumentsLoaded(true);
    } finally {
      setDocumentLoading(false);
      console.timeEnd("[perf] client.teacherProfile.documentsFetch");
    }
  }, []);

  useEffect(() => {
    if (!documentsOpen || documentsLoaded) return;
    void loadDocuments();
  }, [documentsLoaded, documentsOpen, loadDocuments]);

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
        const fd = new FormData();
        fd.append("file", pendingPhoto);
        const photoRes = await fetch("/api/teacher/profile/photo", { method: "POST", body: fd });
        if (!photoRes.ok) throw new Error("사진 업로드에 실패했습니다.");
        const photoData = (await photoRes.json()) as { photoUrl: string };
        photoUrl = photoData.photoUrl;
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
    setDocumentsLoaded(true);
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
      <div className="sf-split-form">
        <div className="sf-stack">
          <div className="sf-block">
            <div className="sf-block-h">프로필 사진</div>
            <div className="sf-photo-pick">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayPhoto} alt="프로필" />
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn sec sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  사진 변경
                </button>
              </div>
            </div>
          </div>

          <div className="sf-block">
            <div className="sf-block-h">자기소개</div>
            <div className="field" style={{ marginTop: 0 }}>
              <textarea
                className="inp area"
                aria-label="자기소개"
                value={form.intro}
                onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
                rows={5}
                placeholder="학생과 학부모에게 보여질 소개를 작성해 주세요."
              />
            </div>
          </div>

          <div className="sf-block">
            <div className="sf-block-h">
              학력
              <button
                type="button"
                className="sf-link-btn"
                style={{ marginLeft: "auto" }}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    education: [...f.education, emptyEducation()],
                  }))
                }
              >
                항목 추가
              </button>
            </div>
            {form.education.length === 0 ? (
              <p className="sf-empty-line">학력 항목이 없습니다.</p>
            ) : (
              form.education.map((entry, i) => (
                <div className="sf-entry" key={i}>
                  <input
                    className="inp"
                    value={entry.school}
                    onChange={(e) => updateEducation(i, { school: e.target.value })}
                    placeholder="학교명"
                  />
                  <input
                    className="inp"
                    value={entry.major}
                    onChange={(e) => updateEducation(i, { major: e.target.value })}
                    placeholder="전공"
                  />
                  <input
                    className="inp"
                    value={entry.year}
                    onChange={(e) => updateEducation(i, { year: e.target.value })}
                    placeholder="졸업년도"
                  />
                  <div className="sf-entry-f">
                    <button
                      type="button"
                      className="sf-link-btn sf-del"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          education: f.education.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sf-block">
            <div className="sf-block-h">
              경력
              <button
                type="button"
                className="sf-link-btn"
                style={{ marginLeft: "auto" }}
                onClick={() => setForm((f) => ({ ...f, career: [...f.career, emptyCareer()] }))}
              >
                항목 추가
              </button>
            </div>
            {form.career.length === 0 ? (
              <p className="sf-empty-line">경력 항목이 없습니다.</p>
            ) : (
              form.career.map((entry, i) => (
                <div className="sf-entry" key={i}>
                  <input
                    className="inp"
                    value={entry.org}
                    onChange={(e) => updateCareer(i, { org: e.target.value })}
                    placeholder="기관명"
                  />
                  <input
                    className="inp"
                    value={entry.role}
                    onChange={(e) => updateCareer(i, { role: e.target.value })}
                    placeholder="역할"
                  />
                  <input
                    className="inp"
                    value={entry.period}
                    onChange={(e) => updateCareer(i, { period: e.target.value })}
                    placeholder="기간 (예: 2020-2023)"
                  />
                  <div className="sf-entry-f">
                    <button
                      type="button"
                      className="sf-link-btn sf-del"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          career: f.career.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sf-block">
            <div className="sf-block-h">
              자격증
              <button
                type="button"
                className="sf-link-btn"
                style={{ marginLeft: "auto" }}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    certificates: [...f.certificates, emptyCertificate()],
                  }))
                }
              >
                항목 추가
              </button>
            </div>
            {form.certificates.length === 0 ? (
              <p className="sf-empty-line">자격증 항목이 없습니다.</p>
            ) : (
              form.certificates.map((entry, i) => (
                <div className="sf-entry" key={i}>
                  <input
                    className="inp"
                    value={entry.name}
                    onChange={(e) => updateCertificate(i, { name: e.target.value })}
                    placeholder="자격증명"
                  />
                  <input
                    className="inp"
                    value={entry.year}
                    onChange={(e) => updateCertificate(i, { year: e.target.value })}
                    placeholder="취득년도"
                  />
                  <div className="sf-entry-f">
                    <button
                      type="button"
                      className="sf-link-btn sf-del"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          certificates: f.certificates.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sf-block">
            <div className="sf-block-h">
              서류 업로드
              <button
                type="button"
                className="sf-link-btn"
                style={{ marginLeft: "auto" }}
                onClick={() => setDocumentsOpen((prev) => !prev)}
              >
                {documentsOpen ? "접기" : "불러오기"}
              </button>
            </div>
            <p className="sf-sub" style={{ marginTop: 0 }}>
              PDF 또는 이미지 파일을 업로드할 수 있습니다. 파일당 최대 10MB까지 허용됩니다.
            </p>

            {documentsOpen ? (
              <div className="sf-docs">
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
                  <div key={group.type}>
                    <div className="sf-doc-h">
                      <b>{group.title}</b>
                      <label className="sf-file-btn">
                        {documentUploading === group.type ? "업로드 중…" : "파일 추가"}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="sr-only"
                          disabled={documentUploading !== null}
                          onChange={(e) => {
                            void uploadDocument(e.target.files?.[0], group.type);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    {documentLoading ? (
                      <p className="sf-empty-line">서류를 불러오는 중…</p>
                    ) : group.files.length === 0 ? (
                      <p className="sf-empty-line">{group.empty}</p>
                    ) : (
                      <ul className="sf-doc-list">
                        {group.files.map((file) => (
                          <li key={file.url}>
                            <span className="sf-doc-name">{file.name}</span>
                            <span className="sf-doc-acts">
                              <a
                                className="sf-link-btn"
                                href={file.signedUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                열기
                              </a>
                              <button
                                type="button"
                                className="sf-link-btn sf-del"
                                onClick={() => void deleteDocument(file.url, group.type)}
                              >
                                삭제
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="sf-empty-line">
                필요할 때만 서류 목록과 다운로드 링크를 불러옵니다.
              </p>
            )}
          </div>

          <div className="sf-actions">
            <button
              type="button"
              className="btn pri btn-block"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </div>

        <TeacherProfilePreview
          name={teacherName}
          subjects={subjects}
          gender={gender}
          form={form}
        />
      </div>

      <div className={toast ? "toast on" : "toast"} role="status">
        프로필이 저장되었습니다
      </div>
    </>
  );
}
