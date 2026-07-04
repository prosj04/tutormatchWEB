import type { ReactNode } from "react";
import { ConcordReveal } from "@/components/concord/ConcordReveal";

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
      <div className="bg" />
      <ConcordReveal className="wrap inner" as="div">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </ConcordReveal>
    </section>
  );
}
