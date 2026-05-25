"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { GenderSelect } from "@/components/ui/GenderSelect";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import type { ProfileGender } from "@/lib/profile-gender";

type TeacherRow = {
  id: string;
  name: string;
  subjects: string;
  phone: string;
  email: string;
  role: string;
  approved: boolean;
  bio: string;
  education: string;
  experience: string;
  photoUrl: string | null;
  gender: string | null;
  studentCount: number;
  createdAt: string;
};

function roleBadge(role: string) {
  if (role === "MANAGER") {
    return {
      label: "매니저",
      className: "bg-surface/10 text-text-primary",
    };
  }
  return {
    label: "선생님",
    className: "bg-gray-100 text-text-secondary",
  };
}

type Pagination = { page: number; limit: number; total: number; totalPages: number };

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

export function AdminTeachersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<TeacherRow | null>(null);
  const [editTab, setEditTab] = useState<"card" | "documents">("card");
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentDeleting, setDocumentDeleting] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentsResponse>({
    resumeFiles: [],
    documentFiles: [],
  });
  const [form, setForm] = useState({
    name: "",
    subjects: "",
    education: "",
    experience: "",
    bio: "",
    gender: "" as ProfileGender | "",
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/teachers?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { teachers: TeacherRow[]; pagination: Pagination };
      setRows(data.teachers);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, q, status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function toggleApprove(row: TeacherRow) {
    await fetch(`/api/admin/teachers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !row.approved }),
    });
    fetchList();
  }

  async function loadDocuments(teacherId: string) {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/documents`);
      if (!res.ok) return;
      setDocuments((await res.json()) as DocumentsResponse);
    } finally {
      setDocumentsLoading(false);
    }
  }

  function openEdit(row: TeacherRow) {
    setEditRow(row);
    setEditTab("card");
    setDocuments({ resumeFiles: [], documentFiles: [] });
    setForm({
      name: row.name,
      subjects: row.subjects,
      education: row.education,
      experience: row.experience,
      bio: row.bio,
      gender:
        row.gender === "FEMALE" ? "FEMALE" : row.gender === "MALE" ? "MALE" : "",
    });
    void loadDocuments(row.id);
  }

  async function saveEdit() {
    if (!editRow) return;
    const res = await fetch(`/api/admin/teachers/${editRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        gender: form.gender === "FEMALE" ? "FEMALE" : form.gender === "MALE" ? "MALE" : null,
      }),
    });
    if (res.ok) {
      setEditRow(null);
      fetchList();
    }
  }

  async function deleteRow(id: string, name: string) {
    if (!confirm(`${name} 선생님을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    if (res.ok) fetchList();
  }

  async function updateRole(id: string, role: "TEACHER" | "MANAGER") {
    const res = await fetch(`/api/admin/teachers/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) fetchList();
  }

  async function uploadPhoto(row: TeacherRow, file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingId(row.id);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/teachers/${row.id}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Photo upload failed");
      }

      router.refresh();
      await fetchList();
    } catch {
      alert("사진 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setUploadingId(null);
    }
  }

  async function deleteDocument(url: string, type: DocumentType) {
    if (!editRow || !confirm("이 서류 파일을 삭제하시겠습니까?")) return;

    setDocumentDeleting(url);
    try {
      const res = await fetch(`/api/admin/teachers/${editRow.id}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (!res.ok) throw new Error("Document delete failed");
      setDocuments((await res.json()) as DocumentsResponse);
    } catch {
      alert("서류 삭제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDocumentDeleting(null);
    }
  }

  function grantManager(row: TeacherRow) {
    const ok = confirm(
      "이 선생님에게 매니저 권한을 부여하시겠습니까?\n\n매니저는 상담 예약, 학생 매칭, 진도 모니터링 권한을 갖습니다.",
    );
    if (!ok) return;
    void updateRole(row.id, "MANAGER");
  }

  function revokeManager(row: TeacherRow) {
    const ok = confirm(`${row.name} 선생님의 매니저 권한을 해제하시겠습니까?`);
    if (!ok) return;
    void updateRole(row.id, "TEACHER");
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">선생님 관리</h2>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름/이메일 검색"
          className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm sm:w-auto sm:min-w-[220px]"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">전체</option>
          <option value="approved">승인됨</option>
          <option value="pending">대기중</option>
        </select>
        <button
          type="button"
          onClick={() => fetchList()}
          className="w-full rounded-xl bg-text-primary px-4 py-2 text-sm font-medium text-white sm:w-auto"
        >
          검색
        </button>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-text-muted shadow-sm">
            불러오는 중…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-text-muted shadow-sm">
            결과 없음
          </div>
        ) : (
          rows.map((row) => {
            const badge = roleBadge(row.role);
            return (
              <article key={row.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getEffectivePhotoUrl(row.photoUrl, row.gender)}
                      alt={`${row.name} 프로필`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{row.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.approved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {row.approved ? "승인됨" : "대기중"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{row.subjects || "담당 과목 없음"}</p>
                    <p className="mt-1 break-all text-xs text-text-muted">{row.email}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-background px-3 py-2">
                    <dt className="text-xs text-text-muted">전화번호</dt>
                    <dd className="mt-1 text-text-primary">{row.phone}</dd>
                  </div>
                  <div className="rounded-xl bg-background px-3 py-2">
                    <dt className="text-xs text-text-muted">담당 학생수</dt>
                    <dd className="mt-1 text-text-primary">{row.studentCount}</dd>
                  </div>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleApprove(row)}
                    className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-text-primary"
                  >
                    {row.approved ? "승인취소" : "승인"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-text-primary"
                  >
                    수정
                  </button>
                  {row.role === "TEACHER" ? (
                    <button
                      type="button"
                      onClick={() => grantManager(row)}
                      className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-text-primary"
                    >
                      매니저 부여
                    </button>
                  ) : row.role === "MANAGER" ? (
                    <button
                      type="button"
                      onClick={() => revokeManager(row)}
                      className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-text-primary"
                    >
                      매니저 해제
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => deleteRow(row.id, row.name)}
                    className="rounded-xl border border-pink-200 px-3 py-2 font-medium text-accent"
                  >
                    삭제
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
            <tr>
              <th className="w-20 max-w-20 px-2 py-3">이름</th>
              <th className="w-20 max-w-20 px-2 py-3">담당과목</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">전화번호</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">승인상태</th>
              <th className="px-4 py-3">담당학생수</th>
              <th className="px-4 py-3">가입일</th>
              <th className="w-24 max-w-24 px-2 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = roleBadge(row.role);
                return (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="w-20 max-w-20 px-2 py-3 font-medium">
                    <div className="flex max-w-full flex-col items-start gap-1.5">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getEffectivePhotoUrl(row.photoUrl, row.gender)}
                          alt={`${row.name} 프로필`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="whitespace-normal break-words text-xs leading-snug">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="w-20 max-w-20 whitespace-normal break-words px-2 py-3 text-xs leading-snug">
                    {row.subjects}
                  </td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.approved
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {row.approved ? "승인됨" : "대기중"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.studentCount}</td>
                  <td className="px-4 py-3">
                    {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="w-24 max-w-24 px-2 py-3">
                    <div className="flex max-w-full flex-col gap-1 text-xs leading-snug">
                      <label
                        className={`inline-flex cursor-pointer items-center gap-0.5 text-text-secondary hover:text-primary ${
                          uploadingId === row.id ? "pointer-events-none opacity-50" : ""
                        }`}
                        title="프로필 사진 업로드"
                      >
                        <span aria-hidden="true">📷</span>
                        <span className="sr-only">사진 업로드</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            void uploadPhoto(row, e.target.files?.[0]);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleApprove(row)}
                        className="text-left text-primary hover:underline"
                      >
                        {row.approved ? "승인취소" : "승인"}
                      </button>
                      {row.role === "TEACHER" ? (
                        <button
                          type="button"
                          onClick={() => grantManager(row)}
                          className="text-left text-text-primary hover:underline"
                        >
                          매니저 부여
                        </button>
                      ) : row.role === "MANAGER" ? (
                        <button
                          type="button"
                          onClick={() => revokeManager(row)}
                          className="text-left text-text-secondary hover:underline"
                        >
                          매니저 해제
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="text-left text-primary hover:underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id, row.name)}
                        className="text-left text-accent hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm">
            {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold">선생님 수정</h3>

            <div className="mt-4 flex gap-2 border-b border-gray-100">
              {[
                { id: "card" as const, label: "강사 카드 내용" },
                { id: "documents" as const, label: "서류 확인" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditTab(tab.id)}
                  className={`border-b-2 px-3 py-2 text-sm font-semibold ${
                    editTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {editTab === "card" ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-gray-100 bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    카드 미리보기
                  </p>
                  <div className="mt-3 flex gap-4 rounded-2xl bg-white p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getEffectivePhotoUrl(editRow.photoUrl, form.gender || editRow.gender)}
                        alt={`${form.name} 프로필`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-text-primary">
                        {form.name || "선생님 이름"} 선생님
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-primary">
                        {form.subjects || "담당 과목"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                        {form.bio || form.experience || "강사 카드 소개 문구"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-text-muted">
                    이 탭의 이름, 담당 과목, 자기소개, 학력, 경력은 사이트 콘텐츠「강사진」의 공개 카드·상세 페이지에 반영됩니다. 동일 필드는 강사진 CMS에서도 수정할 수 있습니다.
                    공개 강사진 사진은 성별에 따라 사이트 콘텐츠 → 강사진 탭의 기본 이미지를 씁니다. 내부용 프로필
                    사진은 목록의 카메라 버튼으로 업로드할 수 있습니다.
                  </p>
                </div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="이름"
                />
                <input
                  value={form.subjects}
                  onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="담당 과목"
                />
                <input
                  value={form.education}
                  onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="학력"
                />
                <input
                  value={form.experience}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="경력"
                />
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="자기소개"
                />
                <GenderSelect
                  value={form.gender}
                  onChange={(g) => setForm((f) => ({ ...f, gender: g }))}
                />
                <p className="text-xs text-text-muted">
                  업로드 사진이 없으면 CMS 강사진 탭의 남·여 기본 이미지가 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  {
                    type: "resume" as const,
                    title: "이력서",
                    files: documents.resumeFiles,
                    empty: "등록된 이력서가 없습니다.",
                  },
                  {
                    type: "document" as const,
                    title: "인증서류",
                    files: documents.documentFiles,
                    empty: "등록된 인증서류가 없습니다.",
                  },
                ].map((group) => (
                  <section
                    key={group.type}
                    className="rounded-xl border border-gray-100 bg-background p-4"
                  >
                    <h4 className="text-sm font-bold text-text-primary">{group.title}</h4>
                    <ul className="mt-3 space-y-2">
                      {documentsLoading ? (
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
                                disabled={documentDeleting === file.url}
                                onClick={() => void deleteDocument(file.url, group.type)}
                                className="font-semibold text-accent hover:underline disabled:opacity-50"
                              >
                                삭제
                              </button>
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </section>
                ))}
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="flex-1 rounded-xl border py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={editTab !== "card"}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
