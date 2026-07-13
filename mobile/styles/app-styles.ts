import type { TextStyle } from "react-native";
/**
 * concord-app.css → React Native 1:1 이식
 * ⚠️ 이 파일의 값은 concord-app.css에서 그대로 복사한 것입니다.
 *    임의로 수정하지 마세요. CSS 값과 동기화를 유지합니다.
 *
 * 변환 규칙:
 *   letter-spacing em → pt  : value * fontSize (소수점 2자리 반올림)
 *   line-height ratio → pt  : ratio * fontSize
 *   shadow (multi) → 단일   : 더 강한 쪽(두 번째 레이어) 사용
 *   tabular-nums            : fontVariant: ['tabular-nums']
 */

// ─── 폰트 패밀리 (weight 별 파일 매핑) ───────────────────────────────────────
export const font = {
  regular:   "Pretendard-Regular",    // 400
  medium:    "Pretendard-Medium",     // 500
  semibold:  "Pretendard-SemiBold",   // 600
  bold:      "Pretendard-Bold",       // 700
  extrabold: "Pretendard-ExtraBold",  // 800
} as const;

// ─── 그림자 (shadow-color는 사용처에서 theme 값으로 지정) ─────────────────────
// --shadow-sm: 0 1px 2px rgba(…,.05), 0 3px 10px rgba(…,.06)
export const shadowSm = {
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 10,
  shadowOpacity: 0.06,
  elevation: 3,
} as const;

// --shadow-md: 0 10px 24px rgba(…,.09), 0 22px 50px rgba(…,.09)
export const shadowMd = {
  shadowOffset: { width: 0, height: 10 },
  shadowRadius: 24,
  shadowOpacity: 0.09,
  elevation: 12,
} as const;

// ─── 공통 컨테이너 ────────────────────────────────────────────────────────────

// .scroll (본문 스크롤 영역 기본 패딩)
export const scroll = {
  paddingHorizontal: 18,
  paddingTop: 8,
  paddingBottom: 18,
} as const;

// ─── 앱바 (.appbar) ───────────────────────────────────────────────────────────
// .appbar { display:flex; align-items:center; gap:12; padding:8px 2px 16px; }
export const appbar = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 2,
  },
  // .appbar .hi { font-size:12; font-weight:600; }
  hi: {
    fontSize: 12,
    fontFamily: font.semibold,
  },
  // .appbar .nm { font-size:19; font-weight:800; letter-spacing:-.03em; margin-top:1; }
  nm: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.57,  // -0.03 * 19
    marginTop: 1,
  },
  // .appbar .av { width:42; height:42; border-radius:21; font-weight:700; font-size:15; }
  av: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: font.bold,
    fontSize: 15,
  },
} as const;

// .iconbtn { width:40; height:40; border-radius:12; border:1px; }
export const iconbtn = {
  width: 40,
  height: 40,
  borderRadius: 12,
  borderWidth: 1,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  position: "relative" as const,
};

// .iconbtn .badge { top:7; right:8; width:8; height:8; border-radius:4; }
export const iconbtnBadge = {
  position: "absolute" as const,
  top: 7,
  right: 8,
  width: 8,
  height: 8,
  borderRadius: 4,
};

// ─── 카드 (.card) ─────────────────────────────────────────────────────────────
// .card { background:panel; border:1px solid line; border-radius:20; box-shadow:shadow-sm; }
export const card = {
  borderWidth: 1,
  borderRadius: 20,
  ...shadowSm,
} as const;

// .sect-t { font-size:14; font-weight:700; letter-spacing:-.02em; margin:20px 2px 11px; }
export const sectT = {
  fontSize: 14,
  fontFamily: font.bold,
  letterSpacing: -0.28,  // -0.02 * 14
  marginTop: 20,
  marginBottom: 11,
  marginHorizontal: 2,
  flexDirection: "row" as const,
  alignItems: "center" as const,
} as const;

// ─── 오늘 수업 카드 (.now) ────────────────────────────────────────────────────
// .now { padding:18; border-radius:22; }
export const now = {
  wrap: {
    padding: 18,
    borderRadius: 22,
  },
  // .now .k { font-size:11.5; font-weight:700; letter-spacing:.08em; text-transform:uppercase; opacity:.85; }
  k: {
    fontSize: 11.5,
    fontFamily: font.bold,
    letterSpacing: 0.92,   // 0.08 * 11.5
    textTransform: "uppercase" as const,
    opacity: 0.85,
  },
  // .now .row { flex-direction:row; align-items:center; gap:12; margin-top:12; }
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginTop: 12,
  },
  // .now .av { width:46; height:46; border-radius:14; font-weight:800; font-size:16; }
  av: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: font.extrabold,
    fontSize: 16,
  },
  // .now .nm { font-size:17; font-weight:800; letter-spacing:-.02em; }
  nm: {
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: -0.34,  // -0.02 * 17
  },
  // .now .meta { font-size:13; opacity:.9; margin-top:1; }
  meta: {
    fontSize: 13,
    opacity: 0.9,
    marginTop: 1,
  },
  // .now .when { margin-left:auto; align-items:flex-end; gap:3; }
  when: {
    marginLeft: "auto" as const,
    alignItems: "flex-end" as const,
    gap: 3,
  },
  // .now .when .wd { font-size:12.5; font-weight:700; opacity:.92; }
  wd: {
    fontSize: 12.5,
    fontFamily: font.bold,
    opacity: 0.92,
  },
  // .now .when .wt { font-size:22; font-weight:800; letter-spacing:-.01em; tabular-nums; line-height:1; }
  wt: {
    fontSize: 22,
    fontFamily: font.extrabold,
    letterSpacing: -0.22,  // -0.01 * 22
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
    lineHeight: 22,        // line-height:1
  },
  // .now .go { margin-top:16; width:100%; padding:13; border-radius:13; font-weight:800; font-size:15; }
  go: {
    marginTop: 16,
    width: "100%" as const,
    padding: 13,
    borderRadius: 13,
    fontFamily: font.extrabold,
    fontSize: 15,
    textAlign: "center" as const,
  },
  // .now-foot { margin-top:14; padding-top:13; border-top:1px solid rgba(255,255,255,.22); font-size:13; opacity:.92; }
  foot: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
    fontSize: 13,
    opacity: 0.92,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 7,
  },
} as const;

// ─── 빠른 실행 (.qa) ──────────────────────────────────────────────────────────
// .qa { grid 4cols; gap:9; }  .qa button { border-radius:16; padding:13 6 11; gap:7; }
export const qa = {
  grid: {
    flexDirection: "row" as const,
    gap: 9,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: 13,
    paddingHorizontal: 6,
    paddingBottom: 11,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 7,
    ...shadowSm,
  },
  // .qa .ic { width:34; height:34; border-radius:11; }
  ic: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .qa span { font-size:11; font-weight:600; }
  label: {
    fontSize: 11,
    fontFamily: font.semibold,
  },
} as const;

// ─── 진행률 링 (.ring-card / .ring) ──────────────────────────────────────────
// .ring-card { flex-row; align-items:center; gap:16; padding:16 18; }
export const ringCard = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  // .ring { width:74; height:74; border-radius:37; }
  ring: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  // .ring i { width:56; height:56; border-radius:28; font-weight:800; font-size:17; }
  inner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: font.extrabold,
    fontSize: 17,
  },
  // .ring-card .t b { font-size:15; font-weight:700; letter-spacing:-.02em; }
  tb: {
    fontSize: 15,
    fontFamily: font.bold,
    letterSpacing: -0.30,  // -0.02 * 15
  },
  // .ring-card .t p { font-size:12.5; margin-top:3; }
  tp: {
    fontSize: 12.5,
    marginTop: 3,
  },
} as const;

// ─── 리스트 행 (.lrow) ────────────────────────────────────────────────────────
// .lrow { flex-row; align-items:center; gap:12; padding:13 16; }
export const lrow = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  // .lrow .av { width:42; height:42; border-radius:12; font-weight:700; font-size:14; }
  av: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: font.bold,
    fontSize: 14,
  },
  g: { flex: 1, minWidth: 0 },
  // .lrow .g b { font-size:14; font-weight:700; letter-spacing:-.01em; }
  gb: {
    fontSize: 14,
    fontFamily: font.bold,
    letterSpacing: -0.14,  // -0.01 * 14
  },
  // .lrow .g p { font-size:12.5; margin-top:2; }
  gp: {
    fontSize: 12.5,
    marginTop: 2,
  },
  // .lrow .r { text-align:right; font-size:12.5; tabular-nums; }
  r: {
    textAlign: "right" as const,
    fontSize: 12.5,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
  },
  // .lrow .chev { color:mut-2; }
  chev: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
} as const;

// ─── 서브페이지 헤더 (.sub-head) ──────────────────────────────────────────────
// .sub-head { flex-row; align-items:center; gap:12; padding:6px 2px 16px; }
export const subHead = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 2,
  },
  // .pf-back { width:40; height:40; border-radius:12; border:1px; }
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .sub-head b { font-size:17; font-weight:800; letter-spacing:-.025em; }
  title: {
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: -0.43,  // -0.025 * 17
  },
  // .sub-head .act { margin-left:auto; font-size:13; font-weight:600; }
  act: {
    marginLeft: "auto" as const,
    fontSize: 13,
    fontFamily: font.semibold,
  },
} as const;

// ─── 단계 표시 (.steps) ───────────────────────────────────────────────────────
// .steps { flex-row; align-items:center; gap:6; padding:2px 2px 16px; }
export const steps = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingTop: 2,
    paddingBottom: 16,
    paddingHorizontal: 2,
  },
  // .steps i { height:4; border-radius:2; flex:1; }
  bar: { height: 4, borderRadius: 2, flex: 1 },
} as const;

// ─── 폼 필드 (.field / .inp / .opt) ──────────────────────────────────────────
export const field = {
  // .field { margin-bottom:16; }
  wrap: { marginBottom: 16 },
  // .field > label { font-size:13; font-weight:700; margin-bottom:9; letter-spacing:-.01em; }
  label: {
    fontSize: 13,
    fontFamily: font.bold,
    marginBottom: 9,
    letterSpacing: -0.13,  // -0.01 * 13
  },
  // .field .inp { width:100%; padding:13 15; border-radius:13; border:1px; font-size:14; }
  inp: {
    width: "100%" as const,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    fontSize: 14,
    ...shadowSm,
  },
} as const;

// .opt { padding:10 15; border-radius:12; border:1px; font-size:13.5; font-weight:600; }
export const opt = {
  base: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13.5,
    fontFamily: font.semibold,
  },
} as const;

// ─── CTA 하단 바 (.cta-bar) ───────────────────────────────────────────────────
export const ctaBar = {
  // .cta-bar { padding:14px 18px 26px; border-top:1px; }
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 26,
    borderTopWidth: 1,
  },
  // .cta-bar button { width:100%; padding:16; border-radius:15; font-weight:800; font-size:16; }
  btn: {
    width: "100%" as const,
    padding: 16,
    borderRadius: 15,
    fontFamily: font.extrabold,
    fontSize: 16,
    textAlign: "center" as const,
  },
  // .cta-bar .sub { text-align:center; font-size:12; margin-bottom:10; }
  sub: {
    textAlign: "center" as const,
    fontSize: 12,
    marginBottom: 10,
  },
} as const;

// ─── 학습 바 차트 (.bars) ─────────────────────────────────────────────────────
// .bars { flex-row; align-items:flex-end; gap:9; height:96; padding:14 16 0; }
export const bars = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 9,
    height: 96,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  // .bars .b { flex:1; flex-col; align-items:center; gap:7; height:100%; justify:flex-end; }
  col: {
    flex: 1,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 7,
    height: "100%" as const,
    justifyContent: "flex-end" as const,
  },
  // .bars .b i { width:100%; border-radius:6 6 3 3; }
  fill: {
    width: "100%" as const,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  // .bars .b span { font-size:10.5; }
  label: { fontSize: 10.5 },
} as const;

// ─── 할일 목록 (.todo / .titem / .ck) ────────────────────────────────────────
export const todo = {
  // .todo { padding:6 4; }
  wrap: { paddingVertical: 6, paddingHorizontal: 4 },
  // .titem { flex-row; align-items:center; gap:12; padding:11 12; }
  item: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  // .ck { width:22; height:22; border-radius:7; border:2px; }
  ck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .titem .g b { font-size:13.5; font-weight:600; }
  gb: { fontSize: 13.5, fontFamily: font.semibold },
  // .titem .g p { font-size:11.5; margin-top:1; }
  gp: { fontSize: 11.5, marginTop: 1 },
} as const;

// ─── 토큰 카드 (.tok) ─────────────────────────────────────────────────────────
// .tok { flex-row; align-items:center; gap:11; padding:15 16; }
export const tok = {
  wrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 11,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  // .tok .ic { width:38; height:38; border-radius:12; }
  ic: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .tok b { font-size:14; font-weight:700; }
  b: { fontSize: 14, fontFamily: font.bold },
  // .tok p { font-size:12; }
  p: { fontSize: 12 },
  // .tok .n { margin-left:auto; font-size:19; font-weight:800; tabular-nums; }
  n: {
    marginLeft: "auto" as const,
    fontSize: 19,
    fontFamily: font.extrabold,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
  },
} as const;

// ─── 채팅 (.chat-head / .msg / .composer) ────────────────────────────────────
export const chat = {
  // .chat-head { flex-row; align-items:center; gap:11; padding:6px 2px 14px; }
  head: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 11,
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 2,
  },
  // .chat-head .av { width:40; height:40; border-radius:12; font-weight:700; }
  headAv: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: font.bold,
  },
  // .chat-head b { font-size:15; font-weight:800; letter-spacing:-.02em; }
  headNm: {
    fontSize: 15,
    fontFamily: font.extrabold,
    letterSpacing: -0.30,  // -0.02 * 15
  },
  // .chat-head p { font-size:12; font-weight:600; }
  headSub: { fontSize: 12, fontFamily: font.semibold },
  // .msg { max-width:80%; padding:11 14; border-radius:16; font-size:13.5; line-height:20.25; margin-bottom:9; }
  msg: {
    maxWidth: "80%" as const,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 13.5,
    lineHeight: 20,          // 1.5 * 13.5 = 20.25 → 20
    marginBottom: 9,
  },
  // .msg.them { border:1px; border-bottom-left-radius:5; }
  them: { borderWidth: 1, borderBottomLeftRadius: 5 },
  // .msg.me { border-bottom-right-radius:5; margin-left:auto; }
  me: { borderBottomRightRadius: 5, alignSelf: "flex-end" as const },
  // .msg.ai { border:1px; border-bottom-left-radius:5; }
  ai: { borderWidth: 1, borderBottomLeftRadius: 5 },
  // .msg.ai .tag { font-size:10; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
  aiTag: {
    fontSize: 10,
    fontFamily: font.extrabold,
    letterSpacing: 0.60,     // 0.06 * 10
    textTransform: "uppercase" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    marginBottom: 5,
  },
  // .daysep { text-align:center; font-size:11; margin:4 0 12; }
  daysep: {
    textAlign: "center" as const,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  // .composer { flex-row; align-items:center; gap:9; padding:11 16 24; border-top:1px; }
  composer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  // .composer .in { flex:1; padding:11 15; border-radius:999; border:1px; font-size:13.5; }
  composerIn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 13.5,
  },
  // .composer .snd { width:42; height:42; border-radius:21; }
  composerSnd: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .qbar { flex-row; gap:7; padding:9 13; margin-bottom:12; border-radius:12; font-size:12; font-weight:600; }
  qbar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 12,
    fontFamily: font.semibold,
  },
  // .resolve { border:1px; border-radius:16; padding:14; margin-bottom:9; }
  resolve: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 9,
    ...shadowSm,
  },
  // .resolve p { font-size:12.5; font-weight:600; text-align:center; margin-bottom:11; }
  resolveP: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    textAlign: "center" as const,
    marginBottom: 11,
  },
  // .resolve button { flex:1; padding:11; border-radius:11; font-weight:700; font-size:13; }
  resolveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    fontFamily: font.bold,
    fontSize: 13,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  // .sysnote { flex-row; justify:center; gap:7; font-size:11.5; font-weight:600; margin:2 0 12; }
  sysnote: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
    fontSize: 11.5,
    fontFamily: font.semibold,
    marginTop: 2,
    marginBottom: 12,
  },
  // .pending { flex-row; gap:11; padding:13 15; border-radius:16; border:1px dashed; margin-bottom:9; }
  pending: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 9,
  },
  // .composer.ask-only { flex-col; align:stretch; gap:7; }
  composerAskOnly: {
    flexDirection: "column" as const,
    alignItems: "stretch" as const,
    gap: 7,
  },
  // .composer .dep-note { font-size:11; font-weight:600; text-align:center; }
  depNote: {
    fontSize: 11,
    fontFamily: font.semibold,
    textAlign: "center" as const,
  },
  // .composer .ask-btn { width:100%; padding:13; border-radius:13; font-weight:700; font-size:14; }
  askBtn: {
    width: "100%" as const,
    paddingVertical: 13,
    borderRadius: 13,
    fontFamily: font.bold,
    fontSize: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
  },
} as const;

// ─── 인증 (.auth) ─────────────────────────────────────────────────────────────
export const auth = {
  // .auth { position:absolute; inset:0; flex-col; padding:0 26px 28px; }
  wrap: {
    flex: 1,
    flexDirection: "column" as const,
    paddingHorizontal: 26,
    paddingBottom: 28,
  },
  topSp: { height: 42 },
  // .auth .brand { flex-col; align-items:center; gap:14; padding:30px 0 26px; }
  brand: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 14,
    paddingTop: 30,
    paddingBottom: 26,
  },
  // .auth .brand .icon { width:64; height:64; border-radius:20; }
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .auth h2 { font-size:22; font-weight:800; letter-spacing:-.03em; text-align:center; }
  h2: {
    fontSize: 22,
    fontFamily: font.extrabold,
    letterSpacing: -0.66,   // -0.03 * 22
    textAlign: "center" as const,
  },
  // .auth .sub { font-size:13.5; text-align:center; margin-top:7; }
  sub: { fontSize: 13.5, textAlign: "center" as const, marginTop: 7 },
  mid: { flex: 1, justifyContent: "center" as const },
  // .auth .forgot { text-align:right; font-size:12.5; font-weight:600; margin-top:-6; }
  forgot: {
    textAlign: "right" as const,
    fontSize: 12.5,
    fontFamily: font.semibold,
    marginTop: -6,
  },
  // .auth .p1 { width:100%; padding:15; border-radius:14; font-weight:800; font-size:15; margin-top:6; }
  p1: {
    width: "100%" as const,
    paddingVertical: 15,
    borderRadius: 14,
    fontFamily: font.extrabold,
    fontSize: 15,
    marginTop: 6,
    textAlign: "center" as const,
  },
  // .auth .divider { flex-row; align-items:center; gap:12; margin:20 0; font-size:12; font-weight:600; }
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginVertical: 20,
    fontSize: 12,
    fontFamily: font.semibold,
  },
  dividerLine: { flex: 1, height: 1 },
  // .sbtn { width:100%; padding:13; border-radius:13; border:1px; font-weight:700; font-size:14; }
  sbtn: {
    width: "100%" as const,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    fontFamily: font.bold,
    fontSize: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 9,
  },
  // .auth .foot { text-align:center; font-size:13; padding-top:18; }
  foot: { textAlign: "center" as const, fontSize: 13, paddingTop: 18 },
  // .auth .agree { font-size:11.5; text-align:center; line-height:18.4; margin-top:14; }
  agree: {
    fontSize: 11.5,
    textAlign: "center" as const,
    lineHeight: 18,         // 1.6 * 11.5 = 18.4
    marginTop: 14,
  },
} as const;

// ─── 상태/완료 화면 (.status) ─────────────────────────────────────────────────
export const status = {
  // .status { flex-col; align-items:center; justify:center; text-align:center; padding:0 32px; gap:20; }
  wrap: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 32,
    gap: 20,
  },
  // .status .emblem { width:96; height:96; border-radius:48; }
  emblem: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .status h2 { font-size:23; font-weight:800; letter-spacing:-.03em; line-height:1.3; }
  h2: {
    fontSize: 23,
    fontFamily: font.extrabold,
    letterSpacing: -0.69,   // -0.03 * 23
    lineHeight: 30,          // 1.3 * 23 = 29.9
    textAlign: "center" as const,
  },
  // .status p { font-size:14; max-width:32ch; line-height:1.6; }
  p: {
    fontSize: 14,
    lineHeight: 22,          // 1.6 * 14 = 22.4
    textAlign: "center" as const,
  },
  // .status .meta-card { width:100%; border:1px; border-radius:16; padding:16; }
  metaCard: {
    width: "100%" as const,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    ...shadowSm,
  },
  // .status .meta-card .ln { flex-row; align-items:center; font-size:13; padding:6 0; }
  metaLn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    fontSize: 13,
    paddingVertical: 6,
  },
  // .stepv .nub { width:26; height:26; border-radius:13; font-size:12; font-weight:800; }
  stepvNub: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 12,
    fontFamily: font.extrabold,
  },
  // .stepv .line { width:2; flex:1; min-height:18; }
  stepvLine: { width: 2, flex: 1, minHeight: 18 },
  // .stepv .tx b { font-size:14; font-weight:700; }
  stepvTxB: { fontSize: 14, fontFamily: font.bold },
  // .stepv .tx p { font-size:12; margin-top:2; }
  stepvTxP: { fontSize: 12, marginTop: 2 },
  // .stepv .tx { padding-bottom:18; }
  stepvTx: { paddingBottom: 18 },
} as const;

// ─── MY 페이지 (.my-top / .mrow) ─────────────────────────────────────────────
export const my = {
  // .my-top { flex-row; align-items:center; gap:14; padding:8 4 18; }
  top: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 4,
  },
  // .my-av { width:60; height:60; border-radius:18; font-size:22; font-weight:800; }
  av: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 22,
    fontFamily: font.extrabold,
  },
  // .my-top .nm { font-size:19; font-weight:800; letter-spacing:-.02em; }
  nm: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.38,   // -0.02 * 19
  },
  // .my-top .sub { font-size:13; margin-top:2; }
  sub: { fontSize: 13, marginTop: 2 },
  // .mrow { flex-row; align-items:center; gap:13; padding:15 16; }
  mrow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  // .mrow .ic { width:36; height:36; border-radius:11; }
  mrowIc: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .mrow .g b { font-size:14.5; font-weight:600; }
  mrowGb: { fontSize: 14.5, fontFamily: font.semibold },
  // .mrow .g p { font-size:12; margin-top:1; }
  mrowGp: { fontSize: 12, marginTop: 1 },
} as const;

// ─── 알림 행 (.nrow / .ncat) ─────────────────────────────────────────────────
export const notif = {
  // .nrow { flex-row; gap:12; padding:14 16; }
  row: {
    flexDirection: "row" as const,
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // .nrow .ic { width:38; height:38; border-radius:12; }
  ic: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  g: { flex: 1, minWidth: 0 },
  // .nrow .g b { font-size:13.5; font-weight:700; }
  gb: { fontSize: 13.5, fontFamily: font.bold },
  // .nrow .g p { font-size:12.5; margin-top:2; line-height:1.45; }
  gp: { fontSize: 12.5, marginTop: 2, lineHeight: 18 },  // 1.45*12.5=18.125
  // .nrow .g .tm { font-size:11; margin-top:5; }
  tm: { fontSize: 11, marginTop: 5 },
  // .nrow .ud { width:8; height:8; border-radius:4; margin-top:6; }
  ud: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  // .ncat { padding:11 16 7; font-size:11; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
  cat: {
    paddingTop: 11,
    paddingBottom: 7,
    paddingHorizontal: 16,
    fontSize: 11,
    fontFamily: font.extrabold,
    letterSpacing: 0.66,    // 0.06 * 11
    textTransform: "uppercase" as const,
  },
} as const;

// ─── 플랜 카드 / 구독 (.plan-now / .plan-pick) ────────────────────────────────
export const plan = {
  // .plan-now { padding:20; border-radius:22; }
  now: { padding: 20, borderRadius: 22 },
  // .plan-now .k { font-size:11.5; font-weight:700; letter-spacing:.08em; text-transform:uppercase; opacity:.85; }
  nowK: {
    fontSize: 11.5,
    fontFamily: font.bold,
    letterSpacing: 0.92,    // 0.08 * 11.5
    textTransform: "uppercase" as const,
    opacity: 0.85,
  },
  // .plan-now .nm { font-size:24; font-weight:800; letter-spacing:-.025em; margin-top:8; }
  nowNm: {
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.60,   // -0.025 * 24
    marginTop: 8,
  },
  // .plan-now .pr { font-size:14; opacity:.92; margin-top:4; tabular-nums; }
  nowPr: {
    fontSize: 14,
    opacity: 0.92,
    marginTop: 4,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
  },
  // .plan-now .nx { margin-top:16; padding-top:14; border-top:1px rgba(255,255,255,.22); flex-row; font-size:13; }
  nowNx: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    fontSize: 13,
  },
  // .plan-pick { border:1.5px; border-radius:20; padding:18; margin-bottom:12; }
  pick: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    ...shadowSm,
  },
  // .plan-pick .nm { font-size:17; font-weight:800; letter-spacing:-.02em; }
  pickNm: {
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: -0.34,   // -0.02 * 17
  },
  // .plan-pick .radio { width:22; height:22; border-radius:11; border:2px; }
  pickRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  // .plan-pick .pr { font-size:24; font-weight:800; letter-spacing:-.03em; margin-top:10; tabular-nums; }
  pickPr: {
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.72,   // -0.03 * 24
    marginTop: 10,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
  },
  // .plan-pick .unit { font-size:12.5; margin-top:2; }
  pickUnit: { fontSize: 12.5, marginTop: 2 },
  // .plan-pick .fl { margin-top:13; padding-top:13; border-top:1px; gap:8; }
  pickFl: { marginTop: 13, paddingTop: 13, borderTopWidth: 1, gap: 8 },
  // .plan-pick .fl div { flex-row; gap:9; align-items:baseline; font-size:12.5; }
  pickFlItem: {
    flexDirection: "row" as const,
    gap: 9,
    alignItems: "baseline" as const,
    fontSize: 12.5,
  },
} as const;

// ─── 추천 강사 카드 (.rec-card / .match-badge) ────────────────────────────────
export const rec = {
  // .rec-card { padding:16; margin-top:11; }
  card: { padding: 16, marginTop: 11 },
  // .rec-card .ph { width:58; height:58; border-radius:16; border:1px; }
  ph: { width: 58, height: 58, borderRadius: 16, borderWidth: 1 },
  // .rec-card .vb { bottom:-5; right:-5; width:22; height:22; border-radius:11; }
  vb: {
    position: "absolute" as const,
    bottom: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // .rec-card .nm { font-size:16; font-weight:800; letter-spacing:-.02em; }
  nm: {
    fontSize: 16,
    fontFamily: font.extrabold,
    letterSpacing: -0.32,   // -0.02 * 16
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 7,
  },
  // .rec-card .edu { font-size:12.5; margin-top:3; }
  edu: { fontSize: 12.5, marginTop: 3 },
  // .rec-card .why { margin-top:13; padding:12 13; border-radius:12; font-size:12.5; line-height:19; }
  why: {
    marginTop: 13,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 12,
    fontSize: 12.5,
    lineHeight: 19,         // 1.55 * 12.5 = 19.375
  },
  // .match-badge { flex-row; align-items:center; gap:6; font-size:12; font-weight:800; padding:7 13; border-radius:999; }
  badge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    fontSize: 12,
    fontFamily: font.extrabold,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
  },
} as const;

// ─── 스위치 (.switch) ─────────────────────────────────────────────────────────
// .switch { width:42; height:25; border-radius:999; }
// .switch i { top:2.5; left:2.5; width:20; height:20; border-radius:10; }
export const switchStyle = {
  track: { width: 42, height: 25, borderRadius: 999 },
  thumb: {
    position: "absolute" as const,
    top: 2.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
} as const;
