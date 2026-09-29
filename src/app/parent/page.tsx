import Link from "next/link";
import { Fragment } from "react";

import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";
import {
  formatSubscriptionPlanLabel,
  formatSubscriptionStatus,
} from "@/lib/subscription-label";

export const dynamic = "force-dynamic";

type Child = Awaited<ReturnType<typeof listParentChildren>>[number];

/** "2026. 9." 형식으로 리포트 월 표시 (month는 "2026-09" 형식). */
function formatReportMonth(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}. ${Number(m)}.`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR");
}

/** 진행선 단계 — 기존 상태 라벨을 그대로 순서대로 쓴다. */
const FLOW_STEPS = ["상담 전", "상담 진행 중", "배정 중", "수업 중"] as const;

/**
 * 자녀 상태를 진행선 위 위치로 환산 + 보조 문구.
 * 구독 > 상담 완료(매칭 중) > 상담 진행 > 상담 전 순으로 실단계 표기.
 */
function statusFlow(child: Child): { step: number; meta: string } {
  if (child.subscription) {
    return { step: 3, meta: "" };
  }
  if (child.consultationStatus === "COMPLETED") {
    return { step: 2, meta: "상담 완료 · 선생님 배정 중" };
  }
  if (child.consultationStatus === "WAITING" || child.consultationStatus === "ASSIGNED") {
    return { step: 1, meta: "방문 상담 일정을 조율하고 있어요" };
  }
  return { step: 0, meta: "상담 탭에서 방문 상담을 신청해 보세요" };
}

type NewsItem = { icon: "report" | "pay"; title: string; body: string };

/** 최신 리포트 월·구독 결제 예정에서 '새 소식'을 도출한다. */
function buildNews(children: Child[]): NewsItem[] {
  const items: NewsItem[] = [];
  for (const child of children) {
    if (child.latestReportMonth) {
      items.push({
        icon: "report",
        title: `${child.name} ${formatReportMonth(child.latestReportMonth)} 학습 리포트 도착`,
        body: "리포트에서 종합 점수와 과목별 변화를 확인하세요.",
      });
    }
  }
  for (const child of children) {
    const sub = child.subscription;
    if (sub?.periodEnd) {
      items.push({
        icon: "pay",
        title: `${child.name} 결제 예정`,
        body: `${formatSubscriptionPlanLabel(sub.plan)} · ${formatDate(sub.periodEnd)} 자동 결제`,
      });
    }
  }
  return items;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function NewsIcon({ kind }: { kind: NewsItem["icon"] }) {
  return kind === "report" ? (
    <svg className="pa-ico" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  ) : (
    <svg className="pa-ico" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

/** 상태 진행선 — 지난 단계는 체크, 현재 단계는 채운 원. */
function StatusFlow({ step }: { step: number }) {
  return (
    <div className="flow pa-flow">
      {FLOW_STEPS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 ? <span className={i <= step ? "bar done" : "bar"} /> : null}
          <span className={`st${i < step ? " done" : i === step ? " now" : ""}`}>
            <i aria-hidden>
              {i < step ? (
                <svg viewBox="0 0 24 24" {...stroke}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </i>
            <span>{label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export default async function ParentHomePage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);
  const news = buildNews(children);

  return (
    <section className="page on" id="pg-dash" data-screen-label="학부모 대시보드">
      <header className="pa-head">
        <div className="crumb">학부모</div>
        <h1>대시보드</h1>
        <p className="sub">연결된 자녀의 현재 상태·최근 리포트·결제를 한눈에 봅니다.</p>
      </header>

      {children.length === 0 ? (
        <div className="pa-empty">
          <p>아직 연결된 자녀가 없습니다. 자녀 연결에서 코드를 입력해 주세요.</p>
          <Link className="btn pri" href="/parent/link">
            자녀 연결
          </Link>
        </div>
      ) : (
        children.map((child) => {
          const flow = statusFlow(child);
          const meta = child.subscription
            ? `${formatSubscriptionPlanLabel(child.subscription.plan)} · ${formatSubscriptionStatus(child.subscription.status, 1)}`
            : flow.meta;
          return (
            <article key={child.id} className="pa-child">
              <h2 className="pa-child-name">{child.name}</h2>
              <p className="pa-child-meta">
                {child.grade ? `${child.grade}` : ""}
                {child.grade && meta ? " · " : ""}
                {meta}
              </p>

              <StatusFlow step={flow.step} />

              <div className="kpis">
                <div className="kpi">
                  <b>
                    {child.latestReportMonth
                      ? formatReportMonth(child.latestReportMonth)
                      : "-"}
                  </b>
                  <span>최근 리포트</span>
                </div>
                <div className="kpi">
                  <b>{child.subscription?.periodEnd ? formatDate(child.subscription.periodEnd) : "-"}</b>
                  <span>다음 결제</span>
                </div>
              </div>

              <div className="pa-actions">
                <Link className="btn btn-ghost btn-sm" href="/parent/reports">
                  리포트
                </Link>
                <Link className="btn btn-ghost btn-sm" href="/parent/payments">
                  결제 현황
                </Link>
                <Link className="btn btn-ghost btn-sm" href="/parent/consultation">
                  상담 신청
                </Link>
              </div>
            </article>
          );
        })
      )}

      <div className="sec pa-ruled">
        <h2>새 소식</h2>
        {news.length === 0 ? (
          <div className="pa-rows">
            <div>
              <span className="t">새 소식이 없습니다</span>
              <span className="d">리포트가 도착하거나 결제가 예정되면 여기에 표시됩니다.</span>
            </div>
          </div>
        ) : (
          <div className="pa-rows">
            {news.map((item, i) => (
              <div key={i}>
                <NewsIcon kind={item.icon} />
                <span className="t">{item.title}</span>
                <span className="d">{item.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sec banner info">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>
          학부모 페이지는 리포트·결제·상담·자녀 연결만 제공합니다. 진도·숙제·질문은 자녀 계정에서 관리돼요.
        </span>
      </div>
    </section>
  );
}
