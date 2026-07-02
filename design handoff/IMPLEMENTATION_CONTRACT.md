# 구현 계약서 — Claude Code가 반드시 지킬 것 (READ FIRST)

> 이 문서의 목적은 단 하나: **디자인이 1픽셀도 어긋나지 않게 구현**하는 것.
> 지금까지 폰트·여백·색·크기가 틀어진 근본 원인은 **CSS를 “다시 작성”했기 때문**이다.
> 해결책은 명확하다 — **다시 만들지 마라. 내가 준 CSS를 그대로 가져다 써라.**

---

## 0. 가장 중요한 규칙 (이것만 지켜도 90% 해결)

1. **`concord-app.css`(앱) / `concord.css`(웹)를 한 글자도 고치지 말고 그대로 import 한다.**
   - 스타일을 새로 작성하지 않는다. Tailwind로 “비슷하게” 옮기지 않는다. styled-components로 재현하지 않는다.
   - 너의 일은 **마크업에 `className`을 붙이고, 더미 텍스트 자리에 실제 데이터를 넣는 것**뿐이다.
2. **시안 HTML의 마크업 구조를 그대로 복사한다.** div 중첩, class 순서, 요소 위치를 바꾸지 않는다.
3. **색·간격·폰트 크기를 코드에 직접 쓰지 않는다.** 전부 CSS 변수(`var(--acc)` 등)로 이미 들어가 있다. 새 hex/px를 만들지 마라.
4. 값을 “보기 좋게” 조정하고 싶어도 **하지 마라.** 어긋남은 항상 이 “개선” 충동에서 시작된다.

---

## 1. 폰트 (드리프트 1순위 원인)

```html
<!-- 정확히 이 버전. 다른 버전·다른 CDN·로컬 Inter 대체 금지 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
```
- npm 사용 시: `pretendard@1.3.9` 고정. **버전 다르면 자간·줄높이가 미세하게 달라진다.**
- 폰트 패밀리·핵심 속성은 `concord-app.css`의 `body`에 이미 있다. **절대 빼먹지 마라:**
  ```css
  font-family:"Pretendard Variable",Pretendard,-apple-system,system-ui,sans-serif;
  font-weight:400; line-height:1.55; letter-spacing:-.01em;
  word-break:keep-all;            /* ← 한글 줄바꿈. 빠지면 줄바꿈 위치가 전부 틀어짐 */
  -webkit-font-smoothing:antialiased;
  ```
- React Native면 Pretendard `.otf`를 `expo-font`로 로드하고 **weight를 파일별로 정확히 매핑**(400/500/600/700/800). 시스템 폰트로 대체하면 100% 어긋난다.

---

## 2. 무엇을 가져오고 무엇을 버리나

`concord-app.css`에는 **두 종류**가 섞여 있다:

| 가져온다 (앱 UI) | 버린다 (쇼케이스 전용 껍데기) |
|---|---|
| `:root`/`[data-color]`/`[data-theme]` 토큰 블록 **전부** | `.top`, `.seg`, `.tog` (테마 토글 바) |
| `.dotw`, `.appbar`, `.card`, `.now`, `.qa`, `.ring`, `.lrow` … 모든 컴포넌트 | `.wall` (회색 배경 그리드) |
| `.field`, `.opt`, `.plan-pick`, `.co-*`, `.status`, `.auth` … | `.device`, `.cap` (캡션) |
| `.tabs`, `.tab` (실제 탭바) | `.phone`, `.screen`, `.island`, `.sb`, `.home-ind` (폰 목업 프레임) |

> `.phone/.screen` 등은 **시안을 폰처럼 보여주려는 액자**일 뿐, 실제 앱에선 화면 자체가 뷰포트다. 이것들만 빼고 안쪽 내용(`.body > .scroll`의 자식들)을 화면 컴포넌트로 옮긴다.

---

## 3. 테마 (그린/블루 × 라이트/다크)

- 메커니즘: 최상위 요소(웹은 `<html>`, RN은 루트 View 래퍼)에 **두 개의 속성**을 건다.
  ```html
  <html data-color="green" data-theme="light">  <!-- 기본값 -->
  ```
  - `data-color`: `green` | `blue`
  - `data-theme`: 없으면 라이트, `dark`면 다크
- 토큰 블록이 이 조합에 모두 키잉돼 있으므로 **속성만 바꾸면** 전체 색이 바뀐다. 색을 컴포넌트에서 직접 분기하지 마라.
- 저장 키(웹과 공유): `localStorage['concord-color']`, `localStorage['concord-mode']`.
- RN은 `data-*`가 없으니 `ThemeProvider`로 4조합 객체를 주입 — 값은 `tokens-reference.css`의 4블록을 **그대로** 포팅(아래 §6).

---

## 3b. 아이콘 (직접 생성·대체 금지)

- 모든 UI 아이콘은 **`app/icons.js`의 명명된 세트가 단일 소스**다. 시안 HTML의 인라인 `<svg>`는 전부 이 세트에서 나온 것.
- **새 아이콘을 그리거나 생성하지 말고, 다른 아이콘 라이브러리(lucide/heroicons 등)로 “비슷한 걸” 대체하지 마라.** 이름으로 호출한다: `icon('bell')`, `icon('check', {strokeWidth:3})`.
- 전체 목록·생김새는 `Concord - 아이콘 세트.html`을 열어 확인(그린/블루·라이트/다크 토글 가능).
- 24×24 · `currentColor` 기반이라 글자색을 그대로 따른다. 색을 아이콘에 직접 칠하지 말고 부모 텍스트 색(`--fg`/`--acc-text`/면 위 `--on-acc`)으로 제어.
- RN은 `react-native-svg`로 `ICONS[name].body`의 path를 그대로 사용(viewBox·stroke-width·caps 동일 유지).
- 세트에 없는 새 아이콘이 꼭 필요하면, 임의 생성하지 말고 **같은 스타일(24×24, stroke 2, round cap/join)** 로 추가 제안만 하고 확인을 받아라.

---

## 4. 기계적 작업 순서 (화면 1개 기준)

1. 시안 HTML에서 해당 `<!-- N. SCREEN -->`의 `.body > .scroll` **안쪽**을 통째로 복사.
2. 폰 프레임(`.phone/.screen/.island/.sb/.home-ind`)과 `.cap`은 버림.
3. 복사한 마크업의 **class를 그대로 둔 채** 더미 텍스트만 실제 데이터 바인딩으로 교체.
   - 예: `<div class="nm">Teacher Noah</div>` → `<div className="nm">{tutor.name}</div>`
4. 인라인 `style="..."`이 붙은 곳은 **그 값 그대로** 유지(`style={{height:'78%'}}` 등). 임의로 px을 바꾸지 마라.
5. `concord-app.css`를 import. 끝. **새 CSS를 쓰지 않는다.**

---

## 4b. 화면 크기 대응 (기기별 어긋남 방지)

레이아웃은 **유동(fluid)** 이다 — 컨테이너는 화면 너비에 맞춰 늘어나고, 패딩·폰트는 고정 px이 맞다(작은 폰이라고 패딩까지 줄이면 오히려 디자인이 깨진다). 단 아래는 **반드시** 처리한다:

1. **안전영역(Safe Area).** 노치·다이내믹 아일랜드·홈 인디케이터를 침범하지 않게:
   - 웹/PWA: 상단·하단 고정 요소에 `padding-top:env(safe-area-inset-top)` / `padding-bottom:env(safe-area-inset-bottom)` 추가. `<meta name="viewport" content="... viewport-fit=cover">` 필요.
   - RN: 최상위를 `SafeAreaView`(react-native-safe-area-context)로 감싸고, 하단 탭바/`.cta-bar`에 `insets.bottom` 더하기.
   - 시안의 `.sb`(상태바)·`.home-ind`(홈바)는 **목업 장식**이므로 버리고, 실제 OS 안전영역으로 대체한다.
2. **스크롤.** 각 화면 본문은 세로 스크롤(`.scroll` 대응). 하단 고정 CTA(`.cta-bar`)·탭바(`.tabs`)는 스크롤 영역 **밖**에 둔다(시안 구조 그대로).
3. **양극단 확인.** 가장 작은 기기(iPhone SE, 375pt 폭)와 큰 기기(Pro Max, 430pt)에서 각 화면 점검 — 가로 스크롤·잘림이 없어야 한다. 가로폭은 절대 고정하지 말 것(컨테이너는 `width:100%`).
4. **터치 타깃 ≥ 44pt.** 버튼·탭·아이콘버튼은 시안 크기 유지 시 충족된다 — 줄이지 마라.
5. **글자 크기 시스템 설정(접근성).** OS 글자 확대 대응이 필요하면 폰트만 `rem`/`sp`로, 레이아웃은 유동이라 자동 적응. (선택)

> 요약: **폭은 유동 / 간격·글자는 고정 / 가장자리는 safe-area** — 이 셋이면 기기 크기가 달라도 어긋나지 않는다.

---

## 5. 화면 ↔ 라우트 매핑
`MOBILE_HANDOFF.md`의 표를 따른다(18화면 전체 흐름 + 컴포넌트 목록). 라우트/탭 구조는 그 문서가 기준.

---

## 6. 토큰 — 직접 import 가능한 형태
`tokens-reference.css`가 원본(Single Source of Truth). 웹은 그대로 `@import`. RN/JS는 아래처럼 **값을 그대로** 객체화(재타이핑 금지, 복사·붙여넣기):

```ts
// 4블록을 tokens-reference.css에서 그대로 옮긴 것. 값을 손으로 바꾸지 말 것.
export const themes = {
  'green-light': { bg:'#FAF9F4', panel:'#FFFFFF', panel2:'#F0EFE7', line:'rgba(34,38,30,.085)',
    line2:'rgba(34,38,30,.15)', fg:'#161A16', mut:'#585C53', mut2:'#9AA095',
    acc:'#10B981', accPress:'#0CA372', onAcc:'#FFFFFF', accText:'#07875A' },
  'blue-light':  { bg:'#F5F8FE', panel:'#FFFFFF', panel2:'#EAF0FB', line:'rgba(20,38,74,.085)',
    line2:'rgba(20,38,74,.15)', fg:'#0F1A2E', mut:'#54627A', mut2:'#93A1B8',
    acc:'#2563EB', accPress:'#1d54cf', onAcc:'#FFFFFF', accText:'#1D4ED8' },
  'green-dark':  { bg:'#181A1B', panel:'#202325', panel2:'#282B2D', line:'rgba(200,206,202,.11)',
    line2:'rgba(200,206,202,.18)', fg:'#ECEEEC', mut:'#AEB4B0', mut2:'#7C817E',
    acc:'#2EA46E', accPress:'#38B97E', onAcc:'#06150D', accText:'#64C699' },
  'blue-dark':   { bg:'#0A1120', panel:'#101D32', panel2:'#16273F', line:'rgba(140,175,230,.13)',
    line2:'rgba(140,175,230,.22)', fg:'#EAF1FB', mut:'#9DABC4', mut2:'#6A7894',
    acc:'#3B82F6', accPress:'#5B9CFF', onAcc:'#06122A', accText:'#85B5FF' },
};
```

---

## 7. 검수 체크리스트 (PR마다 확인)
구현 후 `reference/` 폴더의 스크린샷과 **나란히 비교**한다. 아래가 하나라도 다르면 “다시 만든” 것이다:

- [ ] 폰트가 Pretendard인가? (제목 자간이 촘촘한가 — `letter-spacing` 음수 적용?)
- [ ] 한글 줄바꿈이 어절 단위인가? (`word-break:keep-all`)
- [ ] 숫자(통계·가격·D-day)가 `tabular-nums`로 자릿수 정렬되는가?
- [ ] 제목 800 / 카드제목 700 / 본문 400 — **굵기 위계**가 같은가?
- [ ] 카드 모서리 반경, 그림자가 토큰값 그대로인가? (`--shadow-sm/md`)
- [ ] 액센트가 **면=`--acc`(흰글자) / 텍스트=`--acc-text`** 구분대로인가?
- [ ] 4조합(그린·블루 × 라이트·다크) 모두에서 색이 토큰대로 바뀌는가?
- [ ] 여백(패딩·갭)이 시안과 같은가 — 임의로 키우거나 줄이지 않았는가?

> 가능하면 **시각 회귀 테스트**(Playwright `toHaveScreenshot` 또는 Storybook + Chromatic)를 붙여 `reference/` 이미지와 자동 diff. 사람이 눈으로 “비슷하다”고 판단하지 말고 픽셀로 검증.

---

## 8. 하지 말 것 (드리프트 유발 행동 = 금지)
- ❌ CSS를 Tailwind 유틸리티/styled-components로 “옮겨 적기” → ✅ 원본 CSS import
- ❌ 폰트를 Inter/Noto/시스템으로 대체 → ✅ Pretendard 1.3.9 고정
- ❌ 색·px·반경을 컴포넌트에 직접 하드코딩 → ✅ 토큰 변수만
- ❌ `word-break`, `letter-spacing`, `tabular-nums`, `font-feature-settings` 누락
- ❌ 마크업 구조 재배치, 요소 순서 변경
- ❌ “더 보기 좋게” 여백·크기 조정
- ❌ 라이트를 다크의 색반전으로 처리 → ✅ 4블록 각각 독립 값 사용
