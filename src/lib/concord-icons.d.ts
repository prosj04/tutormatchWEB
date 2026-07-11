export type ConcordIconName =
  | "ai"
  | "apple"
  | "arrow-right"
  | "bell"
  | "calendar"
  | "card"
  | "check"
  | "check-circle"
  | "chevron-left"
  | "chevron-right"
  | "edit"
  | "file"
  | "help"
  | "home"
  | "info"
  | "learning"
  | "lock"
  | "message"
  | "moon"
  | "report"
  | "sb-battery"
  | "sb-signal"
  | "sb-wifi"
  | "send"
  | "sun"
  | "trend-up"
  | "user";

export const ICONS: Record<
  ConcordIconName,
  { kind: "stroke" | "fill"; sw?: number; vb?: string; body: string }
>;

export function icon(
  name: ConcordIconName,
  opts?: { size?: number; strokeWidth?: number },
): string;
