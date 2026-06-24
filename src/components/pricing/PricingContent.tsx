"use client";

import Link from "next/link";
import { useState } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { buildCheckoutHref } from "@/lib/pricing-plans";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

type Tier = "middle" | "high";

export function PricingContent() {
  const [tier, setTier] = useState<Tier>("middle");

  return (
    <main>
      <ConcordPageHead
        eyebrow="Plans"
        title={
          <>
            투명한 요금,
            <br />
            꼭 맞는 1:1 과외
          </>
        }
        description="모든 플랜에 학습 진도 관리, 과제 관리, 강사 첨삭·질답이 포함됩니다. 학년과 수업 횟수에 맞춰 선택하세요."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ConcordReveal className="tier-tabs" role="group" aria-label="학년 선택">
            <button
              type="button"
              className={tier === "middle" ? "on" : undefined}
              data-tier-tab="middle"
              onClick={() => setTier("middle")}
            >
              중등
            </button>
            <button
              type="button"
              className={tier === "high" ? "on" : undefined}
              data-tier-tab="high"
              onClick={() => setTier("high")}
            >
              고등
            </button>
          </ConcordReveal>

          {tier === "middle" ? (
            <div data-tier="middle">
              <div className="price-grid">
                <ConcordReveal as="article" className="card price-card">
                  <div className="ptag">1:1 맞춤 과외 · 중등</div>
                  <div className="pname">주 1회</div>
                  <div className="price">
                    320,000<small>원 / 월</small>
                  </div>
                  <div className="punit">주 1회 · 120분 · 회당 80,000원</div>
                  <ul className="pfeat">
                    <li>주 1회 수업 (120분)</li>
                    <li>학습 진도 관리</li>
                    <li>과제 관리</li>
                    <li>AI 질답 토큰 제공</li>
                    <li>수시 강사 첨삭·질답</li>
                  </ul>
                  <Link className="btn btn-ghost btn-block" href={buildCheckoutHref(4, 1)}>
                    이 플랜으로 시작
                  </Link>
                </ConcordReveal>
                <ConcordReveal as="article" className="card price-card rec">
                  <span className="rec-badge">추천</span>
                  <div className="ptag">1:1 맞춤 과외 · 중등</div>
                  <div className="pname">주 2회</div>
                  <div className="price">
                    620,000<small>원 / 월</small>
                  </div>
                  <div className="punit">주 2회 · 240분 · 회당 77,500원</div>
                  <ul className="pfeat">
                    <li>과목별 주 2회 수업 (240분)</li>
                    <li>과목 2개 이상 선택 가능</li>
                    <li>과목별 선생님 선택 가능</li>
                    <li>학습 진도·과제 관리</li>
                    <li>AI 질답 토큰 제공</li>
                    <li>수시 강사 첨삭·질답</li>
                  </ul>
                  <Link className="btn btn-acc btn-block" href={buildCheckoutHref(8, 1)}>
                    이 플랜으로 시작
                  </Link>
                </ConcordReveal>
              </div>
            </div>
          ) : (
            <div data-tier="high">
              <div className="price-grid">
                <ConcordReveal as="article" className="card price-card">
                  <div className="ptag">1:1 맞춤 과외 · 고등</div>
                  <div className="pname">주 1회</div>
                  <div className="price">
                    380,000<small>원 / 월</small>
                  </div>
                  <div className="punit">주 1회 · 120분 · 회당 100,000원</div>
                  <ul className="pfeat">
                    <li>주 1회 수업 (120분)</li>
                    <li>학습 진도 관리</li>
                    <li>과제 관리</li>
                    <li>AI 질답 토큰 제공</li>
                    <li>수시 강사 첨삭·질답</li>
                  </ul>
                  <Link className="btn btn-ghost btn-block" href={buildCheckoutHref(4, 1)}>
                    이 플랜으로 시작
                  </Link>
                </ConcordReveal>
                <ConcordReveal as="article" className="card price-card rec">
                  <span className="rec-badge">추천</span>
                  <div className="ptag">1:1 맞춤 과외 · 고등</div>
                  <div className="pname">주 2회</div>
                  <div className="price">
                    740,000<small>원 / 월</small>
                  </div>
                  <div className="punit">주 2회 · 240분 · 회당 90,000원</div>
                  <ul className="pfeat">
                    <li>과목별 주 2회 수업 (240분)</li>
                    <li>과목 2개 이상 선택 가능</li>
                    <li>과목별 선생님 선택 가능</li>
                    <li>학습 진도·과제 관리</li>
                    <li>AI 질답 토큰 제공</li>
                    <li>수시 강사 첨삭·질답</li>
                  </ul>
                  <Link className="btn btn-acc btn-block" href={buildCheckoutHref(8, 1)}>
                    이 플랜으로 시작
                  </Link>
                </ConcordReveal>
              </div>
            </div>
          )}

          <ConcordReveal className="assure" as="div">
            <ShieldIcon />
            <span>
              처음 배정된 선생님이 맞지 않으면 <strong>추가 비용 없이 다시 매칭</strong>해 드립니다. 수업료는 월 단위, 언제든 조정 가능합니다.
            </span>
          </ConcordReveal>
        </div>
      </section>
    </main>
  );
}
