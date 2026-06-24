# Claude Code 전달 프롬프트

Concord 마케팅 페이지 전체에 통일 디자인 시스템(그린·블루 × 라이트·다크)을 적용합니다.

---

## PART 1 — 먼저 보내기 (컨텍스트 파악)

```
운영 중인 사이트(tutormatch-web.vercel.app)의 공개 마케팅 페이지 디자인을 통일하는 작업이야.
디자이너가 디자인 시스템(concord.css)과 라우트별 HTML 시안을 만들어줬어.

먼저 첨부 파일을 읽어줘:
1. README.md — 패키지 구성
2. DESIGN_SYSTEM.md — 토큰 사용 규칙, 타이포 위계, 접근성, 금지사항
3. ROUTE_MAP.md — HTML 시안 ↔ Next 라우트/컴포넌트 매핑
4. site/concord.css, site/concord.js — 디자인 토큰 + 컴포넌트 + 토글 로직
5. Pricing/Tutors/FAQ/Reviews/Login.html, Concord - Green v2/Blue.html — 라우트별 구조 레퍼런스

그 다음 현재 코드베이스를 분석해서 정리해줘. 코드 작업은 아직 하지 마:
- 전역 스타일/테마 토큰 위치 (landing-v2.css, globals.css, tailwind.config.ts)
- 현재 테마 전환 구현 (useTheme 훅, data-color/data-theme, localStorage 키 concord-color/concord-mode/concord-theme)
- 각 라우트 컴포넌트(PricingContent, TutorsListing, FaqPageContent, ReviewsPageContent, LoginForm, LandingPageV2)의 현재 마크업 구조
- CMS 데이터 바인딩 방식 (SiteContent, Testimonial, FaqItem)
```

---

## PART 2 — PART 1 답변 받은 후 보내기 (구현 지시)

```
좋아. 구현을 시작해줘. 핵심 원칙: 토큰을 단일 소스로 삼고, 기존 데이터·라우팅·CMS 바인딩은 유지한 채 표현(클래스·마크업·토큰)만 교체.

## 1. 디자인 토큰 (최우선)
- site/concord.css 의 :root + [data-color="blue"] + [data-color][data-theme="dark"] 변수 4조합을
  전역 CSS(landing-v2.css 또는 globals.css)에 이식.
- Tailwind 를 쓰면 theme.extend.colors 에서 var(--…) 를 참조하도록 매핑 (예: bg=var(--bg), accent=var(--acc) 등).
- 면(버튼·CTA·배지)에는 --acc + --on-acc, 본문 강조 텍스트·체크·숫자에는 --acc-text (분리 필수).
- 다크 전용 보정도 포함:
    [data-theme="dark"] .cmp .col-c{ background:rgba(var(--acc-rgb),.12); }
    .cmp thead th.cc{ color:#fff; }

## 2. 테마 토글 (색 + 모드, 두 축)
- <html data-color="green|blue" data-theme="light|dark"> 구조.
- 기존 localStorage 키 concord-color / concord-mode 재사용 (값: green|blue / light|dark).
- 헤더 우측에 색 세그먼트(그린/블루) + 라이트/다크 토글 배치. concord.js 의 토글 로직을 기존 useTheme 훅/Context 로 옮겨 구현.
- 기본값: green + light. body 에 background/color transition.

## 3. 타이포
- font-family: "Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif (이미 적용돼 있으면 유지)
- word-break: keep-all 전역 (한글 줄바꿈 필수)
- 제목 800(디스플레이)/700(섹션·카드), 본문 400, line-height 1.6
- 숫자(통계·가격): font-variant-numeric: tabular-nums

## 4. 라우트별 적용 (ROUTE_MAP.md 매핑대로)
각 HTML 시안의 구조/클래스를 해당 React 컴포넌트에 반영. 데이터는 기존 소스 유지:
- /pricing  → PricingContent: 중등/고등 탭 + price-card. 금액은 pricing-plans.ts 유지
- /tutors   → TutorsListing: tutor-card 그리드 + 과목 필터 + 검증 배지. 강사 데이터는 public-teachers-cache
- /faq      → FaqPageContent: faq-item 아코디언. CMS FaqItem 바인딩 유지
- /reviews  → ReviewsPageContent: rev-card 매스너리 + 별점. CMS Testimonial 유지
- /login    → LoginForm: auth-card + 학생/선생님 탭. 인증 로직 그대로
- /         → LandingPageV2: 토큰만 교체(이미 테마 시스템 있음)
공유 헤더/푸터(header.site / footer.site)는 SiteHeader/푸터에 반영.

## 5. 주의
- 강사 사진은 시안에 placeholder만 → 기존 이미지 소스(default-male/female, teacher-photos) 사용
- 스크롤 리빌·헤더 스크롤·아코디언은 concord.js 참고해 React(useEffect/IntersectionObserver 또는 framer-motion)로 재작성
- 입체감은 보더가 아니라 소프트 섀도우(--shadow-sm/md)
- 라우팅·미들웨어·API·CMS revalidate 로직은 건드리지 말 것
- 변경 후 npm run build 로 확인 (.cursor/rules/verify-build.mdc)

## 범위 밖 (다음 단계)
대시보드·포털·관리자·결제 화면은 데이터 밀집형이라 이번 작업 범위 밖. 같은 토큰 위에 별도 설계 예정.
```
