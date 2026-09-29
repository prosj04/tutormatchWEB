export type LegalTocItem = {
  id: string;
  label: string;
};

/**
 * 법률 문서 좌측 목차 (v3 Editorial). 데스크톱에서 sticky, 헤어라인 목록.
 * 스타일은 concord.css `.mk-toc*`.
 */
export function LegalToc({
  items,
  label = "목차",
}: {
  items: LegalTocItem[];
  label?: string;
}) {
  return (
    <nav aria-label={label} className="mk-toc">
      <span className="mk-toc-label">{label}</span>
      <ul className="mk-toc-list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
