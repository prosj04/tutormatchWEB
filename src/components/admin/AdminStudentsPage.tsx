"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDateKst } from "@/lib/format-date";

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
  managerName: string | null;
  createdAt: string;
  assignedTeachers: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function AdminStudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editRow, setEditRow] = useState<StudentRow | null>(null);
  const [form, setForm] = useState({ name: "", grade: "", subjects: "", phone: "" });

  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedQ) params.set("q", debouncedQ);
      if (grade) params.set("grade", grade);
      if (subject) params.set("subject", subject);
      const res = await fetch(`/api/admin/students?${params}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { students: StudentRow[]; pagination: Pagination };
      setRows(data.students);
      setPagination(data.pagination);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, grade, subject]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

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
    if (!confirm(`${name} 학생을 삭제하시겠습니까?\n\n진행 중 구독·수업이 함께 취소됩니다.`)) return;
    const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEditRow(null);
      fetchList();
    }
  }

  return (
    <section className="page on" data-screen-label="학생 관리">
      <div className="crumb">/admin/students</div>
      <h1>학생 관리</h1>
      <p className="sub">학생 계정과 구독·수업 이력입니다.</p>

      <div className="sec filters">
        <input
          className="inp filled"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름·전화번호 검색"
        />
        <select
          className="inp filled"
          style={{ width: "auto" }}
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setPage(1);
          }}
        >
          <option value="">전체 학년</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          className="inp filled"
          style={{ width: "auto" }}
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setPage(1);
          }}
        >
          <option value="">전체 과목</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" className="btn sec sm" onClick={() => setDebouncedQ(q)}>검색</button>
      </div>

      {loadError && (
        <div className="sec card" style={{ marginTop: 0, borderColor: "var(--danger, #d33)" }}>
          <div className="row">
            <div className="g">
              <b>불러오지 못했습니다</b>
              <p>학생 목록을 불러오는 중 문제가 발생했습니다.</p>
            </div>
            <button type="button" className="btn sec sm" onClick={() => fetchList()}>다시 시도</button>
          </div>
        </div>
      )}

      <div className="sec card" style={{ overflowX: "auto", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>학생</th>
              <th>희망과목</th>
              <th>담당 선생님</th>
              <th>담당 매니저</th>
              <th>가입일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>불러오는 중…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6}>—</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6}>결과 없음</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.name} · {row.grade}</b>
                    <span className="mini">{row.phone}</span>
                  </td>
                  <td>{row.subjects || "—"}</td>
                  <td>{row.assignedTeachers || "—"}</td>
                  <td>{row.managerName ?? "—"}</td>
                  <td>{formatDateKst(row.createdAt)}</td>
                  <td>
                    <button type="button" className="btn ghost sm" onClick={() => openEdit(row)}>상세</button>
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

      <div className={`drawer${editRow ? " on" : ""}`} aria-label="학생 상세">
        {editRow ? (
          <>
            <div className="d-h">
              <h3>{editRow.name} · {editRow.grade}</h3>
              <button type="button" className="x" onClick={() => setEditRow(null)}>✕</button>
            </div>
            <div className="d-b">
              <div className="kv" style={{ padding: "0 0 14px" }}>
                <div><span>담당 선생님</span><b>{editRow.assignedTeachers || "—"}</b></div>
                <div><span>담당 매니저</span><b>{editRow.managerName ?? "—"}</b></div>
                <div><span>가입일</span><b>{formatDateKst(editRow.createdAt)}</b></div>
              </div>
              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "10px 0 8px" }}>정보 수정</h4>
              <div className="field">
                <label>이름</label>
                <input
                  className="inp filled"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="이름"
                />
              </div>
              <div className="field">
                <label>학년</label>
                <select
                  className="inp filled"
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>과목 (쉼표 구분)</label>
                <input
                  className="inp filled"
                  value={form.subjects}
                  onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                  placeholder="과목"
                />
              </div>
              <div className="field">
                <label>전화번호</label>
                <input
                  className="inp filled"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="전화번호"
                />
              </div>
              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "16px 0 8px" }}>관리</h4>
              <button
                type="button"
                className="btn danger"
                style={{ width: "100%" }}
                onClick={() => void deleteRow(editRow.id, editRow.name)}
              >
                학생 삭제
              </button>
            </div>
            <div className="d-f">
              <button type="button" className="btn sec" style={{ flex: 1 }} onClick={() => setEditRow(null)}>닫기</button>
              <button type="button" className="btn pri" style={{ flex: 1 }} onClick={() => void saveEdit()}>저장</button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
