import Image from "next/image";

export type HallItem = { image: string; title: string; sub: string };

/** 합격 인터뷰 카드 — 좌우 무한 루프 마퀴 캐러셀 (호버 시 일시정지) */
export function HallOfFameCarousel({ items }: { items: HallItem[] }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="hall-marquee" aria-label="합격 인터뷰">
      <div className="hall-track">
        {doubled.map((it, i) => (
          <figure key={`${it.title}-${i}`} className="hall-card" aria-hidden={i >= items.length}>
            <Image
              src={it.image}
              alt={i < items.length ? `${it.title} 인터뷰` : ""}
              fill
              sizes="(max-width: 680px) 70vw, 320px"
              className="object-cover"
            />
            <figcaption>
              <strong>{it.title}</strong>
              <span>{it.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
