import type { ReactNode } from "react";
import { ConcordReveal } from "@/components/concord/ConcordReveal";

/**
 * 서브페이지 공통 머리 (v3 Editorial).
 * eyebrow → 대형 세리프 h1 → 리드 → 하단 헤어라인. 배경 그라데이션·그리드 없음.
 * 스타일 정본은 ds.css `.page-head`.
 */
export function ConcordPageHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <section className="page-head">
      <ConcordReveal className="wrap inner" as="div">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </ConcordReveal>
    </section>
  );
}
