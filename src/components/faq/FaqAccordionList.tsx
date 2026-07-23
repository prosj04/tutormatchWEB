"use client";

import { useId, useState } from "react";

import { ConcordReveal } from "@/components/concord/ConcordReveal";

function FaqIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export type FaqItem = { q: string; a: string };

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${useId()}`;

  // reveal(정적 className)과 open 토글(동적)을 분리한다. ConcordReveal은 useEffect에서
  // DOM에 직접 "in"을 붙이는데, 같은 요소 className을 토글로 리렌더하면 React가 "in"을
  // 덮어써 박스가 사라진다. open은 안쪽 .faq-item에만 둔다.
  return (
    <ConcordReveal>
      <div className={`faq-item${open ? " open" : ""}`}>
        <button
          type="button"
          className="faq-q"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <h3>{item.q}</h3>
          <span className="ico">
            <FaqIcon />
          </span>
        </button>
        <div className="faq-a" id={panelId} role="region">
          <div className="faq-a-clip">
            <div className="faq-a-inner">{item.a}</div>
          </div>
        </div>
      </div>
    </ConcordReveal>
  );
}

export function FaqAccordionList({ faqs }: { faqs: FaqItem[] }) {
  return (
    <div className="faq-list">
      {faqs.map((item) => (
        <FaqAccordionItem key={item.q} item={item} />
      ))}
    </div>
  );
}
