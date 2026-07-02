# Concord 디자인 적용 — Claude Code 핸드오프

마케팅 페이지 + 모바일 앱에 통일된 디자인 시스템(그린·블루 × 라이트·다크)을 적용하기 위한 패키지입니다.

> ⚠️ **먼저 `IMPLEMENTATION_CONTRACT.md`를 읽으세요.** 디자인이 자꾸 틀어지는(폰트·여백·색·크기) 근본 원인과, 1픽셀도 어긋나지 않게 구현하는 규칙이 담겨 있습니다. 핵심: **CSS를 다시 만들지 말고 그대로 import.**

## 이 패키지 구성
| 파일 | 역할 |
|---|---|
| **`IMPLEMENTATION_CONTRACT.md`** | **★ 가장 먼저 읽을 것.** 드리프트 방지 규칙·폰트 고정·검수 체크리스트 |
| `reference/*.png` | 화면별 **정답 스크린샷**(green-light 전체 + blue-dark 샘플). 구현 결과를 픽셀로 대조 |
| `MOBILE_HANDOFF.md` | 모바일 앱 18화면 흐름·라우트·컴포넌트 매핑 |
| `app/concord-app.css` | **모바일 앱 토큰 + 컴포넌트 (진짜 소스)**. 그대로 import |
| `Concord - 모바일 앱.html` | 모바일 18화면 **구조·마크업 레퍼런스** |
| `site/concord.css` | **웹 토큰 + 컴포넌트 (진짜 소스)**. 색 4조합·간격·타이포·반경·그림자 + 버튼/카드/헤더/요금/강사/FAQ/후기/로그인 |
| `site/concord.js` | 색/다크 토글 + 영속화, 헤더 스크롤, 스크롤 리빌, FAQ 아코디언, 탭 |
| `Pricing.html` `Tutors.html` `FAQ.html` `Reviews.html` `Login.html` | 웹 라우트별 **구조·마크업 레퍼런스** |
| `Concord - Green v2.html` / `Concord - Blue.html` | 홈(랜딩) 레퍼런스 |
| `Concord - 로고 키트.html` | 확정 로고 가이드 |
| `DESIGN_SYSTEM.md` | 토큰 사용 규칙·타이포 위계·접근성·금지사항 |
| `tokens-reference.css` | 토큰만 추린 참고본(웹/앱 공통, RN 포팅 원본) |
| `ROUTE_MAP.md` | 웹 HTML ↔ Next 라우트/컴포넌트 매핑 |
| `CLAUDE_CODE_PROMPT.md` | 그대로 붙여넣을 작업 프롬프트 (PART 1/2) |

## 적용 원칙 (요약)
0. **`IMPLEMENTATION_CONTRACT.md`를 먼저 읽고 그 규칙을 따른다** — 재작성 금지, CSS 그대로 import, 폰트 고정.
1. **`concord.css`/`concord-app.css`의 토큰을 단일 소스로** — `globals.css`(또는 `landing-v2.css`)에 4조합 변수로 이식, Tailwind는 `theme.extend.colors`에서 `var(--…)` 참조.
2. **테마 상태는 `<html data-color data-theme>`** — 기존 localStorage 키 `concord-color` / `concord-mode` 재사용(코드베이스에 이미 존재).
3. **HTML은 그대로 붙이는 게 아니라 구조 레퍼런스** — 기존 React 컴포넌트/CMS 데이터 바인딩은 유지하고, 클래스·마크업 구조와 토큰만 맞춘다.

자세한 토큰·규칙은 `DESIGN_SYSTEM.md`, 라우트 매핑은 `ROUTE_MAP.md`, 작업 지시는 `CLAUDE_CODE_PROMPT.md` 참고.
