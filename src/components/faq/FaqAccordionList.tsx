"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ConcordReveal } from "@/components/concord/ConcordReveal";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export type FaqItem = { q: string; a: string };

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${useId()}`;

  // reveal(정적 className)과 open 토글(동적)을 분리한다. ConcordReveal은 useEffect에서
  // DOM에 직접 "in"을 붙이는데, 같은 요소 className을 토글로 리렌더하면 React가 "in"을
  // 덮어써 행이 사라진다. open은 안쪽 .faq-item에만 둔다.
  return (
    <ConcordReveal>
      <div className={`faq-item${open ? " open" : ""}`}>
        <button
          type="button"
          className="faq-q"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <h3>{item.q}</h3>
          <span className="ico">
            <PlusIcon />
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
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // 닫힘의 예의(BUSINESS_DIRECTION §13-10): 목록 밖을 클릭하면 전부 닫는다.
  useEffect(() => {
    if (openKeys.length === 0) return;
    const onPointerDown = (e: PointerEvent | MouseEvent) => {
      const el = listRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpenKeys([]);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openKeys.length]);

  const toggle = (key: string) =>
    setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  return (
    <div className="faq-list" ref={listRef}>
      {faqs.map((item) => (
        <FaqAccordionItem
          key={item.q}
          item={item}
          open={openKeys.includes(item.q)}
          onToggle={() => toggle(item.q)}
        />
      ))}
    </div>
  );
}
