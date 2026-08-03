"use client";

import { useEffect, useState } from "react";

type PendingTeacher = {
  id: string;
  name: string;
  email: string;
  subjects: string;
  phone: string;
  createdAt: string;
};

type PendingTeachersResponse = {
  pendingTeachers?: PendingTeacher[];
  error?: string;
};

export function ManagerApprovalPage() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPendingTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manager/teacher-approval", { cache: "no-store" });
      const data = (await res.json()) as PendingTeachersResponse;
      if (!res.ok) {
        setError(data.error ?? "승인 대기 선생님을 불러오지 못했습니다.");
        return;
      }
      setPendingTeachers(data.pendingTeachers ?? []);
    } catch {
      setError("승인 대기 선생님을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingTeachers();
  }, []);

  async function handleApproval(teacherId: string, approve: boolean) {
    let reason = "";
    if (!approve) {
      const teacher = pendingTeachers.find((t) => t.id === teacherId);
      const label = teacher ? `${teacher.name} 선생님` : "이 지원서";
      const ok = confirm(
        `${label}을(를) 반려하시겠습니까?\n\n반려하면 계정이 비활성화되며 같은 연락처로 재지원이 불가할 수 있습니다. 되돌릴 수 없습니다.`,
      );
      if (!ok) return;
      // 반려 사유 입력 — 내부 기록용(감사 로그). SMS 통지에는 포함되지 않는다.
      reason = prompt("반려 사유를 입력하세요 (기록용, 선택):", "") ?? "";
    }
    setSubmittingId(teacherId);
    setError(null);
    try {
      const res = await fetch("/api/manager/teacher-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          approve ? { teacherId, approve } : { teacherId, approve, reason },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "승인 상태 변경에 실패했습니다.");
        return;
      }
      setPendingTeachers((current) => current.filter((teacher) => teacher.id !== teacherId));
    } catch {
      setError("승인 상태 변경에 실패했습니다.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="page on" id="pg-approval">
      <div className="crumb">/manager/teacher-approval</div>
      <h1>선생님 승인</h1>
      <p className="sub">
        지원 서류를 검토하고 승인·반려합니다. 치프 승인 라인은 별도(/chief-manager).
      </p>

      {error ? (
        <div className="sec">
          <div className="banner warn" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="sec card">
        {loading ? (
          <div className="row">
            <div className="g">
              <p>불러오는 중…</p>
            </div>
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="row">
            <div className="g">
              <p>승인 대기 중인 선생님이 없습니다.</p>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>지원자</th>
                <th>과목</th>
                <th>연락처</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {pendingTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <b>{teacher.name}</b>
                    <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--mut)" }}>
                      {teacher.email}
                    </span>
                  </td>
                  <td>{teacher.subjects}</td>
                  <td>{teacher.phone}</td>
                  <td>
                    <span className="bst warn">검토 대기</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn pri sm"
                      disabled={submittingId === teacher.id}
                      onClick={() => void handleApproval(teacher.id, true)}
                    >
                      승인
                    </button>{" "}
                    <button
                      type="button"
                      className="btn ghost sm"
                      disabled={submittingId === teacher.id}
                      onClick={() => void handleApproval(teacher.id, false)}
                    >
                      반려
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ManagerAdminTools />
    </section>
  );
}

type MatchingStudent = { id: string; name: string; grade: string };

/** 시안 pg-approval 하단 grid2 — 학부모↔학생 수동 연결 + 비밀번호 재설정. */
function ManagerAdminTools() {
  const [students, setStudents] = useState<MatchingStudent[]>([]);
  const [parentPhone, setParentPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);

  const [resetId, setResetId] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetOk, setResetOk] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/manager/matches", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { students?: MatchingStudent[] };
        setStudents(data.students ?? []);
      } catch {
        // 목록 로드 실패 시 select만 비워둠 — 연결 시도에서 오류 안내
      }
    })();
  }, []);

  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (linkBusy) return;
    setLinkBusy(true);
    setLinkMsg(null);
    try {
      const res = await fetch("/api/manager/parent-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, parentPhone }),
      });
      const data = (await res.json()) as { error?: string; alreadyLinked?: boolean };
      if (!res.ok) {
        setLinkOk(false);
        setLinkMsg(data.error ?? "연결에 실패했습니다.");
      } else {
        setLinkOk(true);
        setLinkMsg(data.alreadyLinked ? "이미 연결돼 있습니다." : "연결했습니다.");
      }
    } catch {
      setLinkOk(false);
      setLinkMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetBusy) return;
    setResetBusy(true);
    setResetMsg(null);
    try {
      const res = await fetch("/api/manager/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: resetId, newPassword: resetPw }),
      });
      const data = (await res.json()) as {
        error?: string;
        target?: { role: string; name: string };
      };
      if (!res.ok) {
        setResetOk(false);
        setResetMsg(data.error ?? "재설정에 실패했습니다.");
      } else {
        setResetPw("");
        setResetOk(true);
        setResetMsg(`재설정 완료${data.target?.name ? ` — ${data.target.name}` : ""} (감사 로그 기록됨)`);
      }
    } catch {
      setResetOk(false);
      setResetMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="sec grid2">
      <form className="card" style={{ padding: "20px" }} onSubmit={submitLink}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>학부모↔학생 수동 연결</h2>
        <div className="field">
          <label>학부모 전화번호</label>
          <input
            className="inp"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="field">
          <label>학생</label>
          <select className="inp" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">담당 학생 선택</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.grade ? ` · ${s.grade}` : ""}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn pri" disabled={linkBusy || !studentId || !parentPhone.trim()}>
          {linkBusy ? "연결 중…" : "연결 (linkedVia: MANAGER)"}
        </button>
        {linkMsg ? (
          <div className={linkOk ? "banner ok" : "banner err"} role="status" style={{ marginTop: "12px" }}>
            {linkOk ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            )}
            <span>{linkMsg}</span>
          </div>
        ) : null}
      </form>

      <form className="card" style={{ padding: "20px" }} onSubmit={submitReset}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>비밀번호 재설정 (학생·학부모)</h2>
        <div className="field">
          <label>대상 (전화번호 또는 이메일)</label>
          <input
            className="inp"
            value={resetId}
            onChange={(e) => setResetId(e.target.value)}
            placeholder="010-0000-0000 또는 email"
            autoComplete="off"
            name="reset-target"
          />
        </div>
        <div className="field">
          <label>새 비밀번호 (8자+)</label>
          <input
            className={resetPw.length > 0 && resetPw.length < 8 ? "inp err" : "inp"}
            type="password"
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            name="reset-new-password"
          />
          {resetPw.length > 0 && resetPw.length < 8 ? (
            <span className="f-err">비밀번호는 8자 이상이어야 합니다.</span>
          ) : null}
        </div>
        <button type="submit" className="btn sec" disabled={resetBusy || !resetId.trim() || resetPw.length < 8}>
          {resetBusy ? "재설정 중…" : "재설정 (감사 로그 기록)"}
        </button>
        {resetMsg ? (
          <div className={resetOk ? "banner ok" : "banner err"} role="status" style={{ marginTop: "12px" }}>
            {resetOk ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            )}
            <span>{resetMsg}</span>
          </div>
        ) : null}
      </form>
    </div>
  );
}
