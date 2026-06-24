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

## 적용하지 않는(=별도 단계) 화면
데이터 밀집형 앱 화면은 마케팅과 디자인 성격이 달라 이번 패키지에 미포함. 같은 토큰 위에 별도 컴포넌트(테이블·캘린더·사이드바) 설계 필요:
- `/dashboard`, `/dashboard/consultation` (학생)
- `/teacher-portal/**` (선생님·매니저)
- `/admin/**` (관리자)
- `/checkout`, `/success` (결제)
