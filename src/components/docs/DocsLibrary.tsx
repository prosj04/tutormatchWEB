"use client";

import { useState } from "react";

type DocItem = {
  id: string;
  title: string;
  desc: string;
  category: string;
  file: string;
  pages: string;
};

const DOCS: DocItem[] = [
  {
    id: "proposal-ledger",
    title: "제안 원장 컴펜디움",
    desc: "사업·마케팅·수익모델·성장·리팩토링·제품/디자인 전 제안을 ID 단위로 집대성 + 신규 확장·창의 제안(X-1~28).",
    category: "제안 · 전략",
    file: "/docs/Concord-Proposal-Ledger.pdf",
    pages: "76p",
  },
  {
    id: "ceo-proposal",
    title: "경영자 제안",
    desc: "Problem~Ask 구조의 경영자용 사업·마케팅 제안. 스크린샷 증거 기반 요약본.",
    category: "제안 · 전략",
    file: "/docs/Concord-CEO-Proposal.pdf",
    pages: "13p",
  },
  {
    id: "ir-deck",
    title: "IR 피치덱",
    desc: "발표·투자 미팅용 덱. PSST·재무계획 수치 기반.",
    category: "IR · 투자",
    file: "/docs/Concord-IR-Deck.pdf",
    pages: "13p",
  },
  {
    id: "ir-onepager",
    title: "IR 원페이저",
    desc: "투자·지원사업 1페이지 요약.",
    category: "IR · 투자",
    file: "/docs/Concord-IR-OnePager.pdf",
    pages: "1p",
  },
  {
    id: "app-guide",
    title: "앱 설명 자료",
    desc: "캡처 프레임 임베드로 문서만 봐도 앱을 파악할 수 있는 상세 가이드.",
    category: "브랜드 · 앱",
    file: "/docs/Concord-App-Guide.pdf",
    pages: "32p",
  },
  {
    id: "brand-guidelines",
    title: "브랜드 가이드라인",
    desc: "로고·컬러·타이포·보이스 규정집 v1.1.",
    category: "브랜드 · 앱",
    file: "/docs/Concord-Brand-Guidelines.pdf",
    pages: "11p",
  },
  {
    id: "design-direction",
    title: "사이트 방향 정의서",
    desc: "포지셔닝·시각 언어·짜침 배제·전환 설계·상담 UX·요금 정책·선생님 노출 원칙과 결정 이력.",
    category: "브랜드 · 앱",
    file: "/docs/design-direction.html",
    pages: "웹",
  },
  {
    id: "benchmark-seoltab",
    title: "설탭 벤치마크 리포트",
    desc: "설탭 전 페이지 조사: 전환 설계 10원칙·페이지 구조·상담폼 필드·채택/제외 판정표·촬영 목록.",
    category: "벤치마크 · 리서치",
    file: "/docs/benchmark-seoltab.html",
    pages: "웹",
  },
];

const CATEGORIES = ["제안 · 전략", "IR · 투자", "브랜드 · 앱", "벤치마크 · 리서치"];

export function DocsLibrary() {
  const [active, setActive] = useState<DocItem>(DOCS[0]);

  return (
    <section className="wrap" style={{ paddingBottom: "6rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.75rem 1rem",
          marginBottom: "1.75rem",
          borderRadius: 12,
          background: "var(--panel-2)",
          border: "1px solid var(--line2)",
          fontSize: 13,
          color: "var(--mut)",
        }}
      >
        <span aria-hidden>🔒</span>
        <span>
          내부 검토용 임시 자료실입니다. 링크를 아는 사람은 열람할 수 있으니 외부 공유에 유의하세요. 출시 전 제거 예정.
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
        className="docs-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--acc, #10B981)",
                  margin: "0 0 0.6rem",
                }}
              >
                {cat}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {DOCS.filter((d) => d.category === cat).map((doc) => {
                  const selected = doc.id === active.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActive(doc)}
                      style={{
                        textAlign: "left",
                        padding: "0.85rem 1rem",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: selected ? "var(--fg)" : "var(--panel)",
                        color: selected ? "var(--bg)" : "var(--fg)",
                        border: `1px solid ${selected ? "var(--fg)" : "var(--line2)"}`,
                        transition: "all .15s ease",
                      }}
                    >
                      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{doc.title}</span>
                        <span style={{ fontSize: 11, opacity: 0.7 }}>{doc.pages}</span>
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginTop: "0.35rem",
                          fontSize: 12,
                          lineHeight: 1.45,
                          color: selected ? "rgba(255,255,255,.7)" : "var(--mut)",
                        }}
                      >
                        {doc.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{active.title}</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a href={active.file} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                새 탭에서 열기
              </a>
              <a href={active.file} download className="btn btn-sm" style={{ background: "var(--fg)", color: "var(--bg)" }}>
                다운로드
              </a>
            </div>
          </div>
          <iframe
            key={active.id}
            title={active.title}
            src={`${active.file}#view=FitH`}
            style={{
              width: "100%",
              height: "80vh",
              minHeight: 520,
              border: "1px solid var(--line2)",
              borderRadius: 12,
              background: "var(--panel-2)",
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .docs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
