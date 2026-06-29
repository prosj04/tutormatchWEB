# Concord 웹/앱 사용자 흐름 재설계 v1

목표: 상담 신청 전환과 수업 시작 후 반복 사용(학습 루프)을 하나의 연속된 경험으로 통합한다.

---

## 1) 현재 기준 핵심 진단

- 웹은 전환(랜딩/상담/결제)과 운영(학생/교사/관리자) 기능이 강함.
- 앱은 학습 루프(홈/학습/질문/MY) 중심이지만 일부 기능은 정적 UI/미연결 상태가 남아 있음.
- 사용자 입장에서 가장 큰 단절은 `상담 신청 완료 이후 다음 행동(계정 생성/로그인/상태 추적)`이 매끄럽지 않은 구간.

---

## 2) 재설계 원칙

- 한 사용자 퍼널로 본다: 획득 -> 상담 -> 계정 연결 -> 매칭 상태 -> 수업 시작 -> 학습 루프.
- 빈 값은 에러가 아니라 상태로 취급한다.
- 모든 상태 화면에 최소 1개의 명확한 CTA를 둔다.
- 웹/앱에서 동일 상태명, 동일 설명 문구를 사용한다.
- 화면은 로딩/빈값/오류를 반드시 분리한다.

---

## 3) 통합 퍼널 설계

### 단계 1. 획득(웹 중심)

- 진입: 랜딩, 가격, 튜터, 리뷰, FAQ
- 목적: 상담 신청 CTA 클릭
- 대표 화면: `src/app/(home)/page.tsx`, `src/app/pricing/page.tsx`, `src/app/tutors/page.tsx`

### 단계 2. 상담 신청(웹/앱 공통)

- 입력 최소화: 학년, 과목, 현재 성취도, 목표/메모
- 완료 즉시 노출: 접수 완료/예상 연락 시간/다음 단계
- 대표 화면:
  - 웹 학생 상담: `src/app/dashboard/consultation/page.tsx`
  - 앱 상담: `mobile/app/consult/index.tsx`, `mobile/app/consult/done.tsx`

### 단계 3. 계정 연결

- 상담 이후 계정이 없으면 즉시 회원가입/로그인으로 연결
- 로그인 후 랜딩은 "내 상태" 기준으로 분기
- 대표 화면:
  - 웹 로그인: `src/app/login/LoginForm.tsx`
  - 앱 로그인/회원가입: `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/signup.tsx`

### 단계 4. 매칭 상태 추적

- 공통 상태 enum 제안:
  - `WAITING`: 상담 접수/배정 대기
  - `ASSIGNED`: 매니저 배정 완료
  - `MATCHING`: 선생님 매칭 진행
  - `ACTIVE`: 수업 진행
- 대표 구현 참고:
  - 상담 상태 UI: `src/components/dashboard/ConsultationBookingPage.tsx`

### 단계 5. 학습 루프(앱 중심)

- 홈(오늘 수업/주간 진행률) -> 학습(과제/리포트) -> 질문(QnA) -> MY(결제/설정)
- 대표 화면:
  - `mobile/app/(tabs)/index.tsx`
  - `mobile/app/(tabs)/learning.tsx`
  - `mobile/app/(tabs)/qna.tsx`
  - `mobile/app/(tabs)/my.tsx`

---

## 4) 화면별 실행 스펙 (진입조건 / API / 빈값 / CTA / 이벤트)

## A. 앱 홈 (`mobile/app/(tabs)/index.tsx`)

- 진입조건
  - 로그인 사용자(STUDENT), access token 보유
- API
  - `GET /api/mobile/home` (`src/app/api/mobile/home/route.ts`)
- 필수 표시
  - 오늘 수업, 다가오는 일정, 주간 달성률, 빠른 액션
- 빈값 처리
  - `todayLesson = null`: "오늘 예정된 수업이 없어요"
  - `upcoming = []`: "예정된 일정이 아직 없어요"
  - `weekProgress.total = 0`: "이번 주 과제가 아직 등록되지 않았어요"
- CTA
  - 상담 상태 보기, 수업 일정 요청, 질문 남기기
- 이벤트
  - `home_viewed`
  - `home_empty_today_lesson_viewed`
  - `home_cta_clicked` (payload: cta_name)

## B. 앱 학습 (`mobile/app/(tabs)/learning.tsx`)

- 진입조건
  - 로그인 사용자(STUDENT)
- API
  - `GET /api/mobile/learning/weekly`
  - `GET /api/mobile/me/tokens`
  - `GET /api/mobile/reports`
- 빈값 처리
  - `taskItems = []`: "이번 주 등록된 과제가 없어요"
  - `report = null`: "아직 리포트가 없어요. 첫 수업 후 제공됩니다."
  - `tokens.remaining` 미확정: 숫자 대신 "준비 중"
- CTA
  - 리포트 생성 알림 받기(또는 상담/담당선생님 문의)
- 이벤트
  - `learning_viewed`
  - `learning_empty_tasks_viewed`
  - `learning_empty_report_viewed`

## C. 앱 질문 (`mobile/app/(tabs)/qna.tsx`)

- 진입조건
  - 로그인 사용자(STUDENT)
- API(목표)
  - 질문 목록/대화 조회, 질문 생성, AI 답변/선생님 전환 상태
- 빈값 처리
  - 배정 선생님 없음: "아직 배정된 선생님이 없어요"
  - 대화 없음: "첫 질문을 남겨보세요"
  - 토큰 소진: "이번 달 AI 즉답 토큰을 모두 사용했어요"
- CTA
  - 선생님께 질문하기, 상담 상태 보기, 토큰/플랜 안내
- 이벤트
  - `qna_viewed`
  - `qna_empty_no_teacher_viewed`
  - `qna_first_question_clicked`

## D. 웹 학생 대시보드 (`src/app/dashboard/page.tsx`)

- 진입조건
  - 인증됨 + role=STUDENT
- 분기
  - 매칭 선생님 없음 -> `/dashboard/consultation`으로 이동
- 빈값 처리
  - 플랜/질문/할일이 없는 날짜는 "오늘 계획이 아직 없습니다" + 생성 CTA
- 이벤트
  - `web_dashboard_viewed`
  - `web_dashboard_redirect_consultation`

## E. 웹/앱 상담 완료 직후

- 진입조건
  - 상담 신청 성공 직후
- 빈값 처리
  - 아직 계정 미연결이면 "상태 알림 받기 위해 계정 연결" 안내
- CTA 우선순위
  - 1) 계정 생성/로그인
  - 2) 상담 상태 보기
  - 3) 홈 이동
- 이벤트
  - `consultation_submitted`
  - `consultation_post_signup_clicked`
  - `consultation_status_view_clicked`

---

## 5) 초기 빈 값 처리 표준 문구

- 원칙
  - 금지: "데이터가 없습니다"
  - 권장: "아직 없음 + 왜 그런지 + 다음 행동"

- 예시
  - 수업 없음: "아직 배정된 수업이 없어요. 상담 진행 상태를 확인해 보세요."
  - 일정 없음: "다가오는 일정이 없어요. 매니저 배정 후 자동으로 표시됩니다."
  - 과제 없음: "이번 주 과제가 아직 등록되지 않았어요. 선생님이 곧 계획을 올려드립니다."
  - 리포트 없음: "첫 리포트 생성 전입니다. 첫 수업 이후 제공됩니다."
  - 질문 없음: "첫 질문을 남겨보세요. AI/선생님 답변을 받을 수 있어요."

---

## 6) 구현 우선순위

### P0 (이번 스프린트)

- 앱 홈 빠른 액션 미연결 버튼 연결 (`리포트`, `질문`)
  - 대상: `mobile/app/(tabs)/index.tsx`
- 앱 QnA를 실제 API 기반 상태로 연결
  - 대상: `mobile/app/(tabs)/qna.tsx`, `src/app/api/mobile/qna/[tutorId]/route.ts`
- 상담 완료 후 계정 연결 CTA 강화
  - 대상: `mobile/app/consult/done.tsx`

### P1 (다음 스프린트)

- 상태 enum 통일 및 공통 상태 카피 적용(웹/앱)
- 빈값 컴포넌트 공통화(EmptyState)
- 이벤트 로깅 표준화

### P2 (구조 개선)

- 웹/앱 인증 전환 UX 통합
- 매칭 상태 전용 화면(또는 공통 카드) 설계

---

## 7) QA 체크리스트

- 로그인 직후 사용자는 자신의 상태에 맞는 화면으로 도착하는가?
- 빈값 화면마다 다음 행동 CTA가 1개 이상 있는가?
- 로딩/빈값/오류가 서로 다른 UI로 보이는가?
- 웹/앱에서 같은 상태를 같은 용어로 설명하는가?
- 상담 신청 후 "사용자가 다음에 해야 할 일"이 3초 내 이해되는가?

---

## 8) 첨부: 상태 기반 첫 진입 라우팅 제안

- `PRE_SIGNUP` -> 웹 랜딩 또는 앱 온보딩
- `ONBOARDED` -> 상담 신청 화면
- `WAITING`/`ASSIGNED`/`MATCHING` -> 상담 상태 추적 화면
- `ACTIVE` -> 학생 대시보드(웹) 또는 앱 탭 홈

이 라우팅은 웹의 `role` 분기와 별개로 "학생의 학습 단계"를 기준으로 동작해야 한다.
