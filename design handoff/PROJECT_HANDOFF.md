# Concord 프로젝트 핸드오프

> 작성일: 2026-07-02  
> 현재 브랜치: `main` | 배포: Vercel Production (`tutormatch-web.vercel.app`)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 & 인프라](#2-기술-스택--인프라)
3. [계정 정보](#3-계정-정보)
4. [코드베이스 구조](#4-코드베이스-구조)
5. [DB 모델 요약](#5-db-모델-요약)
6. [역할(Role) 시스템](#6-역할role-시스템)
7. [학생 여정 단계 (Journey Stage)](#7-학생-여정-단계-journey-stage)
8. [사용자별 앱·웹 흐름](#8-사용자별-앱웹-흐름)
   - 8-A. 학생 — 모바일 앱
   - 8-B. 학생 — 웹 대시보드
   - 8-C. 선생님 — 웹 포털
   - 8-D. 매니저 — 웹 포털
   - 8-E. Chief Manager — 통합 관리
   - 8-F. 관리자(Admin) — 어드민 패널
9. [API 엔드포인트 맵](#9-api-엔드포인트-맵)
10. [알림 시스템](#10-알림-시스템)
11. [성능 & 인프라 메모](#11-성능--인프라-메모)
12. [미완성·추후 과제](#12-미완성추후-과제)

---

## 1. 프로젝트 개요

**Concord** — 프리미엄 1:1 과외 플랫폼.

학생이 무료 상담을 신청하면 매니저가 대면 상담을 진행하고 선생님을 배정한다.  
학생이 앱에서 배정된 선생님을 **수락**해야 수업이 시작된다.  
수업 중 과제 배분·질문·AI 즉답·월간 리포트 기능을 제공한다.

### 핵심 플로우 요약

```
학생 가입 → 무료 상담 신청 → 매니저 배정 → 대면 상담
→ 선생님 매칭 → 학생 앱에서 수락 → 첫 수업 일정 설정 → 수업 시작
```

---

## 2. 기술 스택 & 인프라

| 항목 | 스택 |
|------|------|
| 웹 프레임워크 | Next.js 14.2 (App Router) |
| 모바일 앱 | Expo (React Native), Expo Router v3 |
| DB | Supabase PostgreSQL (`ap-northeast-2` 서울) |
| ORM | Prisma 5.22 |
| 인증 웹 | NextAuth v5 (Credentials, JWT) |
| 인증 모바일 | 자체 JWT (`/api/mobile/auth/*`) |
| 이미지 저장 | Supabase Storage |
| 배포 | Vercel Production (`icn1` 서울 리전 고정) |
| 스타일 | `concord-app.css` (모바일) / `concord.css` (웹), Pretendard 1.3.9 |
| 푸시 알림 | Expo Push (`expo-server-sdk`) |

### 환경변수 (`.env`)

```
DATABASE_URL       Supabase Transaction Pooler (port 6543)
DIRECT_URL         Supabase Direct (port 5432, 마이그레이션 전용)
NEXTAUTH_SECRET    JWT 서명 키
NEXTAUTH_URL       https://tutormatch-web.vercel.app/
NEXT_PUBLIC_SUPABASE_URL   Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CHIEF_MANAGER_EMAIL  (선택) 결제 즉시 배정될 chief 매니저 이메일
```

---

## 3. 계정 정보

| 역할 | 이메일 | 비밀번호 | 비고 |
|------|--------|----------|------|
| 최고관리자 (Admin) | `admin@admin` | `3124sj31243124` | 어드민 패널 `/admin` |
| Chief Manager | `cheif@manager` | `cmcmcmcm` | 어드민+매니저+선생님 통합 권한 |
| 테스트 학생 | `simtest456@test.com` | `Test1234!` | 모바일 API 테스트용 |

---

## 4. 코드베이스 구조

```
/
├── src/
│   ├── app/
│   │   ├── (home)/          랜딩 페이지
│   │   ├── admin/           관리자 패널 (stats·students·teachers·matches·cms·funnel)
│   │   ├── chief-manager/   teacher-approval (CHIEF_MANAGER 전용)
│   │   ├── dashboard/       학생 웹 대시보드 + consultation 서브페이지
│   │   ├── notifications/   학생 알림 센터
│   │   ├── payments/        학생 결제·구독 내역
│   │   ├── questions/       학생 질문 전체 목록
│   │   ├── teacher-portal/  선생님·매니저 포털
│   │   ├── checkout/        결제 페이지
│   │   ├── register/        선생님·학생 가입
│   │   └── api/             (아래 API 맵 참고)
│   ├── components/          UI 컴포넌트 (역할별 폴더 구분)
│   └── lib/                 공통 유틸 (auth·journey·notifications 등)
│
├── mobile/
│   ├── app/
│   │   ├── (auth)/          onboarding·login·signup
│   │   ├── (tabs)/          index(홈)·learning·qna·my
│   │   ├── consult/         상담신청·완료·매치·상태
│   │   ├── billing.tsx      구독·결제
│   │   ├── notifications.tsx
│   │   ├── report/[id].tsx  월간 리포트 상세
│   │   └── teacher/[id].tsx 선생님 프로필
│   ├── components/ui/       SVG Icons·EmptyState·SubHead 등
│   ├── lib/                 api·analytics·journey 등
│   ├── styles/app-styles.ts 공통 StyleSheet 토큰
│   └── theme/               ThemeProvider (green/blue × light/dark)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── design handoff/          디자인 시안·계약서·아이콘 소스
└── vercel.json              regions: ["icn1"]
```

---

## 5. DB 모델 요약

| 모델 | 설명 |
|------|------|
| `User` | 로그인 계정 (role: STUDENT·TEACHER·MANAGER·CHIEF_MANAGER·ADMIN) |
| `Student` | 학생 프로필, 학년·과목·전화번호 |
| `Teacher` | 선생님 프로필 (매니저·chief도 Teacher 레코드 보유), approved 필드 |
| `TeacherStudent` | 학생↔선생님 매칭. `isActive=false`: 배정 후 수락 대기, `true`: 수업 중 |
| `ConsultationBooking` | 상담 예약. status: WAITING→ASSIGNED→COMPLETED→CANCELLED |
| `ManagerStudent` | 매니저↔학생 연결 |
| `StudyPlan` | 날짜별 학습 계획 (StudyTask 포함) |
| `Question` | 학생 질문 (AI답변·선생님답변·이미지) |
| `Lesson` | 예약된 수업 (startAt·joinUrl·status) |
| `Subscription` | 구독 플랜 (4-1·8-1·4-2·8-2) |
| `TokenWallet` | AI 질답 토큰 월별 사용량 |
| `MonthlyReport` | 월간 리포트 (summary·weakTypes) |
| `QuestionMessage` | Q&A 채팅 메시지 (me·tutor·ai) |
| `Notification` | 사용자 알림 (isRead, type) |
| `PushDevice` | Expo Push 토큰 등록 |
| `AnalyticsEvent` | 웹/앱 공통 이벤트 로그 |
| `SiteContent` | CMS — 랜딩 페이지 텍스트·이미지 |
| `Testimonial` / `FaqItem` | 후기·FAQ CMS |

---

## 6. 역할(Role) 시스템

| Role | 접근 경로 | 권한 |
|------|-----------|------|
| `STUDENT` | `/dashboard` (웹), 모바일 앱 | 학습 플래너·질문·리포트 |
| `TEACHER` | `/teacher-portal/dashboard` | 담당 학생 관리·수업 일정·과제 |
| `MANAGER` | `/teacher-portal/dashboard` + 매니저 탭 | 상담 배정·학생 매칭 |
| `CHIEF_MANAGER` | `/admin` + 매니저 포털 + 선생님 포털 | **모든 권한 통합** |
| `ADMIN` | `/admin` | 전체 데이터 관리 |

### CHIEF_MANAGER 특이사항
- `requireAdmin` / `requireManager` / `requireTeacher` 가드 **모두 통과**
- Teacher 레코드 보유 필수 (결제 즉시 배정 시 Chief Manager로 자동 지정)
- 선생님 승인 (`/api/chief-manager/teacher-approval`) 전용 엔드포인트 접근 가능
- 로그인 후 `/admin` 으로 이동

---

## 7. 학생 여정 단계 (Journey Stage)

```
PRE_SIGNUP → ONBOARDED → WAITING → ASSIGNED → MATCHING → FIRST_LESSON_PENDING → ACTIVE
```

| 단계 | 조건 | 표시 문구 |
|------|------|-----------|
| `PRE_SIGNUP` | 계정 없음 | 시작 전 |
| `ONBOARDED` | 가입했지만 상담 신청 없음 | 상담 신청 전 |
| `WAITING` | ConsultationBooking.status = WAITING | 상담 접수·배정 대기 |
| `ASSIGNED` | status = ASSIGNED | 매니저 배정 완료 |
| `MATCHING` | status = COMPLETED | 선생님 매칭 진행 |
| `FIRST_LESSON_PENDING` | TeacherStudent.isActive = true, Lesson 없음 | 첫 수업 일정 조율 중 |
| `ACTIVE` | isActive = true + Lesson 1개 이상 | 수업 진행 중 |

**핵심**: 매니저가 매칭 생성 시 `isActive=false`로 저장. 학생이 앱에서 **[수락]** 누르면 `isActive=true`로 전환 → 선생님에게 알림.

---

## 8. 사용자별 앱·웹 흐름

### 8-A. 학생 — 모바일 앱

#### 최초 설치 흐름

```
앱 실행
  └─ 토큰 없음 → 온보딩 (/onboarding)
       └─ [시작하기] → 로그인 (/login)
            ├─ 계정 있음: 전화번호 + 비밀번호 → 홈
            └─ 계정 없음: [회원가입] (/signup)
                  전화번호·이름·학년·과목·비밀번호 입력
                  → POST /api/mobile/auth/register
                  → 로그인 자동 처리 → 홈
```

#### 상담 신청 흐름 (가입 후 첫 이용)

```
홈 탭 (미매칭 상태)
  └─ "상담 신청" CTA 버튼
       → /consult (무료 상담 신청)
            이름·학년·과목·희망 시간 입력
            → POST /api/mobile/consultation
            → /consult/done (접수 완료)
                 └─ /consult/status (상태 추적)
                      ├─ WAITING: 배정 대기 중
                      ├─ ASSIGNED: 매니저 OOO 배정 완료
                      └─ COMPLETED: 선생님 추천 화면 진입
                           → /consult/match
                                배정된 선생님 카드 표시
                                [수락하기] → POST /api/mobile/matches
                                → 선생님에게 알림 발송
                                → 홈 화면 FIRST_LESSON_PENDING 상태로 전환
```

#### 수업 중 일상 흐름 (탭 바)

```
[홈] /(tabs)/index
  ├─ 오늘 수업 카드 (NowCard) — 수업 있으면 입장 버튼
  ├─ 주간 달성률 링 (완료 과제 / 전체 과제 %)
  ├─ 빠른 메뉴 — 상담·리포트·질문·구독
  ├─ 내 수업 목록 (배정된 선생님·과목)
  └─ 다가오는 일정 (최대 5개)

[학습] /(tabs)/learning
  ├─ 주간 막대 그래프 (학습 시간)
  ├─ 이번 주 과제 목록 (체크 가능)
  ├─ 리포트 요약 카드 → /report/[month]
  └─ AI 토큰 현황

[질문] /(tabs)/qna
  ├─ 배정 선생님 없으면 EmptyState
  └─ 선생님별 채팅 인터페이스
       ├─ 질문 + 이미지 첨부
       ├─ AI 즉답 (토큰 차감)
       └─ 선생님 답변 말풍선

[MY] /(tabs)/my
  ├─ 프로필 헤더 (이름·학년·과목·이메일)
  ├─ 구독·결제 → /billing
  ├─ 알림 → /notifications
  ├─ 학습 리포트 → /report/[month]
  ├─ 상담 진행 상태 → /consult/status
  ├─ 고객센터 (이메일)
  ├─ 이용약관 / 개인정보 처리방침
  └─ 로그아웃
```

#### 구독·결제 흐름

```
/billing (구독·결제)
  └─ 플랜 없음: EmptyState + [상담 신청] CTA
  └─ 플랜 있음: 현재 플랜·포함 혜택·구독 정보
       [플랜 변경·상담 신청] → /consult/status

/subscribe → 플랜 선택 (4-1·8-1·4-2·8-2)
/checkout  → 결제 정보 입력
/checkout/success → 결제 완료
  → POST /api/mobile/payments/complete
  → Chief Manager 자동 배정 + MangerStudent 생성
```

---

### 8-B. 학생 — 웹 대시보드

```
/dashboard (학습 플래너)
  ├─ TopBar: 로고·알림벨(드롭다운)·다크모드 토글·로그아웃
  ├─ 사이드바 (lg+): 월 달력·내 질문·결제·구독
  │
  ├─ Journey 배너 (ACTIVE 미만이면 CTA 표시)
  │     ONBOARDED → [상담 신청하기]
  │     WAITING   → [방문 시간 입력] → /dashboard/consultation
  │     ASSIGNED  → 매니저 이름 표시
  │
  └─ 날짜별 학습 계획
        ├─ 할 일 추가·체크·삭제·순서변경
        ├─ 이전 계획 복사
        └─ Q&A 패널 (질문등록·AI답변·선생님답변)

/notifications    알림 전체 목록 (읽음/안읽음)
/questions        질문 전체 목록 (필터: 해결됨/미해결)
/payments         결제·구독 내역
```

---

### 8-C. 선생님 — 웹 포털

```
/teacher-portal/dashboard
  ├─ 대시보드: 담당 학생 현황
  ├─ /students: 담당 학생 목록
  │     └─ 학생 클릭 → 학습 계획 관리
  │           ├─ PATCH /api/teacher/students/[id]/first-lesson  (첫 수업 일정)
  │           ├─ POST  /api/teacher/students/[id]/homework-distribution (과제 자동 배분)
  │           ├─ POST  /api/teacher/students/[id]/plans  (날짜별 계획)
  │           └─ GET   /api/teacher/students/[id]/questions (질문 목록)
  ├─ /consultations: 매니저 탭 (MANAGER·CHIEF_MANAGER만)
  ├─ /matching: 매칭 관리 (MANAGER·CHIEF_MANAGER만)
  ├─ /monitoring: 학생 모니터링
  └─ /profile: 프로필·사진·서류 업로드
```

**과제 자동 배분 흐름:**
```
선생님이 [1주 과제 일괄 입력] 버튼 클릭
  → 과목·내용·총 분량 입력
  → POST /api/teacher/students/[id]/homework-distribution
  → 서버가 요일별 가중치로 자동 배분
  → StudyTask 다수 생성
```

---

### 8-D. 매니저 — 웹 포털

```
/teacher-portal/dashboard (매니저 탭)
  ├─ /consultations: 상담 대기 목록
  │     └─ 배정: PATCH /api/manager/consultations/[id]/assign
  │     └─ 완료: PATCH /api/manager/consultations/[id]/complete
  │     └─ 취소: PATCH /api/manager/consultations/[id]/cancel
  ├─ /matching: 학생↔선생님 매칭 배정
  │     → POST /api/manager/matches
  │     → TeacherStudent.isActive = false (학생 수락 대기)
  │     → 학생에게 "수락해 주세요" 알림
  └─ /monitoring: 전체 학생 진도 모니터링
```

---

### 8-E. Chief Manager — 통합 관리

```
/admin  (어드민 패널)
  ├─ 통계 대시보드 (students·teachers·matches·questions)
  ├─ 학생 목록 및 상세 관리
  ├─ 선생님 목록 · 승인 · 역할 변경
  │     → PATCH /api/admin/teachers/[id]/role  (TEACHER↔MANAGER)
  │     → PATCH /api/chief-manager/teacher-approval  (승인/반려)
  ├─ 매칭 목록 (해제 가능)
  ├─ CMS 편집 (랜딩 텍스트·이미지·통계·FAQ·후기)
  └─ 퍼널 분석

+ 매니저 포털 (/teacher-portal) 전체 접근
+ 선생님 포털 (/teacher-portal) 전체 접근
```

---

### 8-F. 관리자(Admin) — 어드민 패널

Chief Manager와 동일한 `/admin` 접근권. 차이: Teacher 레코드 없으므로 매니저 포털의 "내 담당 학생" 기능은 사용 불가.

---

## 9. API 엔드포인트 맵

### 모바일 전용

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/mobile/auth/login` | 로그인 (전화번호/이메일 + 비밀번호) |
| POST | `/api/mobile/auth/register` | 학생 회원가입 |
| POST | `/api/mobile/auth/refresh` | 액세스 토큰 갱신 |
| GET | `/api/mobile/home` | 홈 집계 (오늘 수업·달성률·일정) |
| GET | `/api/mobile/me` | 내 프로필·구독·여정 단계 |
| GET/PATCH | `/api/mobile/me/journey` | 여정 단계 상세 |
| GET | `/api/mobile/learning/weekly` | 주간 학습 데이터 |
| GET | `/api/mobile/lessons` | 수업 목록 |
| GET | `/api/mobile/matches` | 배정 선생님 목록 |
| POST | `/api/mobile/matches` | 선생님 수락 |
| GET | `/api/mobile/notifications` | 알림 목록 |
| POST | `/api/mobile/consultation` | 상담 신청 |
| GET | `/api/mobile/qna` | QnA 채팅 목록 |
| GET/POST | `/api/mobile/qna/[tutorId]` | 선생님별 채팅 |
| GET | `/api/mobile/reports` | 리포트 목록 |
| GET | `/api/mobile/tutors` | 선생님 목록 |
| GET | `/api/mobile/tutors/[id]` | 선생님 프로필 |
| POST | `/api/mobile/payments/complete` | 결제 완료 처리 |
| POST | `/api/mobile/push/register` | Expo Push 토큰 등록 |
| GET | `/api/mobile/me/tokens` | AI 토큰 현황 |

### 학생 웹

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/plans` | 학습 계획 조회·생성 |
| POST | `/api/plans/[id]/tasks` | 할 일 추가 |
| PATCH/DELETE | `/api/plans/tasks/[id]` | 할 일 수정·삭제 |
| POST | `/api/plans/copy` | 이전 계획 복사 |
| GET/POST | `/api/questions` | 질문 목록·등록 |
| POST | `/api/questions/[id]/ai-answer` | AI 즉답 |
| GET | `/api/notifications` | 알림 목록 |
| PATCH | `/api/notifications/[id]/read` | 읽음 처리 |
| POST | `/api/notifications/read-all` | 전체 읽음 |
| POST | `/api/consultation/request` | 상담 신청 |
| PATCH | `/api/consultation/visit-times` | 방문 시간 입력 |
| POST | `/api/payments/complete` | 결제 완료 |

### 선생님·매니저

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/teacher/students` | 담당 학생 목록 |
| GET/POST | `/api/teacher/students/[id]/plans` | 학생 계획 관리 |
| PATCH | `/api/teacher/students/[id]/first-lesson` | 첫 수업 일정 |
| POST | `/api/teacher/students/[id]/homework-distribution` | 과제 자동 배분 |
| GET | `/api/teacher/students/[id]/questions` | 학생 질문 목록 |
| PATCH | `/api/teacher/questions/[id]/answer` | 질문 답변 |
| GET | `/api/manager/consultations/waiting` | 상담 대기 목록 |
| PATCH | `/api/manager/consultations/[id]/assign` | 매니저 자신에게 배정 |
| PATCH | `/api/manager/consultations/[id]/complete` | 상담 완료 처리 |
| GET/POST | `/api/manager/matches` | 학생↔선생님 매칭 |
| GET | `/api/manager/monitoring` | 학생 모니터링 |

### 어드민

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/stats` | 통계 (샘플 계정 제외) |
| GET | `/api/admin/students` | 학생 목록 |
| GET/PATCH/DELETE | `/api/admin/students/[id]` | 학생 상세 |
| GET | `/api/admin/teachers` | 선생님 목록 |
| PATCH | `/api/admin/teachers/[id]/role` | 역할 변경 (TEACHER↔MANAGER) |
| GET/DELETE | `/api/admin/matches/[id]` | 매칭 해제 |
| GET/PUT | `/api/admin/cms` | CMS 콘텐츠 |
| GET | `/api/admin/funnel` | 퍼널 분석 |

---

## 10. 알림 시스템

알림 타입 (`Notification.type`):

| 타입 | 발생 시점 | 수신자 |
|------|-----------|--------|
| `NEW_STUDENT_WAITING` | 상담 신청 | 모든 매니저 |
| `BOOKING_ASSIGNED` | 매니저 배정 | 학생 |
| `TEACHER_ASSIGNED` | 선생님 매칭 | 학생 |
| `NEW_STUDENT_ASSIGNED` | 학생 수락 완료 | 선생님 |
| `FIRST_LESSON_SET` | 첫 수업 일정 등록 | 학생 |
| `TEACHER_ANSWERED` | 선생님 질문 답변 | 학생 |
| `QUESTION_UNANSWERED` | 미답변 질문 경고 | 선생님 |
| `PROGRESS_WARNING` / `PROGRESS_DANGER` | 과제 달성률 저조 | 선생님·매니저 |

Expo Push: `PushDevice` 테이블에 토큰 등록 후 `expo-push.ts`로 발송.  
웹 알림: 헤더 NotificationBell 드롭다운 (실시간 폴링).

---

## 11. 성능 & 인프라 메모

### Vercel 리전 고정
`vercel.json`에 `"regions": ["icn1"]` 설정.  
Supabase DB와 동일 리전(서울)에서 실행 → API RTT **6s → 0.25s** (96% 개선).

### API RTT 최적화 (코드 레벨)
- `/api/mobile/me`: 3 RTT → 2 RTT. Journey 단계 계산을 단일 `Promise.all`로 통합.
- `/api/mobile/home`: 주간 달성률 쿼리를 별도 RTT → 동일 `Promise.all` 통합.

### DB 연결
Transaction Pooler URL (port 6543, `pgbouncer=true`). 마이그레이션은 `DIRECT_URL` (port 5432).

### 샘플 데이터 필터
어드민 API 전체에서 `name NOT LIKE '[sample]%'` 필터 적용.

---

## 12. 미완성·추후 과제

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| 학부모 계정·포털 | 중 | 설계 없음, 별도 역할 추가 필요 |
| Kakao/Apple 소셜 로그인 | 중 | 시안에 버튼 있음, 미구현 |
| 실시간 알림 (WebSocket/SSE) | 중 | 현재 폴링 방식 |
| 토스페이먼츠 실결제 연동 | 높음 | 현재 결제 완료 API만 있고 PG 미연결 |
| 선생님 공개 프로필 (`/tutors`) | 낮음 | API 있음, 웹 UI 미완성 |
| 홈워크 자동 배분 UI | 낮음 | API 구현됨, 선생님 포털 UI 미연결 |
| `FaqAccordionList` + 아이콘 | 낮음 | 현재 인라인 SVG `<FaqIcon>` 유지 중 |
| 모바일 앱 스토어 배포 | — | EAS Build 설정 필요 |
| 다국어 | — | 현재 한국어 only |
