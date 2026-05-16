"use client";

import { useCallback, useEffect, useState } from "react";

const SUBJECTS = ["국어", "영어", "수학", "사회탐구", "과학탐구"];
const GRADES = [
  "초등 4학년",
  "초등 5학년",
  "초등 6학년",
  "중학교 1학년",
  "중학교 2학년",
  "중학교 3학년",
  "고등학교 1학년",
  "고등학교 2학년",
  "고등학교 3학년",
];

type StudentRow = {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  phone: string;
  email: string;
  createdAt: string;
  assignedTeachers: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function AdminStudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<StudentRow | null>(null);
  const [form, setForm] = useState({ name: "", grade: "", subjects: "", phone: "" });

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (grade) params.set("grade", grade);
    if (subject) params.set("subject", subject);
    const res = await fetch(`/api/admin/students?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { students: StudentRow[]; pagination: Pagination };
      setRows(data.students);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, q, grade, subject]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openEdit(row: StudentRow) {
    setEditRow(row);
    setForm({
      name: row.name,
      grade: row.grade,
      subjects: row.subjects,
      phone: row.phone,
    });
  }

  async function saveEdit() {
    if (!editRow) return;
    const res = await fetch(`/api/admin/students/${editRow.id}`, {
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
    if (!confirm(`${name} 학생을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    if (res.ok) fetchList();
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">학생 관리</h2>

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
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">전체 학년</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">전체 과목</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fetchList()}
          className="rounded-xl bg-surface px-4 py-2 text-sm font-medium text-white"
        >
          검색
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">학년</th>
              <th className="px-4 py-3">희망과목</th>
              <th className="px-4 py-3">전화번호</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">담당선생님</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.grade}</td>
                  <td className="px-4 py-3">{row.subjects}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">
                    {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{row.assignedTeachers || "—"}</td>
                  <td className="px-4 py-3">
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
              ))
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
          <span className="px-3 py-1 text-sm text-text-secondary">
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
            <h3 className="font-bold text-text-primary">학생 수정</h3>
            <div className="mt-4 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="이름"
              />
              <select
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                value={form.subjects}
                onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="과목 (쉼표 구분)"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="전화번호"
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
