import Link from "next/link";

import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";
import {
  formatSubscriptionPlanLabel,
  formatSubscriptionStatus,
} from "@/lib/subscription-label";

export const dynamic = "force-dynamic";

type Child = Awaited<ReturnType<typeof listParentChildren>>[number];

function initial(name: string): string {
  return name.slice(0, 1);
}

/** "2026. 9." 형식으로 리포트 월 표시 (month는 "2026-09" 형식). */
function formatReportMonth(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}. ${Number(m)}.`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR");
}

/** 자녀 상태 배지·문구 — 구독 > 상담 완료(매칭 중) > 상담 진행 > 상담 전 순으로 실단계 표기. */
function statusBadge(child: Child): { label: string; cls: string; meta: string } {
  if (child.subscription) {
    return { label: "수업 중", cls: "bst acc", meta: "" };
  }
  if (child.consultationStatus === "COMPLETED") {
    return { label: "매칭 중", cls: "bst mut", meta: "상담 완료 · 선생님 매칭 중" };
  }
  if (child.consultationStatus === "WAITING" || child.consultationStatus === "ASSIGNED") {
    return { label: "상담 진행 중", cls: "bst mut", meta: "방문 상담 일정을 조율하고 있어요" };
  }
  return { label: "상담 전", cls: "bst mut", meta: "상담 탭에서 방문 상담을 신청해 보세요" };
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

export default async function ParentHomePage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);
  const news = buildNews(children);

  return (
    <section className="page on" id="pg-dash" data-screen-label="학부모 대시보드">
      <div className="crumb">/parent</div>
      <h1>대시보드</h1>
      <p className="sub">연결된 자녀의 현재 상태·최근 리포트·결제를 한눈에 봅니다.</p>

      {children.length === 0 ? (
        <div className="sec">
          <p className="sub">
            아직 연결된 자녀가 없습니다. 자녀 연결에서 코드를 입력해 주세요.
          </p>
        </div>
      ) : (
        <div className="sec grid2">
          {children.map((child) => {
            const badge = statusBadge(child);
            const meta = child.subscription
              ? `${formatSubscriptionPlanLabel(child.subscription.plan)} · ${formatSubscriptionStatus(child.subscription.status, 1)}`
              : badge.meta;
            return (
              <div key={child.id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "13px",
                      background: "var(--panel-2)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      color: "var(--acc-text)",
                      fontSize: "15px",
                      flex: "0 0 auto",
                    }}
                  >
                    {initial(child.name)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: "15px", fontWeight: 800 }}>
                      {child.name}
                      {child.grade ? ` · ${child.grade}` : ""}
                    </b>
                    <p style={{ fontSize: "12.5px", color: "var(--mut)" }}>{meta}</p>
                  </div>
                  <span className={badge.cls}>{badge.label}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <Link className="btn sec sm" href="/parent/reports">
                    리포트
                  </Link>
                  <Link className="btn sec sm" href="/parent/payments">
                    결제 현황
                  </Link>
                  <Link className="btn sec sm" href="/parent/consultation">
                    상담 신청
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sec">
        <h2>새 소식</h2>
        <div className="card">
          {news.length === 0 ? (
            <div className="row">
              <div className="g">
                <b>새 소식이 없습니다</b>
                <p>리포트가 도착하거나 결제가 예정되면 여기에 표시됩니다.</p>
              </div>
            </div>
          ) : (
            news.map((item, i) => (
              <div key={i} className="row">
                <span className="av">
                  {item.icon === "report" ? (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M9 13h6M9 17h4" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  )}
                </span>
                <div className="g">
                  <b>{item.title}</b>
                  <p>{item.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
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
