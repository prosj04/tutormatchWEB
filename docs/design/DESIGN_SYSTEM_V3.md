# Concord 디자인 시스템 v3 — Editorial

2026-09-30 오너 지시("UI 전면 개편, 기존 디자인은 싹 갈아엎어")로 도입. v2(그린/블루 핸드오프, `design handoff/`)를 대체한다. 결정 배경은 [ADR 0002](../adr/0002-editorial-redesign.md). 구현 정본은 `src/app/ds.css`(전역 단일 스타일시트)다.

## 1. 방향

프리미엄 큐레이션 서비스는 "고르는 화면"이 아니라 "정해주는 지면"이어야 한다. 그래서 마켓플레이스·SaaS 문법(둥근 카드 그리드, 컬러 배지, 그림자 호버) 대신 **인쇄 지면의 문법**을 쓴다 — 종이 바탕, 잉크 글자, 세리프 헤드라인, 헤어라인 구분선, 넓은 여백.

Dribbble 레퍼런스(표본이지 스펙이 아니다 — 추상화한 규칙만 가져온다):

| 샷 | 가져온 규칙 |
|---|---|
| Aura — Editorial Landing for Wealth Management (Abdullah Fuad) | 따뜻한 오프화이트 바탕 + 잉크 세리프 디스플레이, 강조어 한 곳만 색, 잉크 pill CTA + 텍스트 보조 CTA |
| Executive Brief — Editorial Landing for Founders (10am Space) | 큰 숫자 + 헤어라인 행으로 만든 "원장(ledger)" 목록, 인물 사진을 자연 비율로 흩어 배치 |
| PEARL — Learning & Performance Platform (Bertobase) | 교육 서비스의 선언문형 대형 문단, 중앙 정렬 스테이트먼트 섹션, 헤어라인으로 나눈 FAQ |
| Everstead Academy — Educational Branding (Phenomenon Studio) | 명문 사립학교의 절제된 소재감(스톤·아이보리·딥그린), 엠블럼 같은 워드마크 |

오너 미학(BUSINESS_DIRECTION §13)과의 정합: 박스-안-박스 대신 헤어라인, 라운드 최소화, 그림자 대신 여백, 효과는 문턱값, 위계는 크기·투명도로.

## 2. 토큰

토큰 **이름**은 v2와 같다(`--bg --panel --panel-2 --line --line-2 --fg --mut --mut-2 --acc --acc-press --acc-rgb --on-acc --acc-text --shadow-sm --shadow-md --header-bg`). 값만 바뀌었다. 새 토큰: `--ink --on-ink --brass --danger --warn --serif --sans --r-xs/sm/md`.

| 조합 | 바탕 | 글자 | 액센트 |
|---|---|---|---|
| Evergreen · light (기본, `data-color=green`) | 종이 `#F4F1EA` | 잉크 `#1A1A17` | 딥그린 `#1F4A3A` |
| Navy · light (`data-color=blue`) | `#F2F2EE` | `#161A22` | 네이비 `#1E3358` |
| dark (`data-theme=dark`) | `#121412` / `#0F1217` | `#ECE8DF` | 밝힌 액센트(`#A9CDB8` / `#A9BEE3`) |

규칙
- 액센트는 **면 1곳(주 CTA)과 강조어 1곳**에만. 배경 대면적·배지 남발 금지.
- 상태색(`--danger --warn`)은 채도를 낮춘 벽돌·황토. 원색 빨강/노랑 금지.
- Tailwind `gray-*`는 `--g-*` 채널로 재매핑되어 다크에서 자동 반전된다 — 새 코드는 토큰 클래스(`text-[var(--mut)]` 등)나 ds.css 클래스를 우선.

## 3. 타이포

- **세리프(Noto Serif KR)** = 목소리. `h1`, `h2`, 디스플레이, 큰 숫자(가격·통계·단계 번호), 인용.
- **산세리프(Pretendard)** = 기능. 본문·UI·라벨·버튼·표.
- `h1,h2`는 전역으로 세리프다. 산세리프가 필요하면 `.sans`.

| 클래스 | 크기 | 비고 |
|---|---|---|
| `.display` | clamp(44px, 6.6vw, 108px) / 1.14 | 세리프 500, 자간 -0.035em. 히어로 전용 |
| `.h1` / `.page-head h1` | clamp(36px, 4.6vw, 72px) / 1.18 | 세리프 500 |
| `.h2` | clamp(30px, 3.6vw, 56px) / 1.22 | 세리프 500 |
| `.h3` | clamp(19px, 1.5vw, 23px) | 산세리프 600 |
| `.lede` | clamp(17px, 1.35vw, 21px) / 1.7 | `--mut` |
| `.eyebrow` | 12px, 600, 자간 .18em, 대문자 | 앞에 24px 헤어라인. `--mut`(색 없음) |
| `.num` | 세리프 + tabular-nums | 가격·통계·번호 |
| `.caption` | 13px `--mut-2` | 사진 캡션·각주 |

강조어는 `<em>`(세리프 이탤릭 없음 — 한글 이탤릭은 쓰지 않는다) 대신 `.kw`(액센트 색)로 한 곳만.

## 4. 레이아웃

- 폭 `--wrap` 1320px, 거터 `--gutter` clamp(20px, 3.2vw, 48px). 컨테이너 `.wrap`.
- 섹션 `.sec` 상하 `--sec-pad` clamp(88px, 10vw, 168px). 섹션 사이는 여백 또는 `.sec.ruled`(상단 헤어라인).
- 섹션 헤더 `.sec-head`: 데스크톱 12열 — 왼쪽 4열 eyebrow(+번호), 오른쪽 8열 제목·리드. 모바일 1열.
- 12열 그리드 유틸 `.grid-12`.
- 원장 목록 `.ledger`: 행마다 상단 헤어라인, 큰 세리프 번호 + 제목 + 설명. 카드 그리드 대신 이것을 먼저 고려.

## 5. 형태

- 반경: 버튼·칩 pill, 카드·입력 6px, 이미지 2px. 그 외 0.
- 그림자: `--shadow-sm`은 거의 보이지 않는 1px, `--shadow-md`는 떠 있는 레이어(모달·드로어·드롭다운)만.
- 카드 `.card` = `--panel` 면 + 헤어라인 1px. 호버 상승 없음. 카드 안에 카드 금지.
- 사진: 원본 비율 유지(크롭 금지 — `object-fit:cover`로 비율을 깎지 말 것. 1:1 카드 사진은 이미 1:1로 준비된 자산만), 모서리 2px, 캡션은 사진 밖 아래.

## 6. 컴포넌트 어휘 (ds.css)

공개: `header.site` `.nav` `.logo` `.nav-links` `.nav-right` `.theme-toggle` `.mobile-drawer` `footer.site` `.sticky-cta` `.page-head` `.sec` `.sec-head` `.ledger` `.btn(-acc|-ink|-ghost|-text|-sm|-lg|-block)` `.card` `.field` `.seg-tabs` `.tier-tabs` `.faq-*` `.auth-*`

포털: `.shell` `.side` `.nav-i` `.main` `.crumb` `.topbar` `.portal-topbar` `.portal-subnav` `.portal-admin*` `.kpi` `.kpis` `.row` `.bst` `.tbl` `.banner` `.modal` `.drawer` `.toast` `.empty` `.skel` `.switch` `.opts/.opt` `.flow` `.chk` `.chat` `.composer`

포털 버튼은 v2 어휘(`.btn.pri`, `.btn.sec`, `.btn.ghost`, `.btn.sm`, `.btn.danger`)도 그대로 받는다.

## 6-1. 스타일시트 구성

| 파일 | 범위 | 접두사 |
|---|---|---|
| `src/app/ds.css` | 토큰·베이스·타이포·레이아웃·프리미티브·공개 크롬·포털 크롬·Tailwind 브리지 | 없음(공용 어휘) |
| `src/app/(home)/landing.css` | 홈 | `.lx-` |
| `src/app/marketing.css` | 홈·/pricing·/tutors·/reviews 공용 카드(요금·합격·선생님) | `.lx-pcard` `.pricing-plans` `.hall-` `.tpx-` |
| `src/app/concord.css` · `tutors/tutors.css` · `reviews/reviews.css` | 공개 서브페이지 | `.mk-` `.tp-` `.rp-` |
| `src/app/forms.css` · `consult/consult.css` | 전환·인증 폼 | `.cv-` |
| `src/app/portal-{student,parent,staff,admin}.css` | 포털 영역 | `.st-` `.pa-` `.sf-` `.ad-` |

영역 시트는 루트 레이아웃에서 전역 로드되므로 **모든 선택자를 접두사로 스코프**한다. 섹션 블록 `.sec` 규칙은 `:not(.btn)` 으로 버튼 수정자 `.btn.sec` 를 제외한다.

## 7. 모션

- 등장 `.reveal` → `.in`: 불투명도 0→1 + 14px 상승, .9s `--ease-out`. 한 번만.
- 호버: 색·보더만 .18s. 상승(translateY)·확대 금지.
- 템포 = 위계: 핵심 카피는 느리게, 배경 정보는 빠르게. `prefers-reduced-motion`이면 전부 즉시.

## 8. 금지

- 컬러 배지 나열, 할인·검증 배지, 느낌표, 이모지.
- 그라데이션 배경·글로우·그리드 패턴 배경(v2 page-head 방식).
- 카드 호버 상승, 큰 그림자, 12px 이상 라운드 카드.
- 새 마케팅 카피 추가 — 문구는 기존 CMS 키·폴백 그대로. 디자인만 바꾼다.
