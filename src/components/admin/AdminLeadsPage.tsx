"use client";

import { useCallback, useEffect, useState } from "react";

import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/lib/consultation-lead";

type Lead = {
  id: string;
  name: string | null;
  gender: string | null;
  region: string | null;
  phone: string;
  grade: string;
  subjects: string[];
  preferredTime: string | null;
  marketingOptIn: boolean;
  status: string;
  source: string | null;
  note: string | null;
  createdAt: string;
};

const FILTERS = ["ALL", ...LEAD_STATUSES] as const;

function formatPhone(phone: string): string {
  if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter !== "ALL") params.set("status", filter);
    fetch(`/api/consultation-leads?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `요청 실패 (${r.status})`);
        }
        return r.json() as Promise<{ leads: Lead[]; total: number }>;
      })
      .then((data) => {
        setLeads(data.leads);
        setTotal(data.total);
      })
      .catch(() => setError("상담 신청 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const patchLead = async (id: string, body: { status?: string; note?: string }) => {
    const res = await fetch("/api/consultation-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (res.ok) {
      const data = (await res.json()) as { lead: Lead };
      setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="page on" data-screen-label="상담 리드">
      <div className="crumb">/admin/leads</div>
      <h1>상담 리드</h1>
      <p className="sub">공개 상담신청 폼(/consult)으로 접수된 리드 목록입니다.</p>

      <div className="sec filters">
        <div className="opts">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="opt"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f === "ALL" ? "전체" : LEAD_STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="sec card" style={{ overflow: "hidden", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>신청일</th>
              <th>연락처</th>
              <th>학년</th>
              <th>지역</th>
              <th>과목</th>
              <th>희망 시간</th>
              <th>유입</th>
              <th>마케팅</th>
              <th>상태</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}>불러오는 중…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10}>접수된 상담 신청이 없습니다.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {new Date(lead.createdAt).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <b>{formatPhone(lead.phone)}</b>
                    {lead.name || lead.gender ? (
                      <span className="mini">{[lead.name, lead.gender].filter(Boolean).join(" · ")}</span>
                    ) : null}
                  </td>
                  <td>{lead.grade}</td>
                  <td>{lead.region ?? "—"}</td>
                  <td>{lead.subjects.join(", ")}</td>
                  <td>{lead.preferredTime ?? "—"}</td>
                  <td>{lead.source ?? "—"}</td>
                  <td>{lead.marketingOptIn ? "동의" : "—"}</td>
                  <td>
                    <select
                      className="inp filled"
                      value={lead.status}
                      onChange={(e) => void patchLead(lead.id, { status: e.target.value })}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        className="inp filled"
                        value={noteDraft[lead.id] ?? lead.note ?? ""}
                        onChange={(e) =>
                          setNoteDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        placeholder="메모"
                      />
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() =>
                          void patchLead(lead.id, { note: noteDraft[lead.id] ?? lead.note ?? "" })
                        }
                      >
                        저장
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 ? (
        <div className="sec" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button type="button" className="btn ghost sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </button>
          <span className="sub" style={{ margin: 0 }}>{page} / {totalPages}</span>
          <button type="button" className="btn ghost sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            다음
          </button>
        </div>
      ) : null}
    </section>
  );
}
