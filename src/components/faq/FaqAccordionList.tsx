"use client";

import { useEffect, useRef, useState } from "react";

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
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = answerRef.current;
    if (!a) return;
    a.style.maxHeight = open ? `${a.scrollHeight}px` : "0px";
  }, [open]);

  return (
    <ConcordReveal className={`faq-item${open ? " open" : ""}`}>
      <button type="button" className="faq-q" onClick={() => setOpen((v) => !v)}>
        <h3>{item.q}</h3>
        <span className="ico">
          <FaqIcon />
        </span>
      </button>
      <div className="faq-a" ref={answerRef}>
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
