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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary">상담 신청 리드</h2>
          <p className="mt-1 text-sm text-text-secondary">
            공개 상담신청 폼(/consult)으로 접수된 리드 목록입니다.
          </p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === f
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-text-secondary hover:border-primary/30"
              }`}
            >
              {f === "ALL" ? "전체" : LEAD_STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-text-secondary">불러오는 중…</p> : null}

      {!loading && !error ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-text-secondary">
                <th className="px-4 py-3">신청일</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">학년</th>
                <th className="px-4 py-3">과목</th>
                <th className="px-4 py-3">희망 시간</th>
                <th className="px-4 py-3">유입 경로</th>
                <th className="px-4 py-3">마케팅</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">메모</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-secondary">
                    접수된 상담 신청이 없습니다.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {formatPhone(lead.phone)}
                      {lead.name || lead.gender ? (
                        <span className="ml-1 font-normal text-text-secondary">
                          ({[lead.name, lead.gender].filter(Boolean).join(" · ")})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{lead.grade}</td>
                    <td className="px-4 py-3">{lead.subjects.join(", ")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{lead.preferredTime ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{lead.source ?? "—"}</td>
                    <td className="px-4 py-3">{lead.marketingOptIn ? "동의" : "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => void patchLead(lead.id, { status: e.target.value })}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={noteDraft[lead.id] ?? lead.note ?? ""}
                          onChange={(e) =>
                            setNoteDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))
                          }
                          placeholder="메모"
                          className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void patchLead(lead.id, { note: noteDraft[lead.id] ?? lead.note ?? "" })
                          }
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-bold text-text-secondary hover:border-primary/30"
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
      ) : null}

      {!loading && totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
