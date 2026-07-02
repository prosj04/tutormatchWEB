# Concord 사용자별 앱·웹 흐름 (User Flow)

> 최종 업데이트: 2026-06-30  
> 학부모 페이지 미구현 — 현재 학생·선생님·매니저·관리자 흐름만 포함.

---

## 목차
1. [전체 시스템 구조](#1-전체-시스템-구조)
2. [학생 — 웹 흐름](#2-학생--웹-흐름)
3. [학생 — 모바일 앱 흐름](#3-학생--모바일-앱-흐름)
4. [선생님 — 웹 흐름](#4-선생님--웹-흐름)
5. [매니저 — 웹 흐름](#5-매니저--웹-흐름)
6. [관리자(Admin) — 웹 흐름](#6-관리자admin--웹-흐름)
7. [학생 여정 단계(Journey Stage)](#7-학생-여정-단계journey-stage)
8. [알림 시스템](#8-알림-시스템)
9. [API 엔드포인트 요약](#9-api-엔드포인트-요약)

---

## 1. 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  사용자 종류          접근 경로               플랫폼             │
├─────────────────────────────────────────────────────────────────┤
│  학생(STUDENT)        /dashboard             웹 + 모바일 앱     │
│  선생님(TEACHER)      /teacher-portal        웹 only            │
│  매니저(MANAGER)      /teacher-portal        웹 only            │
│  관리자(ADMIN)        /admin                 웹 only            │
│  미인증               / (랜딩)               웹 only            │
└─────────────────────────────────────────────────────────────────┘
```

로그인 후 역할별 자동 리다이렉트:
- `STUDENT` → `/dashboard`
- `TEACHER` / `MANAGER` → `/teacher-portal/dashboard`
- `ADMIN` → 별도 링크 접근 (`/admin`)

---

## 2. 학생 — 웹 흐름

### 2-A. 최초 진입 (미가입)

```
랜딩(/) 
  ├─ 서비스 소개, 요금표, 선생님 목록, FAQ, 후기
  ├─ [무료 상담 신청] 버튼 클릭
  │     → ConsultationSignupForm 모달 팝업
  │         ├─ 학생 이름, 학년, 과목, 일정, 방문 시간 입력
  │         └─ 제출 → /api/consultation/request
  │               → 미가입 시: 계정 자동 생성 + 상담 예약 DB 기록
  │               → 이미 가입: 기존 계정에 상담 연결
  │
  ├─ [요금 보기] → /pricing (플랜 상세, 과목수×횟수별 금액)
  ├─ [선생님 보기] → /tutors (선생님 목록, 카드)
  │     └─ 선생님 클릭 → /tutors/[id] (프로필 상세)
  └─ [로그인] → /login → 이메일+비밀번호
```

### 2-B. 상담 대기 단계 (WAITING / ASSIGNED)

```
로그인 → /dashboard 
  └─ 상담 진행 상태 배너 표시 (JourneyStage)
       ├─ ONBOARDED: "아직 상담 신청 전" + [상담 신청하기] CTA
       ├─ WAITING: "상담 접수·배정 대기" + 방문 시간 입력 유도
       │     → /dashboard/consultation (방문 희망 시간 입력 화면)
       │           └─ /api/consultation/visit-times PATCH
       └─ ASSIGNED: "매니저 배정 완료" + 매니저 이름 표시
```

### 2-C. 선생님 배정 후 대시보드 (ACTIVE)

```
/dashboard (학습 플래너)
  ├─ 좌측 사이드바 (lg 이상)
  │     ├─ 월 달력 (날짜 선택, 계획 있는 날 표시)
  │     ├─ [내 질문 목록] → /questions
  │     └─ [결제·구독 내역] → /payments
  │
  ├─ 상단 TopBar
  │     ├─ Concord. 로고 → /dashboard
  │     ├─ "OOO님의 학습 플래너"
  │     ├─ 다크/라이트/컬러 토글
  │     ├─ 🔔 알림 벨 → 드롭다운 (최근 10개)
  │     │     └─ [전체 알림 보기] → /notifications
  │     └─ [로그아웃]
  │
  └─ 메인 콘텐츠 (날짜별 학습 계획)
        ├─ 날짜 없음: [학습 계획 만들기] → POST /api/plans
        ├─ 계획 있음: 할 일 목록 (체크, 수정, 삭제, 순서 변경)
        │     ├─ + 할 일 추가 → POST /api/plans/:id/tasks
        │     └─ 이전 계획 복사 → /api/plans/copy
        └─ Q&A 패널
              ├─ 질문 등록 (텍스트 + 이미지 첨부)
              ├─ AI 즉답 (토큰 1개 차감) → /api/questions/:id/ai-answer
              └─ 선생님 답변 대기
```

### 2-D. 결제·구독

```
/checkout (결제 화면)
  ├─ 쿼리스트링: ?sessions=4|8&subjects=1|2&tutor=1
  ├─ 플랜 요약 카드 + 토스페이먼츠 결제 위젯
  ├─ 미로그인: 결제 전 회원가입/로그인 유도
  └─ 결제 완료 → /api/payments/complete (웹훅)
        → Subscription 레코드 생성 + 토큰 지갑 할당
        → /success?paymentKey=...&orderId=...

/payments (구독·결제 내역)
  ├─ 현재 활성 구독 카드 (플랜명, 금액, 시작/만료일)
  ├─ AI 질답 토큰 잔여량 (이번 달)
  └─ 구독 이력 리스트 (전체)
```

### 2-E. 알림·질문 전용 페이지

```
/notifications (알림 센터)
  ├─ 날짜별 그룹 목록 (최근 100개)
  ├─ 읽음/안읽음 구분 (배경색)
  ├─ [모두 읽음 표시] 버튼
  └─ 알림 클릭 → 해당 링크로 이동 + 읽음 처리

/questions (내 질문 목록)
  ├─ 탭 필터: 전체 / 미해결 / 해결됨
  ├─ 질문 카드: 내용 미리보기 + 답변 상태 배지
  │     ├─ 선생님 답변 (파란 배지)
  │     ├─ AI 답변 (회색 배지)
  │     └─ 답변 대기 (노란 배지)
  └─ 카드 클릭 → /dashboard?date=YYYY-MM-DD (해당 날짜로 이동)
```

---

## 3. 학생 — 모바일 앱 흐름

### 3-A. 인증 플로우 (최초 실행)

```
앱 실행
  └─ 토큰 확인 (AsyncStorage)
        ├─ 없음 → (auth)/onboarding
        │     ├─ Concord 브랜딩 + 슬로건
        │     ├─ [무료 상담 시작] → (auth)/signup
        │     └─ [이미 계정 있음] → (auth)/login
        │
        ├─ (auth)/signup
        │     ├─ 이름, 이메일, 비밀번호 입력
        │     └─ POST /api/mobile/auth/register
        │           → 성공: 토큰 저장 → (tabs)/ 리다이렉트
        │
        └─ (auth)/login
              ├─ 이메일 + 비밀번호
              └─ POST /api/mobile/auth/login
                    → accessToken + refreshToken 저장
                    → (tabs)/ 리다이렉트
```

### 3-B. 홈 탭 — `(tabs)/index` ★ 진입점

```
홈 탭 (GET /api/mobile/home)
  ├─ 상단 AppBar
  │     ├─ "안녕하세요 👋 + 학생 이름"
  │     └─ 🔔 알림 버튼 → /notifications (미읽음 뱃지)
  │
  ├─ 여정 배너 (Journey Stage)
  │     ├─ ONBOARDED: [무료 상담 신청] → /consult
  │     ├─ WAITING/ASSIGNED: 상담 진행 현황 → /consult/status
  │     └─ ACTIVE: 숨김 (오늘 수업 카드로 대체)
  │
  ├─ 오늘 수업 카드 (NowCard)
  │     ├─ 수업 있음: 선생님 이름, 과목, 시각
  │     └─ 없음: EmptyState "오늘 예정된 수업이 없어요"
  │
  ├─ 이번 주 달성률 ProgressRing (완료 할일 / 전체)
  │
  ├─ 내 선생님 (TeacherRow) → /teacher/[id]
  │
  └─ 다가오는 일정 (ScheduleList, 최대 5개)
```

### 3-C. 학습 탭 — `(tabs)/learning`

```
학습 탭
  ├─ GET /api/mobile/learning/weekly (이번 주 과제)
  ├─ GET /api/mobile/me/tokens (AI 토큰 잔여)
  └─ GET /api/mobile/reports (최신 리포트 요약)

화면 구성:
  ├─ 이번 주 학습 막대그래프 (WeekBars, 7일 달성률)
  │
  ├─ AI 질답 토큰 카드
  │     └─ 잔여 N개 / 총 M개 (이번 달)
  │
  ├─ 이번 주 과제 (할 일 체크리스트)
  │     ├─ 선생님이 작성한 StudyTask 목록
  │     └─ 없으면 EmptyState "아직 등록되지 않았어요"
  │
  └─ 월간 학습 리포트 (최신 1개)
        ├─ 리포트 있음: 월 라벨, 취약 유형 요약, [전체 보기]
        │     → /report/[id] (상세)
        └─ 없음: EmptyState "첫 리포트 생성 전입니다"
```

### 3-D. 리포트 상세 — `/report/[id]`

```
/report/[month] (GET /api/mobile/reports)
  ├─ ProgressRing (전체 달성률 %)
  ├─ 점수 변화 (과목별 전월 대비)
  ├─ WeekBars (해당 월 주간 완료율)
  ├─ 취약 유형 목록
  └─ 선생님 코멘트
```

### 3-E. Q&A 탭 — `(tabs)/qna`

```
Q&A 탭 (GET /api/mobile/qna)
  ├─ 내 선생님 목록 (TeacherRow)
  │     └─ 선생님 없음: EmptyState "아직 배정된 선생님이 없어요"
  │           + [상담 진행 상태 보기] → /consult/status
  │
  └─ 선생님 선택 → /qna/[tutorId]

/qna/[tutorId] (채팅 화면)
  ├─ GET /api/mobile/qna/[tutorId] (질문 메시지 목록)
  ├─ 메시지 버블
  │     ├─ 내 질문 (오른쪽, 액센트 배경)
  │     ├─ AI 답변 (왼쪽, 액센트 10% 틴트 + "AI" 라벨)
  │     └─ 선생님 답변 (왼쪽, 패널 배경)
  │
  ├─ 토큰 잔여 표시 (질문 입력창 상단)
  │
  ├─ 질문 입력 (텍스트 + 이미지 첨부)
  │     ├─ 토큰 > 0: 전송 → AI 즉답 → POST /api/questions
  │     └─ 토큰 = 0: 전송 → 선생님 답변 대기 (AI 없음)
  │
  └─ 해결됨 표시 → PATCH /api/questions/[id]
```

### 3-F. My 탭 — `(tabs)/my`

```
My 탭 (GET /api/mobile/me)
  ├─ 학생 프로필 헤더
  │     ├─ 이름 이니셜 아바타
  │     ├─ 이름 (학생명)
  │     ├─ 학년 · 과목 (예: 중3 · 수학·영어)
  │     ├─ 이메일
  │     └─ 수강 상태 배지 (수강 중 / 구독 중 / 상담 진행 중)
  │
  ├─ [관리] 섹션
  │     ├─ 💳 구독·결제 → /billing (플랜명, 다음 결제일 부제목)
  │     ├─ 🔔 알림 → /notifications
  │     ├─ 📊 학습 리포트 → /report/[latestMonth]
  │     └─ 📋 상담 진행 상태 → /consult/status
  │
  ├─ [설정] 섹션
  │     ├─ ❓ 고객센터 → mailto:hello@concord.school
  │     ├─ 📄 이용약관 → 웹 /terms
  │     └─ 🔒 개인정보 처리방침 → 웹 /privacy
  │
  └─ [로그아웃] → 토큰 삭제 → /onboarding
```

### 3-G. 구독·결제 — `/billing`

```
/billing (GET /api/mobile/me)
  ├─ 구독 있음:
  │     ├─ 현재 플랜 카드 (액센트 배경)
  │     │     ├─ 플랜명 (예: 1과목 · 주 2회)
  │     │     ├─ 금액 (예: 720,000원 / 월)
  │     │     └─ 다음 결제일
  │     ├─ 플랜에 포함 (기능 리스트, ✓ 체크)
  │     └─ 구독 정보 (플랜 · 상태 · 만료일)
  │           + "영수증 및 세부 내역은 담당 매니저에게 문의"
  │
  ├─ 구독 없음: EmptyState "현재 구독 중인 플랜이 없어요"
  │
  └─ 하단 CTA [플랜 변경 · 상담 신청] → /consult/status
```

### 3-H. 상담 흐름 — `/consult/*`

```
/consult (상담 신청 폼)
  ├─ 학년, 과목, 주 횟수, 방문 희망 시간 선택
  └─ POST /api/mobile/consultation
        → ConsultationBooking 레코드 생성
        → /consult/done (접수 완료)

/consult/done (접수 완료)
  ├─ 세로 타임라인: 상담 접수 ✓ → 매니저 배정 → 선생님 매칭 → 수업 시작
  └─ [상태 확인하기] → /consult/status

/consult/status (상담 진행 현황)
  ├─ GET /api/mobile/me/journey
  ├─ ONBOARDED: 상담 미신청 → [상담 신청하기] CTA
  ├─ WAITING: 배정 대기 → 배지 + 안내 문구
  ├─ ASSIGNED: 매니저 배정 완료 → 담당자 이름 표시
  ├─ MATCHING: 선생님 찾는 중
  └─ ACTIVE: 수업 시작 → [홈으로 이동] CTA

/consult/match (선생님 추천)
  ├─ 추천 선생님 카드 (사진, 이름, 학력, 과목)
  └─ [선생님 프로필 보기] → /teacher/[id]
```

### 3-I. 알림 — `/notifications` (모바일)

```
/notifications (GET /api/mobile/notifications)
  ├─ 알림 리스트 (최신 순)
  ├─ 읽음/안읽음 구분
  ├─ 알림 탭 → 해당 화면 이동 + 읽음 처리
  └─ 빈 상태: "알림이 없습니다"
```

---

## 4. 선생님 — 웹 흐름

### 4-A. 지원 및 가입

```
/teacher-portal (랜딩)
  └─ [선생님 지원하기] → /teacher-portal/apply
        ├─ 이름, 연락처, 학력, 경력, 담당 과목 입력
        ├─ POST /api/register/teacher
        └─ 승인 대기 (status: PENDING)
```

### 4-B. 승인 후 대시보드

```
로그인 → /teacher-portal/dashboard
  ├─ 상단 네비게이션 탭
  │     ├─ [학생 관리]
  │     ├─ [상담 관리]
  │     ├─ [매칭 현황]
  │     ├─ [모니터링]
  │     └─ [내 프로필]
  │
  ├─ /teacher-portal/dashboard/students (학생 관리)
  │     ├─ 배정된 학생 목록
  │     ├─ 학생 클릭 → 학습 계획 조회
  │     │     ├─ GET /api/teacher/students/[id]/plans
  │     │     └─ 계획별 코멘트 작성 → POST /api/teacher/plans/[id]/comment
  │     └─ 질문 답변 → GET /api/teacher/students/[id]/questions
  │           └─ 답변 작성 → PATCH /api/teacher/questions/[id]/answer
  │
  ├─ /teacher-portal/dashboard/consultations (상담 관리)
  │     ├─ 배정된 상담 목록 (WAITING / ASSIGNED)
  │     ├─ [배정] → PATCH /api/manager/consultations/[id]/assign
  │     └─ [완료] → PATCH /api/manager/consultations/[id]/complete
  │
  ├─ /teacher-portal/dashboard/matching (매칭 현황)
  │     └─ 현재 매칭 상태 + 학생-선생님 연결 정보
  │
  ├─ /teacher-portal/dashboard/monitoring (모니터링)
  │     └─ GET /api/manager/monitoring/stats (통계 대시보드)
  │
  └─ /teacher-portal/dashboard/profile (내 프로필)
        ├─ 기본정보, 자기소개, 사진 업로드
        └─ PUT /api/teacher/profile
```

---

## 5. 매니저 — 웹 흐름

> 매니저는 `MANAGER` 역할. 선생님 포털과 동일한 URL 사용, 추가 권한 보유.

```
/teacher-portal/dashboard
  ├─ [상담 관리] — 대기 상담 목록 확인
  │     ├─ GET /api/manager/consultations/waiting
  │     ├─ [내 상담으로 배정] → PATCH /api/manager/consultations/[id]/assign
  │     ├─ [방문 시간 확정]
  │     └─ [상담 완료] → PATCH /api/manager/consultations/[id]/complete
  │
  ├─ [매칭 관리]
  │     ├─ GET /api/manager/matches
  │     └─ 학생-선생님 매칭 생성/취소 → POST /api/manager/matches
  │
  └─ [모니터링]
        └─ 전체 학생·선생님·상담 통계
              GET /api/manager/monitoring/stats
              (샘플 계정 [sample] 자동 필터링)
```

---

## 6. 관리자(Admin) — 웹 흐름

```
/admin (관리자 홈)
  ├─ /admin/students (학생 관리)
  │     ├─ 전체 학생 목록 (샘플 계정 필터 적용)
  │     └─ 학생 상세 → 구독 상태, 질문, 플랜 조회
  │
  ├─ /admin/teachers (선생님 관리)
  │     ├─ 선생님 목록 (승인 대기 포함)
  │     └─ [승인 / 역할 변경] → PATCH /api/admin/teachers/[id]/role
  │
  ├─ /admin/matches (매칭 관리)
  │     └─ 학생-선생님 연결 생성·해제
  │
  ├─ /admin/cms (CMS 콘텐츠 관리)
  │     ├─ 랜딩 히어로 문구, stats 수치, FAQ, 후기 편집
  │     └─ 이미지 업로드 → Supabase Storage
  │
  └─ /admin/data (데이터 조회)
        └─ 플랜·질문 전체 조회 (디버깅용)
```

---

## 7. 학생 여정 단계(Journey Stage)

학생의 서비스 상태를 6단계로 추적. 웹 대시보드와 모바일 홈 탭 모두 동일한 로직 사용.

| Stage | 조건 | 웹 표시 | 모바일 표시 |
|---|---|---|---|
| `PRE_SIGNUP` | 학생 레코드 없음 | 상담 신청 CTA | 회원가입 유도 |
| `ONBOARDED` | 계정은 있지만 상담 신청 전 | 상담 신청 배너 | 홈 배너 + [상담 신청] |
| `WAITING` | 상담 접수, 매니저 미배정 | "배정 대기" 상태바 | 배너 + /consult/status |
| `ASSIGNED` | 매니저 배정 완료 | 매니저 이름, 방문 시간 입력 유도 | 매니저 이름 표시 |
| `MATCHING` | 상담 완료, 선생님 매칭 중 | "선생님 찾는 중" | 진행 중 표시 |
| `ACTIVE` | 선생님 1명 이상 배정 완료 | 전체 대시보드 활성화 | 오늘 수업·학습·Q&A |

단계 산출 로직 (`src/lib/student-journey.ts`):
```
activeTeacherCount > 0  →  ACTIVE
booking 없음            →  ONBOARDED
booking.WAITING         →  WAITING
booking.ASSIGNED        →  ASSIGNED
booking.COMPLETED       →  MATCHING
booking.CANCELLED       →  ONBOARDED (재신청 가능)
```

---

## 8. 알림 시스템

알림 트리거 및 링크 연결 (`src/lib/notifications.ts`):

| 알림 타입 | 트리거 | 이동 경로 |
|---|---|---|
| `TEACHER_ANSWER` | 선생님이 질문에 답변 | `/dashboard?date=YYYY-MM-DD` |
| `AI_ANSWER` | AI 즉답 완료 | `/dashboard?date=YYYY-MM-DD` |
| `PLAN_COMMENT` | 선생님이 학습 계획 코멘트 | `/dashboard?date=YYYY-MM-DD` |
| `LESSON_REMINDER` | 수업 1시간 전 (크론) | `/dashboard` |
| `SUBSCRIPTION_EXPIRY` | 구독 만료 D-7 (크론) | `/payments` |

크론: `/api/cron/check-alerts` — 매일 00:00 UTC 실행 (vercel.json 설정)

---

## 9. API 엔드포인트 요약

### 학생 웹
| 메서드 | 경로 | 기능 |
|---|---|---|
| GET | `/api/plans` | 월간 날짜 목록 + 날짜별 계획 조회 |
| POST | `/api/plans` | 날짜별 학습 계획 생성 |
| POST | `/api/plans/:id/tasks` | 할 일 추가 |
| PATCH | `/api/plans/tasks/:taskId` | 할 일 수정 (제목/완료) |
| DELETE | `/api/plans/tasks/:taskId` | 할 일 삭제 |
| PATCH | `/api/plans/:id/tasks` | 할 일 순서 변경 |
| POST | `/api/plans/copy` | 이전 날짜 계획 복사 |
| GET/POST | `/api/questions` | 질문 목록 조회 / 신규 질문 |
| PATCH | `/api/questions/:id` | 질문 해결 처리 |
| POST | `/api/questions/:id/ai-answer` | AI 즉답 요청 (토큰 차감) |
| GET | `/api/notifications` | 알림 목록 + 미읽음 수 |
| PATCH | `/api/notifications/:id/read` | 개별 알림 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 |

### 모바일 앱 (JWT 인증)
| 메서드 | 경로 | 기능 |
|---|---|---|
| POST | `/api/mobile/auth/register` | 회원가입 |
| POST | `/api/mobile/auth/login` | 로그인 (토큰 발급) |
| POST | `/api/mobile/auth/refresh` | 액세스 토큰 갱신 |
| GET | `/api/mobile/home` | 홈 탭 집계 (수업·일정·미읽음) |
| GET | `/api/mobile/me` | 프로필 + 구독 + 여정 단계 |
| GET | `/api/mobile/me/tokens` | AI 토큰 잔여량 |
| GET | `/api/mobile/me/journey` | 여정 단계 상세 |
| GET | `/api/mobile/learning/weekly` | 이번 주 과제·달성률 |
| GET | `/api/mobile/reports` | 최신 월간 리포트 |
| GET | `/api/mobile/qna` | 내 선생님 Q&A 목록 |
| GET/POST | `/api/mobile/qna/:tutorId` | 선생님별 Q&A / 질문 전송 |
| GET | `/api/mobile/lessons` | 수업 목록 |
| GET | `/api/mobile/notifications` | 알림 목록 |
| POST | `/api/mobile/consultation` | 상담 신청 |
| POST | `/api/mobile/push/register` | 푸시 디바이스 등록 |

---

## 미구현 / 추후 과제

| 항목 | 설명 |
|---|---|
| 학부모 포털 | 현재 학생 전용만 구현. 학부모 역할 추가 시 별도 포털 필요 |
| 앱 내 결제 (IAP) | iOS/Android 스토어 정책으로 인앱결제 vs 외부결제 정책 결정 필요 |
| 실시간 채팅 | 현재 폴링 방식. WebSocket / SSE 전환 검토 |
| 선생님 예약 시스템 | 현재 매니저 중개 방식. 직접 예약 기능 없음 |
| 푸시 알림 연동 | PushDevice 모델 있음. FCM/APNs 실제 발송 구현 필요 |
| 학습 리포트 자동화 | 현재 수동 생성. 월말 자동 생성 크론 추가 가능 |
| 결제 내역 모델 | Payment 테이블 없음. Toss 웹훅 연동 시 추가 필요 |
