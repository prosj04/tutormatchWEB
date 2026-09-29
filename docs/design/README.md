# 디자인 문서 (docs/design/)

## 현행 — v3 "Editorial" (2026-09-30~)

| 문서 | 성격 |
|---|---|
| [DESIGN_SYSTEM_V3.md](DESIGN_SYSTEM_V3.md) | **사양 정본** — 방향·토큰·타이포·레이아웃·형태·컴포넌트 어휘·모션·금지 |
| `src/app/ds.css` | **구현 정본** — 전역 단일 스타일시트. 코드와 스펙이 어긋나면 코드가 현실, 스펙이 의도 |
| [`../adr/0002-editorial-redesign.md`](../adr/0002-editorial-redesign.md) | 결정 배경 · v2 대체 조항 대조표 · 롤백 방법 |
| [REDESIGN_2026-09-30.md](REDESIGN_2026-09-30.md) | 개편 기록 — 범위·Dribbble 레퍼런스·검증·미확인·오너 결정 사안 + 페이지별 인벤토리(라우트·컴포넌트·API·보존 기능·변경점) |
| [`../BUSINESS_DIRECTION.md`](../BUSINESS_DIRECTION.md) §7·§13 | 헌법 — 디자인 원칙과 미학 사전. 스펙과 충돌하면 헌법이 우선 |

진행 상태: 구현·빌드·눈 검증 완료(2026-09-30). 브랜치 `feat/editorial-redesign`, `main` 미병합 — 오너 확인 후 병합.

## 이력 — v2 그린/블루 핸드오프 (2026-07 ~ 2026-09-29)

외주 디자이너 핸드오프 패키지. ADR 0002 로 대체됐고 **삭제하지 않고 전량 보존**한다 — 롤백 자산이다.

보관 위치: [`../archive/design-handoff-v2/`](../archive/design-handoff-v2/)

| 보관 문서 | 내용 |
|---|---|
| `DESIGN_SYSTEM.md` | v2 토큰·타이포·컴포넌트 |
| `FRONTEND_BUILD_SPEC.md` | v2 프론트엔드 재구축 명세 (최장본) |
| `IMPLEMENTATION_CONTRACT.md` | 구현 계약 — 무엇을 재현하고 무엇을 바꾸지 않는가 |
| `ROUTE_MAP.md` | 시안 ↔ 라우트 매핑 |
| `MOBILE_HANDOFF.md` | 모바일 이식 지침 |
| `DESIGN_REQUEST_TO_DESIGNER.md` · `DESIGN_REQUEST_V2.md` · `CLAUDE_CODE_PROMPT.md` | 발주서·구현 프롬프트 |
| `Concord - *.html` 20종 · `FAQ/Login/Pricing/Reviews/Tutors.html` | 시안 원본 |
| `app/concord-app.css` · `app/icons.js` · `site/concord.css` · `site/concord.js` · `tokens-reference.css` | v2 CSS·아이콘 원본 |
| `reference/*.png` | 그린 라이트 / 블루 다크 레퍼런스 샷 |

`src/lib/icons.ts` 와 `mobile/components/teacher/TeacherIcons.tsx` 의 path 는 이 패키지의 `app/icons.js` 에서 이식된 것이며, 두 파일의 출처 주석은 2026-09-30 보관 경로(`docs/archive/design-handoff-v2/app/icons.js`)로 갱신했다.

그 외 v2 이전 디자인 기록: `../archive/design-direction.md`(방향 정의서) · `../archive/design-review-2026-07.md` · `../archive/HOMEPAGE_REDESIGN_2026-07.md` · `../archive/ux-audit-handoff.md`. 감사·개선 항목의 통합본은 [`../30-제품·디자인.md`](../30-제품·디자인.md).

## 스크린샷

`docs/app-screenshots/{역할}/{desktop|mobile}/*.png` — `concord-deck` 스킬과 덱 HTML 이 상대경로로 직접 참조하므로 **이동·개명 금지**.

⚠️ **2026-09-30 재촬영 현황** — v3 개편 후 프로덕션 빌드(`next start`)에서 기존 규격(데스크톱 1440×900 · 모바일 390×844, @2x 뷰포트 캡처)으로 **74장을 다시 찍었다**(스크립트 `/tmp/redesign/docshots.mjs` 방식 — 로컬 dev 세션 쿠키, 실DB 읽기 전용).

| 상태 | 파일 |
|---|---|
| **개편 후(74)** | `public/*` 22장(홈·요금·강사진·후기·FAQ·로그인·가입·강사 가입·약관 3종) · `teacher/*/tp-landing`·`tp-apply` 4장 · `student/*/dashboard`·`dashboard-account`·`questions`·`notifications`·`payments` 10장 · `admin/*` 22장 · `chief/*` 4장 · `manager/*` 12장(치프매니저 계정으로 촬영 — 사이드바 역할 표기 MANAGER 동일) |
| **개편 전 그대로(24)** | `public/*/tutor-detail` — `/tutors/[id]` 가 `/tutors` 로 리다이렉트되는 스텁이라 재현 대상 없음 · `student/*/state-matching`·`state-pending-accept`·`state-first-lesson`·`dashboard-consultation`·`checkout` — 해당 여정 상태의 학생 계정이 없어 DB 쓰기 없이는 재현 불가 · `teacher/*/tp-dashboard`·`tp-students`·`tp-consultations`·`tp-matching`·`tp-monitoring`·`tp-profile` — DB 에 TEACHER 역할 계정이 없음 |

개편 전 24장은 오너 실촬영(또는 테스트 계정 준비 후 재촬영) 전까지 덱·가이드에 "현행 화면"으로 제시하지 않는다.
