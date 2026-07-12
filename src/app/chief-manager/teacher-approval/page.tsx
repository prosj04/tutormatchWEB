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

type UploadedDocumentFile = {
  url: string;
  signedUrl: string;
  name: string;
};

type DocumentsResponse = {
  resumeFiles: UploadedDocumentFile[];
  documentFiles: UploadedDocumentFile[];
};

export default function ChiefManagerTeacherApprovalPage() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docsTeacherId, setDocsTeacherId] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentsResponse | null>(null);

  async function loadPendingTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chief-manager/teacher-approval", { cache: "no-store" });
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

  // 서류 열람 링크 발급 — 어드민 강사 페이지의 signed URL 발급 패턴 재사용.
  // 링크는 서버에서 10분 만료로 발급되므로, 열람 버튼을 다시 누르면 재발급된다.
  async function toggleDocuments(teacherId: string) {
    if (docsTeacherId === teacherId && !docsLoading) {
      setDocsTeacherId(null);
      setDocs(null);
      return;
    }
    setDocsTeacherId(teacherId);
    setDocs(null);
    setDocsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/documents`, { cache: "no-store" });
      if (!res.ok) {
        setError("서류를 불러오지 못했습니다.");
        setDocsTeacherId(null);
        return;
      }
      setDocs((await res.json()) as DocumentsResponse);
    } catch {
      setError("서류를 불러오지 못했습니다.");
      setDocsTeacherId(null);
    } finally {
      setDocsLoading(false);
    }
  }

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
      const res = await fetch("/api/chief-manager/teacher-approval", {
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
      if (docsTeacherId === teacherId) {
        setDocsTeacherId(null);
        setDocs(null);
      }
    } catch {
      setError("승인 상태 변경에 실패했습니다.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="page on" data-screen-label="치프 승인">
      <div className="crumb">/chief-manager/teacher-approval</div>
      <h1>치프 최종 승인</h1>
      <p className="sub">매니저 승인을 거친 선생님의 최종 승인 큐입니다.</p>

      {error ? (
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="sec card">
        {loading ? (
          <div className="row"><div className="g"><p>불러오는 중…</p></div></div>
        ) : pendingTeachers.length === 0 ? (
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <b>승인 대기 중인 선생님이 없습니다.</b>
          </div>
        ) : (
          pendingTeachers.map((teacher) => (
            <div key={teacher.id}>
              <div className="row">
                <span className="av">{teacher.name.slice(0, 1)}</span>
                <div className="g">
                  <b>{teacher.name} · {teacher.subjects}</b>
                  <p>{teacher.email} · {teacher.phone}</p>
                </div>
                <span className="bst warn">최종 대기</span>
                <button
                  type="button"
                  className="btn ghost sm"
                  disabled={submittingId === teacher.id}
                  onClick={() => void toggleDocuments(teacher.id)}
                >
                  {docsTeacherId === teacher.id ? "서류 닫기" : "서류 열람"}
                </button>
                <button
                  type="button"
                  className="btn sec sm"
                  disabled={submittingId === teacher.id}
                  onClick={() => void handleApproval(teacher.id, false)}
                >
                  반려
                </button>
                <button
                  type="button"
                  className="btn pri sm"
                  disabled={submittingId === teacher.id}
                  onClick={() => void handleApproval(teacher.id, true)}
                >
                  최종 승인
                </button>
              </div>
              {docsTeacherId === teacher.id ? (
                <div className="card" style={{ margin: "0 0 8px", padding: "12px" }}>
                  <p className="f-hint" style={{ marginBottom: "10px" }}>
                    열람 링크는 10분 후 만료됩니다. 만료되면 서류 열람을 다시 눌러 재발급하세요.
                  </p>
                  {docsLoading ? (
                    <p>서류를 불러오는 중…</p>
                  ) : docs && (docs.resumeFiles.length > 0 || docs.documentFiles.length > 0) ? (
                    [
                      { title: "이력서", files: docs.resumeFiles },
                      { title: "인증서류", files: docs.documentFiles },
                    ].map((group) => (
                      <div key={group.title} style={{ marginBottom: "8px" }}>
                        <b style={{ fontSize: "13px" }}>{group.title}</b>
                        {group.files.length === 0 ? (
                          <p className="f-hint">등록된 파일이 없습니다.</p>
                        ) : (
                          group.files.map((file) => (
                            <div key={file.url} className="row" style={{ padding: "6px 0" }}>
                              <div className="g"><span>{file.name}</span></div>
                              <a
                                href={file.signedUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="열람 링크는 10분 후 만료됩니다."
                              >
                                열기
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="f-hint">등록된 서류가 없습니다.</p>
                  )}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="sec banner ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
        <span>최종 승인 시 선생님에게 알림이 발송되고 매칭 풀에 공개됩니다.</span>
      </div>
    </section>
  );
}
