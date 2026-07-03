import type { CSSProperties } from "react";

export type LegalTocItem = {
  id: string;
  label: string;
};

const wrapStyle: CSSProperties = {
  marginTop: 24,
  padding: "16px 18px",
  border: "1px solid var(--line)",
  borderRadius: 12,
  background: "var(--panel-2, var(--panel))",
};

const headingStyle: CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--mut)",
  marginBottom: 10,
};

const listStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "6px 16px",
};

const linkStyle: CSSProperties = {
  display: "block",
  padding: "6px 0",
  fontSize: "0.92rem",
  color: "var(--fg)",
  textDecoration: "none",
  lineHeight: 1.5,
};

export function LegalToc({
  items,
  label = "목차",
}: {
  items: LegalTocItem[];
  label?: string;
}) {
  return (
    <nav aria-label={label} style={wrapStyle}>
      <div style={headingStyle}>{label}</div>
      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} style={linkStyle}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
