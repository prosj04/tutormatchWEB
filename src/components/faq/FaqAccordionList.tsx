"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ConcordReveal } from "@/components/concord/ConcordReveal";

function FaqIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export type FaqItem = { q: string; a: string };

function FaqAccordionItem({
  item,
  defaultOpen = false,
}: {
  item: FaqItem;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `faq-panel-${useId()}`;
  const answerRef = useRef<HTMLDivElement>(null);

  // Mirror concord.js: set inline max-height to the panel's scrollHeight when
  // open, 0 when closed, so the CSS `transition:max-height` animates identically.
  useEffect(() => {
    const el = answerRef.current;
    if (!el) return;
    el.style.maxHeight = open ? `${el.scrollHeight}px` : "0px";
  }, [open, item.a]);

  return (
    <ConcordReveal className={`faq-item${open ? " open" : ""}`}>
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
      <div
        ref={answerRef}
        className="faq-a"
        id={panelId}
        role="region"
        style={{ maxHeight: defaultOpen ? undefined : 0 }}
      >
        <div className="a-inner faq-a-inner">{item.a}</div>
      </div>
    </ConcordReveal>
  );
}

export function FaqAccordionList({ faqs }: { faqs: FaqItem[] }) {
  return (
    <div className="faq-list">
      {faqs.map((item, index) => (
        <FaqAccordionItem key={item.q} item={item} defaultOpen={index === 0} />
      ))}
    </div>
  );
}
