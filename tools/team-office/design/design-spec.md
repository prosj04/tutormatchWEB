# Concord War Room — Design Spec

## Palette

`#101820` void navy · `#303946` gunmetal · `#738092` steel · `#d2e5d8` paper light · `#d39b6d` skin · `#38482e` field olive · `#566b3e` olive highlight · `#73b9d4` signal blue · `#64c6bb` signal teal · `#9ccf72` ready green · `#c6923b` command gold · `#b56635` radio orange · `#954349` alert red · `#72508d` strategy purple

## UI notes

- Use `ui-monospace, "SFMono-Regular", "Cascadia Code", "Noto Sans Mono KR", "Noto Sans KR", monospace`; Korean must fall through to Noto Sans Mono KR/Noto Sans KR.
- **Comm-log radio panel:** gunmetal field, 1px steel frame, 2–3px scanline bands at low opacity, teal or blue signal text, and a tiny amber transmit LED.
- **Task chips:** `pending` = steel/ink, `in_progress` = command gold/ink, `completed` = ready green/ink. Keep square corners and a 1px dark outline.
- **Speech bubbles:** paper-light fill, 2px dark pixel outline, 4px stepped tail aimed at the speaker; headings in command gold or accent color.
- **Meeting banner:** full-width olive strip with a command-gold top rule; include a compact status lamp and all-caps monospace title such as `WAR ROOM // DAILY SYNC`.
- Render sprites at integer multiples only (2×, 3×, 4×) with `image-rendering: pixelated`; preserve hard edges and avoid gradients, blur, or rounded cards.
