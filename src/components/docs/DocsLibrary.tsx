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
    id: "copy-proposals",
    title: "카피 제안서",
    desc: "매칭 철학 기반 섹션별 문구 복수안(추천안 표시) + 실제 사건 뉴스 활용 수위 3안과 표현 가이드.",
    category: "브랜드 · 앱",
    file: "/docs/copy-proposals.html",
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

/** 자료실 — 에디토리얼 목차(번호·제목·형식) + 오른쪽 미리보기. */
export function DocsLibrary() {
  const [active, setActive] = useState<DocItem>(DOCS[0]);

  return (
    <section className="sec-sm">
      <div className="wrap">
        <p className="mk-docs-note">
          내부 검토용 임시 자료실입니다. 링크를 아는 사람은 열람할 수 있으니 외부 공유에 유의하세요. 출시 전 제거 예정.
        </p>

        <div className="mk-docs-layout">
          <div>
            {CATEGORIES.map((cat) => (
              <div key={cat} className="mk-docs-group">
                <span className="eyebrow">{cat}</span>
                <ul className="mk-docs-index">
                  {DOCS.filter((d) => d.category === cat).map((doc) => {
                    const selected = doc.id === active.id;
                    return (
                      <li key={doc.id} className="mk-docs-row">
                        <button
                          type="button"
                          onClick={() => setActive(doc)}
                          aria-current={selected ? "true" : undefined}
                        >
                          <span className="idx">
                            {String(DOCS.findIndex((d) => d.id === doc.id) + 1).padStart(2, "0")}
                          </span>
                          <span className="t">{doc.title}</span>
                          <span className="f">{doc.pages}</span>
                          <span className="d">{doc.desc}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mk-docs-view">
            <div className="mk-docs-view-head">
              <h2>{active.title}</h2>
              <div className="mk-docs-view-actions">
                <a href={active.file} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  새 탭에서 열기
                </a>
                <a href={active.file} download className="btn btn-ink btn-sm">
                  다운로드
                </a>
              </div>
            </div>
            <iframe
              key={active.id}
              title={active.title}
              src={`${active.file}#view=FitH`}
              className="mk-docs-frame"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
