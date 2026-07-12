"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { HallCardItem } from "@/lib/hall-items";

export type HallItem = HallCardItem;

/** 합격 카드 — 학교 로고 워터마크(투명도 70%) 위에 브랜드 컬러 텍스트. 좌우 무한 루프 마퀴. */
export function HallOfFameCarousel({ items }: { items: HallItem[] }) {
  // 마운트 후 셔플 — SSR과 첫 클라이언트 렌더는 원본 순서로 일치시켜 hydration mismatch 방지
  const [order, setOrder] = useState(items);
  useEffect(() => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    setOrder(shuffled);
  }, [items]);
  if (items.length === 0) return null;
  const doubled = [...order, ...order];
  return (
    <div className="hall-marquee" aria-label="합격 학생">
      <div className="hall-track">
        {doubled.map((it, i) => (
          <figure
            key={`${it.title}-${i}`}
            className="hall-card"
            aria-hidden={i >= items.length}
            style={{ "--hall-c": it.color } as React.CSSProperties}
          >
            <div className="hall-logo" aria-hidden="true">
              <Image
                src={it.image}
                alt=""
                fill
                sizes="(max-width: 680px) 70vw, 320px"
                className="object-contain"
              />
            </div>
            <figcaption>
              <strong>{it.title}</strong>
              <em>{it.dept}</em>
              <span className="hall-line3">
                <b>{it.student}</b>
                {it.course}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
