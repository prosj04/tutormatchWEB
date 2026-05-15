"use client";

import { useCallback, useEffect, useState } from "react";

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
  studentCount: number;
  createdAt: string;
};

function roleBadge(role: string) {
  if (role === "MANAGER") {
    return {
      label: "매니저",
      className: "bg-navy/10 text-navy",
    };
  }
  return {
    label: "선생님",
    className: "bg-gray-100 text-text-mid",
  };
}

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function AdminTeachersPage() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<TeacherRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    subjects: "",
    education: "",
    experience: "",
    bio: "",
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

  function openEdit(row: TeacherRow) {
    setEditRow(row);
    setForm({
      name: row.name,
      subjects: row.subjects,
      education: row.education,
      experience: row.experience,
      bio: row.bio,
    });
  }

  async function saveEdit() {
    if (!editRow) return;
    const res = await fetch(`/api/admin/teachers/${editRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      <h2 className="text-2xl font-black text-text-dark">선생님 관리</h2>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름/이메일 검색"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="all">전체</option>
          <option value="approved">승인됨</option>
          <option value="pending">대기중</option>
        </select>
        <button
          type="button"
          onClick={() => fetchList()}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white"
        >
          검색
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-light">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">담당과목</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">전화번호</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">승인상태</th>
              <th className="px-4 py-3">담당학생수</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-light">
                  불러오는 중…
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = roleBadge(row.role);
                return (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.subjects}</td>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleApprove(row)}
                      className="mr-2 text-gold hover:underline"
                    >
                      {row.approved ? "승인취소" : "승인"}
                    </button>
                    {row.role === "TEACHER" ? (
                      <button
                        type="button"
                        onClick={() => grantManager(row)}
                        className="mr-2 text-navy hover:underline"
                      >
                        매니저 권한 부여
                      </button>
                    ) : row.role === "MANAGER" ? (
                      <button
                        type="button"
                        onClick={() => revokeManager(row)}
                        className="mr-2 text-text-mid hover:underline"
                      >
                        매니저 권한 해제
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="mr-2 text-primary hover:underline"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id, row.name)}
                      className="text-accent hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold">선생님 수정</h3>
            <div className="mt-4 space-y-3">
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
            </div>
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
                className="flex-1 rounded-xl bg-gold py-2 text-sm font-semibold text-white"
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
