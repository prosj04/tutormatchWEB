"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";

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

function AnswerBadge({ hasTeacher, hasAi }: { hasTeacher: boolean; hasAi: boolean }) {
  if (hasTeacher) {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        선생님 답변
      </span>
    );
  }
  if (hasAi) {
    return (
      <span className="rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold text-text-secondary">
        AI 답변
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
      답변 대기
    </span>
  );
}

export function QuestionsPageClient({ studentName, initialItems, initialFilter }: Props) {
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
    <div className="min-h-screen bg-background" data-portal-content>
      <header className="portal-topbar">
        <div className="portal-topbar-inner">
          <Link href="/dashboard" className="portal-topbar-brand">
            Concord<span>.</span>
          </Link>
          <p className="portal-topbar-title">{studentName}님의 질문</p>
          <div className="portal-topbar-actions">
            <ConcordPortalThemeControls />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => signOut({ redirectTo: "/" })}
            >
              <span className="md:hidden">나가기</span>
              <span className="hidden md:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text-primary">내 질문 목록</h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            학습 플래너로 이동 →
          </Link>
        </div>

        {/* 필터 탭 */}
        <div className="mb-6 flex gap-1 rounded-xl bg-background p-1 ring-1 ring-gray-200">
          {(["all", "false", "true"] as FilterKey[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => changeFilter(f)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                filter === f
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-surface px-6 py-16 text-center">
            <p className="text-sm text-text-secondary">
              {filter === "all" ? "아직 등록된 질문이 없습니다." : `${FILTER_LABELS[filter]} 질문이 없습니다.`}
            </p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              대시보드에서 질문 등록하기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/dashboard?date=${q.date}`}
                  className={`block rounded-2xl border px-4 py-4 transition hover:bg-background ${
                    q.isResolved ? "border-gray-100 bg-surface" : "border-gray-200 bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-text-primary">{q.content}</p>
                      {q.imageUrl && (
                        <div className="mt-2 h-20 w-24 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.imageUrl}
                            alt="첨부 이미지"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <AnswerBadge hasTeacher={q.hasTeacherAnswer} hasAi={q.hasAiAnswer} />
                        {q.isResolved && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                            해결됨
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-text-muted">{formatDate(q.date)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
