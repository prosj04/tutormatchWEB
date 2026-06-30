// Single source of truth — paths copied verbatim from design handoff/app/icons.js
// Do not edit paths. Add new icons only with designer approval (24×24, stroke 2, round cap/join).

type IconDef =
  | { kind: "stroke"; sw: number; body: string; vb?: string }
  | { kind: "fill"; body: string; vb?: string };

export const ICONS: Record<string, IconDef> = {
  /* — Navigation — */
  "chevron-left":  { kind: "stroke", sw: 2, body: '<path d="m15 18-6-6 6-6"/>' },
  "chevron-right": { kind: "stroke", sw: 2, body: '<path d="m9 18 6-6-6-6"/>' },
  "arrow-right":   { kind: "stroke", sw: 2, body: '<path d="M5 12h14M12 5l7 7-7 7"/>' },

  /* — Tab bar — */
  "home":     { kind: "stroke", sw: 2, body: '<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"/>' },
  "learning": { kind: "stroke", sw: 2, body: '<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>' },
  "message":  { kind: "stroke", sw: 2, body: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  "user":     { kind: "stroke", sw: 2, body: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },

  /* — Actions / status — */
  "check":        { kind: "stroke", sw: 2.5, body: '<path d="M20 6 9 17l-5-5"/>' },
  "check-circle": { kind: "stroke", sw: 2,   body: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  "trend-up":     { kind: "stroke", sw: 2.4, body: '<path d="M7 17 17 7M9 7h8v8"/>' },
  "send":         { kind: "stroke", sw: 2,   body: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>' },
  "edit":         { kind: "stroke", sw: 2,   body: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' },
  "ai":           { kind: "stroke", sw: 2,   body: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/>' },

  /* — Content / objects — */
  "bell":     { kind: "stroke", sw: 2, body: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>' },
  "card":     { kind: "stroke", sw: 2, body: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
  "calendar": { kind: "stroke", sw: 2, body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
  "report":   { kind: "stroke", sw: 2, body: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>' },
  "file":     { kind: "stroke", sw: 2, body: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>' },
  "lock":     { kind: "stroke", sw: 2, body: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
  "help":     { kind: "stroke", sw: 2, body: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 4 2.8c-.8.4-1.1 1-1.1 2M12 17h.01"/>' },
  "info":     { kind: "stroke", sw: 2, body: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>' },

  /* — Theme toggle — */
  "moon": { kind: "stroke", sw: 2, body: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },
  "sun":  { kind: "stroke", sw: 2, body: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' },

  /* — Brand — */
  "apple": { kind: "fill", body: '<path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1-.02 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.1-.8-2.1-3.2zM14.2 6.2c.6-.7 1-1.7.9-2.7-.9.04-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .07 1.9-.5 2.5-1.2z"/>' },
};

export function icon(
  name: string,
  opts: { size?: number; strokeWidth?: number } = {},
): string {
  const ic = ICONS[name];
  if (!ic) {
    console.warn("[icons] unknown icon:", name);
    return "";
  }
  const size = opts.size ?? 24;
  const vb = ic.vb ?? "0 0 24 24";
  const common = `viewBox="${vb}" width="${size}" height="${size}" aria-hidden="true"`;
  if (ic.kind === "fill") {
    return `<svg ${common} fill="currentColor">${ic.body}</svg>`;
  }
  const sw = opts.strokeWidth ?? ic.sw;
  return `<svg ${common} fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ic.body}</svg>`;
}

export type IconName = keyof typeof ICONS;
