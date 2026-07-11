# Claude Code 전달 프롬프트 — Concord 전체 구현

범위가 크므로 **3개 파트로 나눠** 순서대로 보내세요. 각 파트는 이전 파트 완료 후에.

---

## PART 1 — 컨텍스트 파악 (코드 작성 금지)

```
Concord(TutorMatch) 서비스 전체에 새 디자인 시스템을 적용하는 작업이야.
handoff/ 폴더에 완성된 디자인 패키지가 있어.

가장 중요한 원칙 (전 작업 공통):
1. 디자인을 다시 만들지 마 — 내가 준 CSS를 그대로 써. 값을 "비슷하게" 옮기지 말고 그대로.
2. 아이콘을 새로 그리거나 다른 라이브러리로 대체하지 마 — handoff/app/icons.js가 단일 소스야.
3. 색·px·반경·폰트크기를 하드코딩하지 마 — 토큰 변수(var(--…))만 사용.

먼저 아래 순서로 읽어 (아직 코드 쓰지 마):
1. handoff/IMPLEMENTATION_CONTRACT.md  ← 규칙. 반드시 전부 따라.
2. handoff/README.md                   ← 패키지 구성
3. handoff/ROUTE_MAP.md                ← 시안 ↔ 라우트/컴포넌트 매핑 (웹·포털·앱 전부)
4. handoff/DESIGN_SYSTEM.md            ← 토큰 사용 규칙
5. 소스: site/concord.css + concord.js, web/portal.css, app/concord-app.css, app/icons.js

다 읽으면 코드 쓰기 전에 정리해서 알려줘:
- 현재 스택 구조 (Next 버전·라우터, RN/Expo 여부, 글로벌 스타일 위치)
- concord.css / portal.css / concord-app.css를 각각 어디에 어떻게 로드할지
- 테마 상태(data-color/data-theme + localStorage concord-color/concord-mode)를 어디서 관리할지
- ROUTE_MAP.md 기준으로 각 시안을 어떤 라우트/컴포넌트에 매핑할지
- 작업 순서 제안 (내 승인 후 시작)
```

---

## PART 2 — 웹 구현 (마케팅 + 포털)

```
계획 승인. 웹부터 구현해. 웹은 CSS를 진짜로 그대로 import할 수 있으니
"값 복사"가 아니라 "파일 그대로 사용"이야.

### 2-1. 마케팅 페이지
- site/concord.css를 한 글자도 고치지 말고 그대로 import. Tailwind 유틸로 옮겨 적거나
  styled-components로 재현하지 마.
- 마크업은 시안 .html(Concord - Green v2 / Blue, Pricing, Tutors, FAQ, Reviews, Login)의
  구조·class를 그대로 복사하고, 데이터만 기존 소스/CMS에 연결.
- concord.js의 동작(테마 토글·영속화, 헤더 스크롤, 스크롤 리빌, FAQ 아코디언, 탭)을 그대로 살려.
  React로 재구현할 경우 클래스 토글 방식을 동일하게.

### 2-2. 웹 포털 (선생님·매니저·학부모 데스크톱)
- web/portal.css 그대로 import.
- 시안: "Concord - 웹 포털.html"(선생님·매니저, body[data-role]로 역할 전환),
        "Concord - 웹 학부모.html"(학부모).
- 사이드바 셸(.shell > aside.side + main.main), 화면은 section.page 단위.
- 매니저 전용 화면·내비는 .mgr-only — data-role="manager"일 때만 노출.
- 테이블 .tbl, 상태 배지 .bst, 버튼 .btn/.btn.sec/.btn.ghost 클래스 그대로.
- 아이콘은 전부 app/icons.js에서 이름으로 (목록: "Concord - 아이콘 세트.html").

### 공통 규칙
- 폰트 Pretendard 1.3.9 고정. word-break:keep-all, letter-spacing, tabular-nums 누락 금지.
- 기존 데이터 바인딩(.map, CMS, DB)은 유지 — 마크업 구조·클래스·토큰만 교체.
- 페이지 하나 끝날 때마다: 같은 시안 .html을 브라우저로 열어 나란히 비교하고,
  reference/*.png 스크린샷과 대조. 그린/블루 × 라이트/다크 4조합 모두 확인.
  어긋난 곳(폰트·자간·여백·색·버튼 크기)은 시안 값으로 되돌려.
```

---

## PART 3 — 모바일 앱 (4역할)

```
이제 모바일 앱. RN은 CSS를 import할 수 없으니 handoff/app/concord-app.css의 값을
app-styles.ts(또는 테마 모듈)로 1:1 이식해 — 단위까지 그대로, 어림잡지 마.

### 대상 (흐름 상세: MOBILE_HANDOFF.md)
- 학생 앱: "Concord - 모바일 앱.html" — 온보딩→로그인→홈→학습(숙제·리포트)→질문→구독·결제→프로필
  · 질문 흐름: 학생이 질문하면 디폴트로 AI 답변 → 해결됐는지 선택 → 미해결 시 선생님 답변 대기.
    AI 토큰 소진 시 별도 알림이 아니라 AI 답변 자리에 "토큰 없음" 메시지 버블.
- 학부모 앱: "Concord - 학부모 앱.html" — 자녀 숙제 체크·선생님 메시지·결제. 학생 기능의 부분집합.
- 선생님 앱: "Concord - 선생님 앱.html" — 담당 학생·숙제 검사·질문 답변·코멘트.
- 매니저 앱: "Concord - 매니저 앱.html" — 모니터링·승인. 문제 없으면 개입하지 않는 구조.

### 규칙
- 토큰 4조합(green/blue × light/dark)을 테마 컨텍스트로. 저장 키 concord-color/concord-mode.
- 아이콘: react-native-svg로 icons.js의 ICONS[name].body path를 그대로 사용
  (viewBox 24×24, stroke-width, round caps/joins 동일 유지). 새로 그리지 마.
- 화면 크기 대응: 시안은 390pt 기준. 고정 px은 그대로 두고, 여백·리스트만 flex로 늘려.
  폰트 크기를 화면 크기에 비례시키지 마 (시안 값 고정).
- 삭제된 기능 넣지 마: "수업 입장하기" 버튼 없음, 선생님 목록 탐색 화면 없음.
- 상태바·노치 등 디바이스 프레임은 시안 쇼케이스용 — 실제 앱은 네이티브 상태바 사용.

### 검수
화면 하나 끝날 때마다 시안 HTML의 해당 화면과 나란히 비교.
버튼 크기·정렬 일관성(.btn 계열 높이 통일), 숫자 정렬(tabular-nums), 4조합 색 전환 확인.
```

---

## 사용 메모
- 각 파트를 보내기 전에 handoff/ 폴더가 프로젝트 루트에 있는지 확인.
- Claude Code가 "CSS를 열 수 없다"고 하면: `.css`/`.js`도 텍스트 파일이니 Read 도구로 그냥 읽으라고 답하면 됨.
- 중간에 디자인이 어긋나기 시작하면 IMPLEMENTATION_CONTRACT.md의 검수 체크리스트를 다시 실행하라고 지시.
