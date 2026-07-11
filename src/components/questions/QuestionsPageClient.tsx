"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type QuestionItem = {
  id: string;
  date: string;
  content: string;
  imageUrl: string | null;
  isResolved: boolean;
  hasTeacherAnswer: boolean;
  hasAiAnswer: boolean;
  createdAt: string;
};

type FilterKey = "all" | "true" | "false";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "전체",
  false: "미해결",
  true: "해결됨",
};

type Props = {
  studentName: string;
  initialItems: QuestionItem[];
  initialFilter: string;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/** 답변 상태 → 시안 상태 배지(.bst). */
function statusBadge(q: QuestionItem): { label: string; cls: string } {
  if (q.isResolved) return { label: "해결", cls: "bst acc" };
  if (q.hasTeacherAnswer || q.hasAiAnswer) return { label: "답변", cls: "bst acc" };
  return { label: "대기", cls: "bst warn" };
}

function statusText(q: QuestionItem): string {
  if (q.hasTeacherAnswer) return `선생님 답변 · ${formatDate(q.date)}`;
  if (q.hasAiAnswer) return q.isResolved ? `AI 답변으로 해결 · ${formatDate(q.date)}` : "AI 답변 완료 · 선생님 답변 대기";
  return "답변 대기";
}

export function QuestionsPageClient({ initialItems, initialFilter }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>(
    (["all", "true", "false"] as FilterKey[]).includes(initialFilter as FilterKey)
      ? (initialFilter as FilterKey)
      : "all",
  );

  const filtered =
    filter === "all"
      ? initialItems
      : initialItems.filter((q) => String(q.isResolved) === filter);

  function changeFilter(f: FilterKey) {
    setFilter(f);
    const params = new URLSearchParams();
    if (f !== "all") params.set("resolved", f);
    router.replace(`/questions${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  return (
    <section className="page on" id="pg-questions" data-screen-label="질문">
      <div className="crumb">/questions</div>
      <h1>질문</h1>
      <p className="sub">
        사진과 함께 질문하면 AI가 먼저 풀이를 안내하고, 필요하면 선생님이 답변합니다.
      </p>
      <div className="sec grid2">
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700 }}>새 질문</h2>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--mut)" }}>
            질문 등록은 학습 플래너의 날짜별 화면에서 사진과 함께 진행할 수 있어요.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <Link className="btn pri" href="/dashboard" style={{ flex: 1, textAlign: "center" }}>
              질문하러 가기
            </Link>
          </div>
          <span className="f-hint">
            AI 답변 후 ‘해결됐어요’ 또는 ‘선생님께 질문’을 선택할 수 있어요. 토큰이 없으면 선생님 답변만 대기합니다.
          </span>
          <div className="pm" style={{ marginTop: "16px" }}>
            {(["all", "false", "true"] as FilterKey[]).map((f) => (
              <button
                key={f}
                type="button"
                className="p"
                aria-pressed={filter === f}
                onClick={() => changeFilter(f)}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>내 질문</h2>
          {filtered.length === 0 ? (
            <div className="row">
              <div className="g">
                <b>
                  {filter === "all" ? "아직 등록된 질문이 없습니다" : `${FILTER_LABELS[filter]} 질문이 없습니다`}
                </b>
                <p>학습 플래너에서 질문을 등록해 보세요.</p>
              </div>
            </div>
          ) : (
            filtered.map((q) => {
              const badge = statusBadge(q);
              return (
                <Link key={q.id} href={`/dashboard?date=${q.date}`} className="row" style={{ textDecoration: "none" }}>
                  <div className="g">
                    <b>{q.content}</b>
                    <p>{statusText(q)}</p>
                  </div>
                  <span className={badge.cls}>{badge.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
