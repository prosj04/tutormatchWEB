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
  const [debouncedQ, setDebouncedQ] = useState("");
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
    if (debouncedQ) params.set("q", debouncedQ);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/teachers?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { teachers: TeacherRow[]; pagination: Pagination };
      setRows(data.teachers);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, debouncedQ, status]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function toggleApprove(row: TeacherRow) {
    if (row.approved) {
      const ok = confirm(
        `${row.name} 선생님의 승인을 취소하시겠습니까?\n\n이 선생님이 매칭 후보에서 제외되고 진행 중 수업에 영향이 있을 수 있습니다.`,
      );
      if (!ok) return;
    }
    await fetch(`/api/admin/teachers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !row.approved }),
    });
    fetchList();
  }

  async function loadDocuments(teacherId: string) {
    console.time(`[perf] client.adminTeacher.documentsFetch:${teacherId}`);
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/documents`);
      if (!res.ok) return;
      setDocuments((await res.json()) as DocumentsResponse);
    } finally {
      setDocumentsLoading(false);
      console.timeEnd(`[perf] client.adminTeacher.documentsFetch:${teacherId}`);
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
    if (res.ok) {
      setEditRow(null);
      fetchList();
    }
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
    <section className="page on" data-screen-label="선생님 관리">
      <div className="crumb">/admin/teachers</div>
      <h1>선생님 관리</h1>
      <p className="sub">서류 확인과 승인 상태를 관리합니다.</p>

      <div className="sec filters">
        <input
          className="inp filled"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름·이메일 검색"
        />
        <select
          className="inp filled"
          style={{ width: "auto" }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">전체</option>
          <option value="approved">승인됨</option>
          <option value="pending">대기중</option>
        </select>
        <button type="button" className="btn sec sm" onClick={() => setDebouncedQ(q)}>검색</button>
      </div>

      <div className="sec card" style={{ overflowX: "auto", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>선생님</th>
              <th>과목</th>
              <th>역할</th>
              <th>담당 학생</th>
              <th>승인 상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6}>결과 없음</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.name}</b>
                    <span className="mini">{row.email}</span>
                  </td>
                  <td>{row.subjects || "—"}</td>
                  <td>
                    <span className={`bst ${row.role === "MANAGER" ? "acc" : "mut"}`}>
                      {row.role === "MANAGER" ? "매니저" : "선생님"}
                    </span>
                  </td>
                  <td className="num">{row.studentCount}</td>
                  <td>
                    <span className={`bst ${row.approved ? "acc" : "warn"}`}>
                      {row.approved ? "승인됨" : "대기"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <label
                        className={`btn ghost sm${uploadingId === row.id ? " pointer-events-none" : ""}`}
                        title="프로필 사진 업로드"
                        style={uploadingId === row.id ? { opacity: 0.5 } : undefined}
                      >
                        사진
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            void uploadPhoto(row, e.target.files?.[0]);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <button type="button" className="btn sec sm" onClick={() => toggleApprove(row)}>
                        {row.approved ? "승인취소" : "승인"}
                      </button>
                      <button type="button" className="btn ghost sm" onClick={() => openEdit(row)}>프로필</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="sec" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button type="button" className="btn ghost sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span className="sub" style={{ margin: 0 }}>{page} / {pagination.totalPages}</span>
          <button type="button" className="btn ghost sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      )}

      <div className={`drawer${editRow ? " on" : ""}`} aria-label="선생님 서류">
        {editRow ? (
          <>
            <div className="d-h">
              <h3>{editRow.name} · {editRow.subjects || "선생님"}</h3>
              <button type="button" className="x" onClick={() => setEditRow(null)}>✕</button>
            </div>
            <div className="d-b">
              <div className="opts" style={{ marginBottom: "14px" }}>
                {[
                  { id: "card" as const, label: "강사 카드 내용" },
                  { id: "documents" as const, label: "서류 확인" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className="opt"
                    aria-pressed={editTab === tab.id}
                    onClick={() => setEditTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {editTab === "card" ? (
                <>
                  <div className="card" style={{ padding: "16px", marginBottom: "14px" }}>
                    <div className="row" style={{ padding: 0 }}>
                      <span className="av" style={{ overflow: "hidden", background: "var(--panel-2)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getEffectivePhotoUrl(editRow.photoUrl, form.gender || editRow.gender)}
                          alt={`${form.name} 프로필`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </span>
                      <div className="g">
                        <b>{form.name || "선생님 이름"} 선생님</b>
                        <p>{form.subjects || "담당 과목"} · {form.bio || form.experience || "강사 카드 소개 문구"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label>이름</label>
                    <input className="inp filled" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="이름" />
                  </div>
                  <div className="field">
                    <label>담당 과목</label>
                    <input className="inp filled" value={form.subjects} onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))} placeholder="담당 과목" />
                  </div>
                  <div className="field">
                    <label>학력</label>
                    <input className="inp filled" value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} placeholder="학력" />
                  </div>
                  <div className="field">
                    <label>경력</label>
                    <input className="inp filled" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="경력" />
                  </div>
                  <div className="field">
                    <label>자기소개</label>
                    <textarea className="inp area filled" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="자기소개" />
                  </div>
                  <div className="field">
                    <label>성별</label>
                    <GenderSelect value={form.gender} onChange={(g) => setForm((f) => ({ ...f, gender: g }))} />
                  </div>
                  <p className="f-hint">업로드 사진이 없으면 CMS 강사진 탭의 남·여 기본 이미지가 표시됩니다.</p>
                </>
              ) : (
                <>
                  <p className="f-hint" style={{ marginBottom: "10px" }}>
                    열람 링크는 10분 후 만료됩니다. 만료되면 이 서류 탭을 다시 열어 재발급하세요.
                  </p>
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
                    <div key={group.type} style={{ marginBottom: "14px" }}>
                      <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 8px" }}>{group.title}</h4>
                      <div className="card">
                        {documentsLoading ? (
                          <div className="row"><div className="g"><p>서류를 불러오는 중…</p></div></div>
                        ) : group.files.length === 0 ? (
                          <div className="row"><div className="g"><p>{group.empty}</p></div></div>
                        ) : (
                          group.files.map((file) => (
                            <div key={file.url} className="row">
                              <div className="g"><b>{file.name}</b></div>
                              <a
                                href={file.signedUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="열람 링크는 10분 후 만료됩니다. 만료 시 서류 탭을 다시 열면 재발급됩니다."
                              >
                                열기
                              </a>
                              <button
                                type="button"
                                className="btn ghost sm"
                                disabled={documentDeleting === file.url}
                                onClick={() => void deleteDocument(file.url, group.type)}
                              >
                                삭제
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "16px 0 8px" }}>권한 · 관리</h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {editRow.role === "TEACHER" ? (
                  <button type="button" className="btn sec sm" onClick={() => grantManager(editRow)}>매니저 부여</button>
                ) : editRow.role === "MANAGER" ? (
                  <button type="button" className="btn sec sm" onClick={() => revokeManager(editRow)}>매니저 해제</button>
                ) : null}
                <button type="button" className="btn danger sm" onClick={() => void deleteRow(editRow.id, editRow.name)}>삭제</button>
              </div>
            </div>
            <div className="d-f">
              <button type="button" className="btn sec" style={{ flex: 1 }} onClick={() => setEditRow(null)}>닫기</button>
              <button type="button" className="btn pri" style={{ flex: 1 }} disabled={editTab !== "card"} onClick={() => void saveEdit()}>저장</button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
