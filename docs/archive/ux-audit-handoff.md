# Concord UX·애니메이션 개선 핸드오프 문서

> **처리 현황 (2026-07-09 완료)**: M-1·3·4·5·6·7·8·9·10·11·12·15·17 수정 완료(커밋 c6cfdf1~fc52209), M-13은 M-6으로 해소, M-14·16은 검증 PASS(수정 불필요), **M-2는 의도된 설계로 유지 결정**. 터치 타깃 위반 11~13개/페이지 → 0.

> 2026-07-08 전체 사이트 순회 감사(PC 1440×900 / 태블릿 768×1024 / 모바일 390×844, Playwright 실측) 결과.
> 이 문서는 **다른 AI 에이전트가 그대로 실행할 수 있는 작업 지시서**다. 각 이슈에 위치·측정치·목표값·검증 방법을 명시한다.

## 0. 작업 규칙 (필수 준수)

- 같은 워킹트리에서 다른 에이전트가 병행 작업 중이다. **홈 축 파일(LandingPageV2.tsx, landing-v2.css, HomeSafetyStory.tsx)은 수정 전 `git status`로 dirty 여부 확인**, dirty면 해당 이슈는 보류하고 보고.
- `npm run build` 금지(실행 중 dev 서버와 `.next` 공유 — 캐시가 깨진다). 검증은 `npx tsc --noEmit` + `npm run lint` + Playwright(dev 서버 `localhost:3000`, 이미 가동 중).
- 커밋은 **자기 변경 파일만 선별 `git add`**. 커밋 메시지에 이슈 ID(M-1 등) 명시. push 전 `git fetch origin && git status -sb`로 원격 이동 확인.
- 카피/문구를 새로 추가하면 기존 CMS 패턴 준수: `getCmsSectionValue(siteContent, section, key, fallback)` + `src/lib/cms-page-defaults.ts`에 동일 값으로 defaults 등록. **빈 폴백 + filter로 섹션이 사라지는 패턴 금지.**
- 모든 모션 수정은 `@media (prefers-reduced-motion: reduce)` 예외를 유지·확장한다.

## 1. 공통 모션 원칙 (신규 작업의 기준)

| 항목 | 현재 | 목표 |
|---|---|---|
| 콘텐츠 리빌 duration | **2s** | 0.45~0.6s |
| 리빌 이동 거리 | 56px | 16~24px |
| 표준 이징 | 혼재 | `cubic-bezier(0.22, 1, 0.36, 1)` 통일 |
| 마이크로 인터랙션(버튼·탭) | 0.15~0.2s | 유지 |
| 터치 타깃 최소 | 위반 11~18개/페이지 | 최소 40×40px (권장 44) |
| 모바일 vh | svh 일부 적용 | 고정 100vh 사용처는 `svh/dvh`로 |

---

## 2. 이슈 목록

### P1 — 사용자 체감 큰 문제

**[M-1] 리빌 애니메이션 2초 — 빠르게 스크롤하면 페이지가 "비어" 보임**
- 위치: `src/app/concord.css:110` `.reveal{ ... transition: opacity 2s ..., transform 2s ...; }`
- 증거: PC 홈 중간 지점으로 스크롤 후 **1.2초가 지나도 섹션 헤드라인이 opacity ~10%** (스크린샷 /tmp/audit-pc-home-mid.png). 실사용자가 휠을 굴리면 화면 대부분이 흐릿한 상태로 노출됨.
- 개선: duration **2s → 0.55s**, translateY **56px → 20px**. `ConcordReveal` 컴포넌트가 delay를 주고 있다면 계단 delay는 요소당 60~80ms로 제한.
- 검증: 홈 로드 → `window.scrollTo(0, document.body.scrollHeight*0.45)` → 700ms 후 스크린샷에서 헤드라인 opacity가 1인지 `getComputedStyle` 확인.

**[M-2] /tutors 캐러셀 자동 순환 3초 — 의도된 설계로 유지 결정(2026-07-08). 작업 제외.**
- 위치: `src/components/tutors/FeaturedTutors.tsx:94` `window.setInterval(() => go(1), 3000)`
- 카드에는 대학·이름·3줄 소개·과목·경력이 있어 정독에 6~8초 필요. 3초 자동 순환은 읽기를 강제로 끊는다.
- 개선: **interval 3000 → 6000ms**. 추가로 ① 마우스가 캐러셀 위에 있으면 일시정지 ② 사용자가 화살표/드래그 조작 후 10초간 자동 순환 중지 ③ `document.hidden`일 때 정지.
- 검증: /tutors에서 중앙 카드 텍스트를 기록 → 5초 대기 → 동일해야 함(6초 후 변경).

**[M-3] 터치 기기에서 hover 의존 UI — Process 스텝 목업·마퀴 정지**
- 위치: `src/components/landing/LandingPageV2.tsx` Process 섹션(호버 시 우측 목업 표시, `useAlignedMockY`/`useMobileCenterActive` 훅), `src/app/concord.css:449` `.hall-marquee:hover .hall-track{ animation-play-state: paused; }`
- 태블릿·모바일은 hover가 없다. ① Process 목업이 태블릿(768px)에서 어떻게 뜨는지 확인 — `useMobileCenterActive`가 모바일은 커버하나 **태블릿 뷰포트(768~1024)에서 hover도 center-activation도 안 되는 사각지대**가 있는지 점검 후, 포인터 미디어쿼리(`@media (hover: none)`) 기준으로 "탭하면 해당 스텝 활성 + 목업 갱신"으로 통일. ② 마퀴는 터치 기기에서 `touchstart` 시 일시정지, 또는 [M-6] 스크롤 스냅 전환 적용.
- 검증: 태블릿 컨텍스트(hasTouch)에서 스텝 탭 → 목업 이미지 src 변경 확인.

**[M-4] 하단 고정 CTA 바 73px — 모바일 화면 점유 과다 + iOS 세이프에어리어 미대응**
- 위치: `src/components/layout/StickyConsultCta.tsx`, 스타일 `src/app/landing-v2.css`(sticky-cta 계열)
- 실측: 모든 뷰포트에서 높이 **73px**. 모바일(844px)에서 헤더 54px과 합쳐 상시 15%를 차지. `env(safe-area-inset-bottom)` 미적용 — iOS 홈바와 겹칠 수 있음.
- 개선: ① 모바일(≤640px)에서 컴팩트 변형: "선생님 둘러보기" 고스트 버튼 숨기고 배지+메시지 한 줄 축약, 높이 56px 목표 ② `padding-bottom: env(safe-area-inset-bottom)` 추가 ③ **/consult 페이지에서는 숨김**(아래 M-5).
- 검증: 모바일 뷰포트에서 `.sticky-cta` height ≤ 60px, /consult에서 count 0.

**[M-5] /consult(상담 폼) 페이지에 상담 유도 스티키 CTA·배너가 그대로 노출 — 목적지에서 또 호객**
- 실측: /consult에서도 sticky 73px 노출. 이미 폼에 도착한 사용자에게 중복 CTA는 마찰이며, 모바일에서 약관 체크·제출 버튼과 겹칠 위험.
- 위치: `src/components/layout/PublicShell.tsx`가 StickyConsultCta를 전 페이지 렌더.
- 개선: PublicShell에 `hideStickyCta` prop 추가, `src/app/consult/page.tsx`에서 true로. TopUrgencyBanner도 /consult에서는 숨김 권장.

**[M-6] hall 마퀴(합격 카드)가 터치에서 조작 불가 — 순수 CSS 애니메이션이라 스와이프·정지 불가**
- 위치: `src/components/common/HallOfFameCarousel.tsx` + `src/app/concord.css:443` `.hall-track`(animation 48s), hover 정지만 존재.
- 모바일 사용자는 흘러가는 카드를 잡을 수 없고 원하는 학교를 볼 수 없다.
- 개선: `@media (hover: none)`에서 marquee 애니메이션 제거하고 **가로 스크롤 + scroll-snap**(카드 단위)으로 전환. 복제 배열(doubled)은 hover 환경에서만 사용.
- 검증: 모바일 컨텍스트에서 `.hall-marquee`가 `overflow-x: auto`이고 스와이프로 카드 이동 가능.

### P2 — 개선하면 확실히 좋아지는 것

**[M-7] 스크롤텔링 핀 구간 길이(약 6뷰포트) — 자동 진행 도입 후 과잉**
- 위치: `src/components/landing/HomeSafetyStory.tsx:13` `UNIT_VH = 55`, 핀 높이 `(totalUnits+3)*55svh+100svh` ≈ 화면 6배.
- 이제 다크 구간은 1초 자동 진행 + 스크롤 즉시 전진이라 스크롤 거리가 의미를 잃음. 긴 핀은 "스크롤이 안 먹는" 답답함을 유발.
- 개선: `UNIT_VH` 55 → **38~42**로 축소(전체 핀 ≈ 4뷰포트). 반드시 자동/수동 전진과 스크롤 동기화(unit ↔ su 관계)가 깨지지 않는지 회귀 확인.
- 주의: 이 파일은 병행 에이전트가 자주 편집 — 규칙 0 확인.

**[M-8] 헤더 우측 컨트롤 과밀(PC) — 테마 색상 세그 + 다크모드 + 로그인 + CTA 4덩어리**
- 증거: /tmp/audit-pc-home-mid.png 상단. 첫 방문자에게 그린/블루 색상 전환 세그는 의미 없는 선택지(짜침)이며 CTA 주목도를 뺏는다.
- 위치: `src/components/concord/ConcordSiteHeader.tsx` (seg 색 테마 스위처).
- 개선: 색 테마 세그를 **헤더에서 제거**(다크모드 토글만 유지). 제거 대신 숨김 CMS 토글(`site_header.show_theme_picker`, 기본 0)로 구현해 되돌릴 수 있게.
- 검증: PC 헤더에 컨트롤이 다크토글·로그인·무료상담 3개만.

**[M-9] 터치 타깃 미달 요소 페이지당 11~18개**
- 실측: 36px 미만 인터랙티브 요소 — 홈(PC 18, 모바일 13), 나머지 페이지 11~16.
- 주요 대상: 헤더 테마 토글(seg 버튼), 푸터 링크(줄 간격은 넉넉하나 높이 부족), FAQ/약관 인라인 링크, 캐러셀 화살표.
- 개선: 공통 규칙 — 모바일에서 인터랙티브 요소 `min-height: 40px`(패딩으로 확보, 시각 크기는 유지 가능). 우선순위: 헤더·푸터·캐러셀 화살표·모달 닫기(×).
- 검증: 감사 스크립트의 smallTargets 카운트가 페이지당 ≤3.

**[M-10] 가입 모달 — 모바일에서 카드가 94vh를 채우며 내부 스크롤 발생**
- 실측: 모바일 358×793, `scrollable: true`. 제출 버튼이 초기 화면 밖.
- 위치: `src/components/auth/ConsultationSignupModal.tsx`, `ConsultationSignupForm.tsx`
- 개선: ① 모바일(≤480px)에서 **바텀시트 스타일**(하단 고정, 위 라운드, 드래그 핸들)로 전환 권장 ② 최소한 헤더(mb-5)와 필드 간격(space-y-4)을 모바일에서 한 단계 축소하고, 제출 버튼을 카드 하단 sticky로 만들어 스크롤 없이 항상 보이게.
- 검증: 모바일에서 모달 열자마자 제출 버튼이 뷰포트 안.

**[M-11] 지역 콤보박스 목록 높이 190px — 모바일 키보드와 충돌**
- 위치: `src/app/concord.css` `.region-options{ max-height: 190px; }`, `src/components/common/RegionPicker.tsx`
- 모바일에서 input 포커스 → 키보드가 화면 하단 ~40%를 덮는데, 드롭다운이 입력칸 아래로 펼쳐져 목록 대부분이 키보드 뒤로 숨을 수 있음.
- 개선: `@media (max-width:480px)`에서 max-height를 `min(190px, 32dvh)`로, 콤보 열릴 때 `scrollIntoView({ block:"center" })` 호출. (근본 해결은 M-10 바텀시트와 함께 풀-스크린 선택 시트.)
- 검증: 모바일 /consult에서 서울 탭 → 구 입력 포커스 상태 스크린샷에서 목록 3개 이상 노출.

**[M-12] FAQ 아코디언 — 펼침 애니메이션·터치 피드백 점검**
- 위치: `src/components/faq/FaqAccordionList.tsx`
- 점검: 펼침이 즉시 툭 열리면(높이 애니메이션 없음) `grid-template-rows: 0fr→1fr` 트릭 또는 max-height transition 0.3s 적용. 열림 상태 화살표 회전(0.2s). 질문 행 min-height 44px.
- 검증: 클릭 시 부드러운 확장, 연타에도 레이아웃 점프 없음.

### P3 — 다듬기

**[M-13] 마퀴 속도 튜닝**: `.hall-track` 48s/24장 — PC에서는 적당하나 모바일(카드 70vw)에서는 초당 이동량이 커 어지러움. `@media (max-width:640px)`에서 `animation-duration: 70s` (M-6 스냅 전환 시 불필요).
**[M-14] 히어로 진입 모션**: 히어로 텍스트/사진에도 .reveal 2s가 걸려 첫 페인트가 느리게 느껴짐 — M-1 적용 시 함께 해결되는지 확인만.
**[M-15] 다크모드 대비 스팟체크**: 합격 카드(흰 배경 고정)와 다크 배경의 경계, `--hall-c` 컬러들의 다크모드 대비(특히 #003876, #143C8C 계열이 어두운 배경에서 명도 부족) — 다크모드에서 카드 주변에 subtle ring 추가 또는 컬러 라이트닝 맵.
**[M-16] `/tutors` 히어로 배너/뉴스 섹션 간 여백 리듬**: 재정렬(why→featured→stats→news) 후 섹션 간 상하 패딩이 균일한지 3뷰포트 스크린샷 비교, `sec`/`sec-sm` 배치 조정.
**[M-17] 스크롤텔링 모바일 텍스트 크기**: 다크 구간 매칭 문구가 모바일에서 2~3줄 래핑되면 1초 자동 진행이 급하게 느껴짐 — 모바일만 자동 간격 1.4s로 차등.

---

## 3. 권장 작업 순서

1. M-1 (전역 리빌 — 최소 변경·최대 효과) → 전 페이지 스크린샷 회귀
2. M-4 + M-5 (스티키 CTA) — 같은 파일권
3. M-2 (캐러셀 주기) → M-3 (터치 hover 대체) → M-6 (마퀴 스냅)
4. M-9 (터치 타깃) — 공통 CSS 유틸로 일괄
5. M-10 + M-11 (모달·지역 모바일)
6. 나머지 P2/P3

## 4. 검증 스크립트 재사용

감사에 쓴 순회 스크립트 패턴(뷰포트 3종 × 6페이지, 상/중/하 캡처 + 측정)을 각 작업 후 재실행해 회귀를 확인할 것:
- 측정 항목: `.sticky-cta` height, smallTargets 수(36px 미만), `.reveal` 적용 후 700ms 시점 opacity, 모달 scrollable 여부, `.lp2-story-pin` 높이/vh.
- 스크린샷 명명: `/tmp/audit-{viewport}-{page}-{top|mid|bot}.png`

## 5. 관련 파일 맵

| 영역 | 파일 |
|---|---|
| 리빌 | src/app/concord.css (.reveal), src/components/concord/ConcordReveal.tsx |
| 스티키 CTA | src/components/layout/StickyConsultCta.tsx, src/components/layout/PublicShell.tsx |
| 캐러셀(선생님) | src/components/tutors/FeaturedTutors.tsx (interval·화살표), src/app/concord.css (.tpx-*) |
| 마퀴(합격) | src/components/common/HallOfFameCarousel.tsx, src/app/concord.css (.hall-*) |
| 스크롤텔링 | src/components/landing/HomeSafetyStory.tsx (병행 에이전트 주의) |
| Process 호버 | src/components/landing/LandingPageV2.tsx (병행 에이전트 주의) |
| 모달·지역 | src/components/auth/ConsultationSignupModal.tsx, ConsultationSignupForm.tsx, src/components/common/RegionPicker.tsx |
| 헤더/푸터 | src/components/concord/ConcordSiteHeader.tsx, ConcordSiteFooter.tsx |
| FAQ | src/components/faq/FaqAccordionList.tsx |
