# ROUTE_MAP — HTML 시안 ↔ Next.js 라우트/컴포넌트

핸드오프 문서(`CLAUDE_HANDOFF.md`)의 §7 라우팅·§17 컴포넌트 기준 매핑입니다.

| 시안 HTML | 라우트 | 주요 컴포넌트 | 비고 |
|---|---|---|---|
| `Concord - Green v2.html` / `Concord - Blue.html` | `/` | `LandingRoot` → `LandingPageV2` (`landing-v2.css`) | 홈. 이미 data-theme/data-color 사용 중 — 토큰만 교체 |
| `Pricing.html` | `/pricing` | `PricingContent`, `PricingPlanCard`, `PricingPlansGrid` | 중등/고등 탭, CMS 카드 6슬롯. 요금은 `pricing-plans.ts` 유지, 표현만 |
| `Tutors.html` | `/tutors` (목록) | `TutorsListing` | ISR 300s, approved만. 카드 구조/검증 배지 적용. 상세 `/tutors/[id]`도 동일 토큰 |
| `FAQ.html` | `/faq` | `FaqPageContent` | CMS `FaqItem`(showOnFaqPage). 아코디언 동작 유지 |
| `Reviews.html` | `/reviews` | `ReviewsPageContent` | CMS `Testimonial`(showOnReviewsPage). 별점·매스너리 |
| `Login.html` | `/login` | `LoginForm` | 전화/이메일 + 비밀번호, 학생/선생님 탭. `?setup=admin` 분기 유지 |

## 공유 셸 (헤더/푸터)
- 시안의 `header.site` / `footer.site` 는 `SiteHeader` / 공개 푸터에 대응.
- 헤더 우측 컨트롤: **색 세그먼트(그린/블루)** + **라이트/다크 토글**. 기존 테마 훅(`useTheme`)에 연결, localStorage 키 `concord-color`·`concord-mode` 재사용.

## 웹 포털 (데스크톱 앱 화면 — 이번 패키지에 포함)
`web/portal.css` + 아래 시안 기준. 사이드바 셸(`div.shell > aside.side + main.main`)과 `section.page` 단위 화면 전환 구조.

| 시안 HTML | 라우트 | 비고 |
|---|---|---|
| `Concord - 웹 포털.html` | `/teacher-portal/**`, `/admin/**` | 선생님·매니저 역할 전환(`body[data-role]`). 대시보드·학생관리·질문답변·리포트·정산·프로필 + 매니저 전용(모니터링·승인) |
| `Concord - 웹 학부모.html` | `/dashboard/parent/**` | 학부모: 홈(새 소식)·숙제 확인·선생님 메시지·결제 관리 |

- 매니저 전용 화면은 `.mgr-only` 클래스 — `body[data-role="manager"]`일 때만 노출.
- 테이블(`.tbl`)·사이드 내비(`.nav-i`)·상태 배지(`.bst`)는 portal.css의 클래스 그대로 사용.

## 모바일 앱 (역할별 — 이번 패키지에 포함)
`app/concord-app.css` + `app/icons.js` 기준. 상세 흐름은 `MOBILE_HANDOFF.md`.

| 시안 HTML | 역할 | 핵심 흐름 |
|---|---|---|
| `Concord - 모바일 앱.html` | 학생 | 온보딩 → 로그인 → 홈 → 학습(숙제·리포트) → 질문(AI 답변 → 해결/선생님 대기, 토큰 소진 시 안내 버블) → 구독·결제 → 프로필 |
| `Concord - 학부모 앱.html` | 학부모 | 홈(자녀 요약) → 숙제 체크 → 선생님 메시지 → 결제/플랜 관리. 학생 기능의 부분집합 |
| `Concord - 선생님 앱.html` | 선생님 | 담당 학생 → 숙제 검사 → 질문 답변 → 코멘트 |
| `Concord - 매니저 앱.html` | 매니저 | 모니터링·승인 — 특별한 문제가 없으면 개입하지 않는 구조 |

## 결제·기타
- `/checkout`, `/success` — 학생 앱 시안의 구독·결제 화면(플랜 카드 `.jcard`)과 동일 토큰·컴포넌트로 구성.
