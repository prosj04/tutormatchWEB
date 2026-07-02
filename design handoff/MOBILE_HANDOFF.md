# Concord 모바일 앱 + 로고 — Claude Code 핸드오프

웹(랜딩·서브페이지)에 이어 **모바일 앱**과 **로고**를 같은 디자인 시스템으로 확장한 패키지입니다. 웹 핸드오프(`CLAUDE_HANDOFF.md`, `ROUTE_MAP.md`)와 **동일한 토큰**을 씁니다 — 새 디자인 언어가 아니라 같은 시스템의 연장입니다.

## 이 패키지 파일
- `Concord - 모바일 앱.html` + `app/concord-app.css` — iOS 18화면 시안 (전체 사용자 흐름: 온보딩·로그인·회원가입·무료상담·접수완료·선생님추천·미구독홈·플랜선택·결제·결제완료·홈·알림·학습·리포트·질문2·MY·구독관리)
- `Concord - 로고 키트.html` — 확정 로고 가이드 (락업·모노·여백·최소크기·파비콘·규칙)
- `tokens-reference.css` — 색·간격·타이포 토큰 원본 (웹/앱 공통)
- `DESIGN_SYSTEM.md` — 디자인 규칙서
- 웹: `CLAUDE_HANDOFF.md`, `ROUTE_MAP.md`, `site/concord.css`, `site/concord.js`

---

## 1. 로고 — 확정 사양

**Signature**: 워드마크 `Concord` + 액센트 닷. 닷은 항상 액센트 컬러(그린 `--acc-text` / 블루 `--acc-text`).

- **닷 = 브랜드 버그.** 떼어내 앱 아이콘(`C·`), 파비콘(닷), 워터마크로 사용.
- **CSS 구현** (해상도 무관, 토큰에 반응):
  ```html
  <span class="logo">Concord<i class="dot"></i></span>
  ```
  ```css
  .logo{ font-weight:800; letter-spacing:-.045em; display:inline-flex; align-items:baseline; }
  .logo .dot{ width:.16em; height:.16em; border-radius:50%; background:var(--acc-text); margin-left:.04em; display:inline-block; }
  ```
- **최소 크기**: 웹 120px / 모바일 88px. 이하에선 `C·` 또는 닷 버그.
- **여백**: 닷 지름 ×2.
- **금지**: 닷 제거/색변경, 자간·비율 변형, 그림자·외곽선, 저대비 배경 직접 배치.

### 내보내야 할 에셋 (RN/네이티브용)
| 용도 | 크기 | 형태 |
|---|---|---|
| iOS app icon | 1024² | `C·` 라운드 타일, 액센트 면 + 흰 글자 |
| Android adaptive | 432² (safe 264) | 동일, foreground=`C·` |
| Favicon | 16·32·48 | 닷 버그 |
| Apple touch | 180² | `C·` 타일 |
| Splash | 512² | `C·` 타일 + `Concord.` 워드마크 |

> 색별로 2세트(그린/블루) 뽑되, **기본 출시는 그린**. 닷/타일은 라이트·다크 공용(면 색이 충분히 진해 양쪽에서 또렷).

---

## 2. 모바일 앱 — 구조

### 권장 스택
- **React Native (Expo)** 권장 — iOS/Android 동시. 또는 기존 Next.js를 PWA로.
- 테마: `ThemeProvider`로 `color(green|blue) × mode(light|dark)` 4조합. 웹과 **같은 토큰 값** 재사용 → `tokens-reference.css`의 변수를 JS 객체(`theme.ts`)로 1:1 포팅.
- 저장 키 재사용: `concord-color`, `concord-mode` (웹과 동기화 가능).

### 토큰 → RN 매핑
CSS 변수를 그대로 객체로:
```ts
export const themes = {
  'green-light': { bg:'#FAF9F4', panel:'#FFFFFF', panel2:'#F0EFE7',
    line:'rgba(34,38,30,.085)', fg:'#161A16', mut:'#585C53',
    acc:'#10B981', onAcc:'#FFFFFF', accText:'#07875A', /* … */ },
  'blue-light':  { /* … */ }, 'green-dark': { /* … */ }, 'blue-dark': { /* … */ },
};
```
(정확한 값은 `tokens-reference.css` 4블록 그대로.)

### 화면 ↔ 라우트/컴포넌트
흐름 순서: **온보딩 → 로그인/회원가입 → 무료상담 → 접수완료 → 선생님추천 → 미구독홈 → 플랜선택 → 결제 → 결제완료 → (구독 후) 홈·학습·질문·MY·…**

| 시안 화면 | 라우트 | 데이터 소스 | 핵심 컴포넌트 |
|---|---|---|---|
| 온보딩 | `/onboarding` | — | `Logo`, `PrimaryButton`, `TrustRow` |
| 로그인 | `/login` | 인증(이메일·OAuth) | `AuthBrand`, `Field`, `SocialButton`(kakao/apple) |
| 회원가입 | `/signup` | 회원 생성 | `SubHeader`, `Field`, `AgreeText` |
| 무료 상담 신청 | `/consult` | 상담요청 생성 API | `Steps`, `Field`, `OptionGroup`, `StickyCTA` |
| 상담 접수 완료 | `/consult/done` | 상담요청 상태 | `StatusEmblem`, `StepTimeline`(세로) |
| 선생님 추천 | `/consult/match` | 매칭 결과(매니저) | `MatchBadge`, `RecTutorCard`(추천이유), `StickyCTA` |
| 미구독 홈 | `/(tabs)/home` (구독전) | 매칭상태·구독여부 | `EmptyState`, `LockedCard`(veil), `NowCard`(잠금), `StickyCTA` |
| 플랜 선택 | `/subscribe` | 플랜 목록 | `PlanPick`(radio·badge), `StickyCTA` |
| 결제 | `/checkout` | 주문·결제수단 | `OrderSummary`, `PayMethod`, `SecureNote`, `StickyCTA` |
| 결제 완료 | `/checkout/success` | 구독 확정 | `StatusEmblem`, `MetaCard` |
| 홈·투데이 | `/(tabs)/home` | 오늘수업·진도·내수업·일정 | `NowCard`(버튼없음), `ProgressRing`, `QuickActions`, `TutorRows`, `ScheduleList` |
| 알림 센터 | `/notifications` | 알림 목록 | `SubHeader`, `NotificationRow`(unread) |
| 내 학습 | `/(tabs)/learning` | 학습량·과제·리포트·토큰 | `WeekBars`, `AssignmentList`, `ReportSummary`, `TokenCard` |
| 학습 리포트 | `/reports/[id]` | 월간 리포트·점수·코멘트 | `ProgressRing`, `ScoreChangeRow`, `WeekBars`, `TeacherComment` |
| 질문 Q&A (AI 즉답) | `/(tabs)/qna/[tutorId]` | 메시지·AI 질답·토큰 | `ChatHeader`, `MessageBubble`(them/me/ai), `ResolvePrompt`, `Composer` |
| 질문 Q&A (토큰 소진) | `/(tabs)/qna/[tutorId]` | 토큰=0 상태 | `MessageBubble.ai.empty`(답변 대신 소진 안내), `Composer` |
| MY 마이페이지 | `/(tabs)/my` | 학부모·자녀·메뉴 | `MyHeader`, `ChildCard`, `MenuRow`, `Switch` |
| 구독·결제 관리 | `/billing` | 구독·결제내역 | `PlanCard`, `FeatureList`, `PaymentHistory`, `StickyCTA` |

### 탭 바
홈 · 학습 · 질문 · MY (**4탭**). 아이콘은 시안의 stroke SVG 사용. active=`--acc-text`. 서브페이지(로그인·회원가입·상담·접수·추천·플랜·결제·알림·리포트·구독)는 탭바 없이 back 헤더(`SubHeader`) 또는 풀스크린.

> **선생님 직접 찾기/예약 없음.** 서비스가 매니저 매칭 기반이라, 사용자는 선생님을 탐색·예약하지 않습니다. 진입은 ‘무료 상담 → 매니저 매칭(선생님 추천)’이고, 구독 후 홈·학습에서 배정 선생님을 관리합니다. ‘내 선생님’ 단독 화면은 두지 않고 홈/학습에 종속합니다.

### 구독 게이트
`subscription.status`로 분기: **미구독** → 미구독 홈(학습·리포트 잠금) + 플랜/결제 유도. **구독중** → 전체 기능 해제. 결제는 앱 스토어 IAP 정책 확인 필요(외부 결제 vs 인앱).

### AI 질답 토큰 로직
질문 시 기본은 AI가 먼저 답변(토큰 1 차감) → ‘해결됐어요 / 선생님께 질문’ 선택. 토큰 0이면 AI 답변 말풍선이 **답변 대신 소진 안내**를 표시하고, 이후 질문은 선생님 답변만 대기(별도 배너 없음).

### 동적/DB 주의
- **강사 사진**: 시안은 placeholder(줄무늬). 실제 이미지 URL로 교체, 검증 배지는 `verified===true`일 때만.
- **AI 질답 토큰**: 잔여 카운트는 사용자 구독/플랜에서. 0이면 입력 비활성 + 충전 유도.
- **요금/플랜**: 웹과 동일 소스(`pricing-plans.ts`) — 주1 380,000 / 주2 740,000. 앱 결제는 IAP 정책 확인 필요(외부 결제 vs 인앱).
- **선생님 매칭**: 직접 검색/예약 없음. 무료 상담 신청 → 매니저가 매칭 → ‘내 선생님’에 배정 노출. ‘내 선생님’ 화면의 액션은 예약이 아니라 메시지·일정.
- **실시간**: ‘오늘 수업’ 카드는 정보형(입장 버튼 없음) — 시작 전 푸시 알림으로 안내. 질문 채팅은 푸시 연동.

---

## 3. 컴포넌트 명세 (모바일 핵심)

- **NowCard(오늘 수업)**: 액센트 그라데이션 면 + 흰 텍스트. 강사 이니셜·과목·시각 + 풀폭 ‘입장’ 버튼(흰 배경/액센트 글자).
- **ProgressRing**: `conic-gradient(acc var(--p), panel-2 0)` + 안쪽 패널 원. RN은 `react-native-svg` Circle stroke-dasharray.
- **TutorCard**: 사진(라운드)+검증배지(우하단 체크), 이름+과목칩, 학력, 한줄, 하단 평점·경력·‘프로필 →’.
- **SlotGrid**: 3열 시간 슬롯. 선택=액센트 면, 비활성=`disabled` 흐림.
- **StickyCTA**: 하단 고정. 위에 무료 안내 한 줄 + 풀폭 액센트 버튼.
- **MessageBubble**: `them`(패널), `me`(액센트 면), `ai`(액센트 10% 틴트 + 라벨). 꼬리쪽 모서리만 5px.
- **TokenCard**: 아이콘 + 라벨 + 큰 숫자(`tabular-nums`, `--acc-text`).

타이포·반경·그림자·간격은 모두 `tokens-reference.css` / `DESIGN_SYSTEM.md` 따름. `word-break:keep-all`(RN은 한국어 줄바꿈 기본 양호하나 긴 단어 주의).

---

## 4. 작업 순서 (권장)
1. `theme.ts`에 4조합 토큰 포팅 + `ThemeProvider`/`useTheme` (웹 키 재사용).
2. 공통 프리미티브: `Logo`, `Button`, `Card`, `Icon`(SVG), 탭 네비게이터.
3. 정적 화면 먼저: 온보딩 → 프로필/예약(목업 슬롯).
4. 데이터 연결: 홈(오늘수업/진도) → 선생님 목록/상세 → 내 학습 → Q&A.
5. 로고 에셋 내보내기(위 표) + 스플래시/아이콘 설정.
6. 다크모드·블루 테마 QA (4조합 × 6화면 = 24 상태).

## 5. 하지 말 것
- 토큰 밖 색·간격·그림자 하드코딩.
- 닷 로고 변형(색·형태).
- 라이트를 다크의 반전으로 처리(각 조합은 독립 팔레트 — 값 그대로 사용).
- 강사 사진 placeholder를 실서비스에 노출.

---

## 참고: 아직 안 한 것 (다음 단계)
- 앱: 결제/구독, 온보딩 설문(성적·목표·성향), 푸시 알림 센터, MY(프로필·구독관리).
- 웹: 데이터 밀집형 화면 — `/dashboard`, `/teacher-portal/**`, `/admin/**`, `/checkout`·`/success` (같은 토큰 위 별도 컴포넌트 설계 필요).
