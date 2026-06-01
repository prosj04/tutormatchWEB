import type { ReactNode } from "react";

/** 카드 고정 너비 안에서 공간 부족 줄바꿈 대신 한 줄 말줄임 */
export function PublicCardLine({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const title = typeof children === "string" ? children : undefined;

  return (
    <p className={`truncate whitespace-nowrap ${className}`} title={title}>
      {children}
    </p>
  );
}

/** CMS 의도 줄바꿈(\\n)만 허용, 긴 줄은 말줄임 */
export function PublicCardMultiline({
  text,
  lineClassName = "",
}: {
  text: string;
  lineClassName?: string;
}) {
  const lines = text.split("\n");

  return (
    <div className="min-w-0 space-y-1">
      {lines.map((line, index) => (
        <PublicCardLine key={`${index}-${line.slice(0, 24)}`} className={lineClassName}>
          {line}
        </PublicCardLine>
      ))}
    </div>
  );
}
