import { icon, type ConcordIconName } from "@/lib/concord-icons";

/**
 * Concord 아이콘 — 단일 소스(src/lib/concord-icons.js, 핸드오프 원본)에서
 * 이름으로 호출한다. 새 아이콘 생성·타 라이브러리 대체 금지(계약서 §3b).
 */
export function ConcordIcon({
  name,
  size,
  strokeWidth,
  className,
}: {
  name: ConcordIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: "inline-flex", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: icon(name, { size, strokeWidth }) }}
    />
  );
}
