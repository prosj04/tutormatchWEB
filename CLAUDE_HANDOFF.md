# CLAUDE_HANDOFF.md

> **Concord Private Tutoring** (`premium-tutoring`) — 이 문서만 읽고 바로 개발에 참여할 수 있도록 작성된 핸드오프입니다.  
> 마지막 갱신: **2026-06-24** · 브랜치 `main` · 원격 `https://github.com/prosj04/tutormatchWEB.git`

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [사용자 역할 & 권한](#2-사용자-역할--권한)
3. [핵심 비즈니스 플로우](#3-핵심-비즈니스-플로우)
4. [기능 상세 (도메인별)](#4-기능-상세-도메인별)
5. [기술 스택](#5-기술-스택)
6. [폴더 구조](#6-폴더-구조)
7. [페이지 & 라우팅](#7-페이지--라우팅)
8. [인증 & 미들웨어](#8-인증--미들웨어)
9. [DB & Prisma](#9-db--prisma)
10. [API 전체 목록](#10-api-전체-목록)
11. [CMS 시스템](#11-cms-시스템)
12. [알림 & SMS](#12-알림--sms)
13. [외부 연동 (Supabase·토스·Anthropic)](#13-외부-연동)
14. [환경변수](#14-환경변수)
15. [배포 & 운영](#15-배포--운영)
16. [`src/lib` 파일 인덱스](#16-srclib-파일-인덱스)
17. [컴포넌트 인덱스](#17-컴포넌트-인덱스)
18. [구현 상태 & 미구현](#18-구현-상태--미구현)
19. [알려진 이슈 & 주의사항](#19-알려진-이슈--주의사항)
20. [로컬 개발 체크리스트](#20-로컬-개발-체크리스트)
21. [빠른 참조](#21-빠른-참조)

---

## 1. 프로젝트 개요

### 브랜드 & 한 줄 설명

| 항목 | 내용 |
|------|------|
| **브랜드** | Concord (메타데이터: Concord Private Tutoring) |
| **한 줄** | 1:1 맞춤 과외 매칭·학습 관리 플랫폼 |
| **핵심 흐름** | 상담 신청 → 매니저 배정 → 선생님 매칭 → 일별 학습 플랜·질문·AI/강사 답변 |
| **프로덕션 URL** | `https://tutormatch-web.vercel.app` |
| **Vercel 프로젝트** | `tutormatch-web` |
| **GitHub** | `prosj04/tutormatchWEB` |

### 서비스 구성 요약

```
[마케팅] 홈·요금제·강사진·FAQ·후기
    ↓ 상담 CTA / 결제
[가입] 학생(전화번호) · 선생님(3단계 지원)
    ↓
[상담] ConsultationBooking (WAITING → ASSIGNED → COMPLETED)
    ↓ 매니저 매칭
[학습] StudyPlan + Question + 알림
    ↓
[운영] Admin CMS · 통계 · 매칭 CRUD
```

---

## 2. 사용자 역할 & 권한

| 역할 | DB `User.role` | 로그인 후 홈 | 포털 |
|------|----------------|-------------|------|
| **학생** | `STUDENT` | `/dashboard` | 학습 플래너, 질문, 상담 |
| **선생님** | `TEACHER` | `/teacher-portal/dashboard` | 담당 학생 플랜·질문, 프로필 |
| **매니저** | `MANAGER` | `/teacher-portal/dashboard` | 위 + 상담·매칭·모니터링 |
| **관리자** | `ADMIN` | `/admin` | 전체 운영·CMS |

### 역할 관련 정책

- **MANAGER**는 `Teacher` 테이블 레코드를 공유 (같은 포털 UI, `user.role`로 탭 분기).
- **미승인 선생님** (`approved: false`)도 포털 대시보드 진입 가능.
- **공개 강사진** (`/tutors`)은 `approved: true` + `role`이 `TEACHER` 또는 `MANAGER`만 노출.
- **학생 1인 1상담**: `ConsultationBooking.studentId` unique.
- **날짜 형식**: 학습·질문·매칭 `startDate`·`date`는 항상 string `"YYYY-MM-DD"`.

---

## 3. 핵심 비즈니스 플로우

### 3.1 학생 가입 & 상담 (일반)

```
비로그인 → ConsultationApplyButton / ?signup=1
  → ConsultationSignupModal (ConsultationSignupForm)
  → POST /api/register/student (instantEnroll=false)
  → 자동 로그인 (전화번호 + 비밀번호)
  → /dashboard/consultation
  → 「상담 신청하기」→ POST /api/consultation/request
  → ConsultationBooking status=WAITING
  → 모든 MANAGER에게 NEW_STUDENT_WAITING 알림
```

- 가입 시 **상담 레코드는 자동 생성되지 않음**. 상담 페이지에서 별도 신청 필요.

### 3.2 즉시 등록 (Chief 매니저 배정)

트리거: `instantEnroll=true` (상담 모달 `?signup=1&instant=1`, 결제 success 플로우)

```
POST /api/register/student { instantEnroll: true }
  → assignChiefManagerToStudent()
  → ConsultationBooking status=ASSIGNED
  → ManagerStudent 링크 생성
  → 매니저에게 BOOKING_CONFIRMED 알림 (+ SMS 조건부)
  → /dashboard/consultation?visit=1 (방문 시간 입력 유도)
```

**Chief 매니저 조회 순서** (`chief-manager.ts`):
1. `CHIEF_MANAGER_EMAIL` env
2. 이름에 "Chief" 포함 MANAGER
3. `getDefaultManager()` 폴백 (`DEFAULT_MANAGER_EMAIL` → 최초 등록 MANAGER)

> `assignDefaultManagerToStudent()`는 정의만 되어 있고 **현재 호출처 없음** (레거시/예비).

### 3.3 결제 플로우

```
/pricing → PricingPlanCard CTA
  → /checkout?sessions=4|8&subjects=1|2&tutor=1
  → (비로그인) 인라인 회원가입 폼 + sessionStorage 저장
  → Toss Payments 위젯 결제
  → /success?paymentKey=…&orderId=…&amount=…
  → SuccessPaymentComplete:
      - 기존 학생: POST /api/payments/complete → Chief 배정
      - 신규: register(instantEnroll) → 로그인 → payments/complete
  → /dashboard/consultation
```

**요금 계산** (`pricing-plans.ts`):
- 주 1회(월 4회): 회당 100,000원
- 주 2회+(월 8회): 회당 90,000원
- 총액 = 회당 단가 × sessions × subjects
- 체크아웃 표시용 분리: 플랫폼 이용료(4회 3.5만/8회 6만 × 과목) + 수업료

### 3.4 상담 상태 머신

```
WAITING ──(매니저 assign)──→ ASSIGNED ──(complete)──→ COMPLETED
   ↑                              │
   └────(cancel, ASSIGNED만)──────┘
```

| 상태 | 의미 | 학생 UI |
|------|------|---------|
| `WAITING` | 매니저 미배정 | 상담 신청 대기 / 방문 시간 입력 가능 |
| `ASSIGNED` | 매니저 배정됨 | 담당 매니저 정보, 방문 시간 수정 |
| `COMPLETED` | 상담 완료 | 매칭 진행 중 안내 |
| `CANCELLED` | 취소 | (현재 학생 직접 취소 UI 없음, 매니저가 ASSIGNED→WAITING 롤백) |

### 3.5 선생님 매칭

```
매니저/Admin → TeacherStudent 생성 (teacherId, studentId, subjects, startDate, isActive)
  → ManagerStudent upsert (매니저 포털에서 매칭 시)
  → TEACHER_ASSIGNED (학생) + NEW_STUDENT_ASSIGNED (선생님) 알림
  → 학생 /dashboard 진입 가능 (active match ≥ 1)
```

### 3.6 학습 플랜 & 질문

**플랜**:
- 날짜별 `StudyPlan` + `StudyTask[]` (order, isDone, doneAt)
- 학생: 생성·태스크 CRUD·DnD 순서·다른 날 복사
- 선생님: 플랜 조회 + `comment` 작성 → `TEACHER_COMMENT` 알림

**질문**:
- 날짜 연결, 텍스트 + 선택적 `imageUrl` (Supabase `question-images`)
- 생성 시 담당 선생님에게 `NEW_QUESTION` 알림
- AI: `ANTHROPIC_API_KEY` 있으면 생성 시 `aiAnswer=null`, `POST …/ai-answer`로 생성
- AI 키 없으면 생성 시 `MOCK_AI_ANSWER` 즉시 저장
- 선생님 답변 → `TEACHER_ANSWERED` 알림
- 24h 미답변(Cron) → `QUESTION_UNANSWERED` (선생님·매니저)

### 3.7 선생님 지원

```
/register/teacher (3단계)
  → POST /api/register/teacher (approved=false)
  → POST/PATCH documents (이력서·증빙)
  → Admin /admin/teachers 에서 승인·역할 변경
```

---

## 4. 기능 상세 (도메인별)

### 4.1 마케팅 & 공개 페이지

| 기능 | 상태 | 설명 |
|------|------|------|
| 홈 랜딩 | ✅ | `LandingPageV2` (다크/라이트, 그린/블루 테마, `landing-v2.css`) |
| 요금제 | ✅ | 중등/고등 탭, CMS 카드 6슬롯, CTA→checkout |
| 강사진 목록/상세 | ✅ | ISR 300s, approved만, 성별 기본 사진 |
| FAQ 페이지 | ✅ | CMS `faq_page/show_page`로 비활성화 가능 |
| 후기 페이지 | ✅ | `showOnReviewsPage` 필터 |
| SEO | ✅ | metadata, OG, JSON-LD, `sitemap.ts` |
| 상담 CTA 통일 | ✅ | `useConsultationCta` + `ConsultationApplyButton` |
| CMS 인라인 편집 | ✅ | Admin이 `?cms_edit=1`로 공개 페이지 편집 |

**랜딩 컴포넌트 현황**:
- **활성**: `LandingRoot` → `LandingPageV2`
- **보존(미사용)**: `LandingPage`, `LandingPageThemed`, `Hero.tsx` 등 레거시 섹션

### 4.2 학생 대시보드

| 기능 | 상태 | 설명 |
|------|------|------|
| 캘린더 | ✅ | 월별 플랜 날짜 도트, 날짜 선택 |
| 일별 플랜 | ✅ | 태스크 추가·완료·삭제·DnD (`@dnd-kit`) |
| 플랜 복사 | ✅ | 다른 날 플랜 복사 모달 |
| 질문 | ✅ | 텍스트+이미지, AI/선생님 답변 표시 |
| 상담 예약 | ✅ | 상태별 UI, 방문 시간 (`VisitTimesPicker`) |
| 알림 벨 | ✅ | `NotificationBell`, 역할별 href |
| 매칭 전 리다이렉트 | ✅ | active TeacherStudent 없으면 `/dashboard/consultation` |

### 4.3 선생님/매니저 포털

| 기능 | TEACHER | MANAGER |
|------|---------|---------|
| 대시보드 홈 | ✅ | ✅ |
| 프로필 편집 (사진·소개·경력·학력·자격·서류) | ✅ | ✅ |
| 담당 학생 (플랜·질문 탭) | ✅ | ✅ |
| 상담 관리 (대기·내 담당·배정·완료·취소) | — | ✅ |
| 학생–선생님 매칭 | — | ✅ |
| 학습 모니터링 (주간 완료율·미답변) | — | ✅ |

### 4.4 관리자

| 기능 | 설명 |
|------|------|
| 대시보드 통계 | 학생/선생님/매칭/질문/상담 수, 매니저 부하 |
| 학생 CRUD | 검색·필터·페이지네이션·담당 매니저 표시 |
| 선생님 CRUD | 승인·역할(TEACHER↔MANAGER)·사진·서류 |
| 매칭 CRUD | TeacherStudent 생성/수정/비활성 |
| CMS | SiteContent·FAQ·후기·요금 카드·포털 문구·간격 |
| 데이터 조회 | 전체 플랜·질문 raw 조회 |
| DB 진단 | `/api/admin/db-check` (Supabase ref 확인) |
| 알림 수동 배치 | `POST /api/admin/check-alerts` |
| 최초 ADMIN | `/login?setup=admin` + `ADMIN_SETUP_SECRET` |

### 4.5 결제

| 기능 | 상태 |
|------|------|
| Toss 위젯 UI | ✅ (클라이언트 키) |
| 체크아웃 인라인 가입 | ✅ |
| 결제 후 Chief 배정 | ✅ |
| 서버 결제 승인 검증 | ❌ |
| 웹훅 | ❌ |

### 4.6 AI

| 기능 | 상태 |
|------|------|
| Claude 질문 답변 | ✅ (`claude-sonnet-4-20250514`) |
| 이미지 첨부 질문 | ✅ (URL 텍스트로 전달, 비전 미연동) |
| 키 없을 때 mock | ✅ |

---

## 5. 기술 스택

| 영역 | 기술 |
|------|------|
| Runtime | Node 20.x |
| Framework | Next.js **14.2.35** (App Router) |
| UI | React 18, Tailwind 3.4, Framer Motion |
| DB | PostgreSQL (Supabase) + Prisma **5.22.0** |
| Auth | NextAuth v5 beta (JWT, Credentials) |
| Storage | Supabase Storage (anon + service role) |
| AI | `@anthropic-ai/sdk` |
| 결제 | `@tosspayments/payment-widget-sdk` |
| DnD | `@dnd-kit/*` |
| 폰트 | Pretendard (`public/fonts/`, `--font-pretendard`) |
| 배포 | Vercel + Cron |

### npm scripts

| Script | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | `prisma migrate deploy && next build` |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run check-env` | 필수 env 검사 (`scripts/check-env.ts`) |
| `npm run setup-storage` | Supabase 버킷 생성 |
| `npm run seed:sample` | 샘플 데이터 시드 |
| `postinstall` | `prisma generate` |

### 디자인 토큰 (`tailwind.config.ts`)

- Primary `#2563EB`, Accent `#E91E8C`
- Neutral 스케일 `neutral-0` ~ `neutral-100`
- 랜딩 V2: `data-theme` / `data-color` (localStorage: `concord-theme`, `concord-color`, `concord-mode`)

---

## 6. 폴더 구조

```
premium-tutoring/
├── auth.ts                    # NextAuth 설정 (basePath /api/auth)
├── middleware.ts              # 역할별 라우트 가드
├── next.config.mjs            # redirects, Prisma external, 이미지 도메인
├── vercel.json                # Cron: check-alerts 매일 00:00 UTC
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/            # 9개 마이그레이션 (아래 §9)
├── public/
│   ├── fonts/                 # Pretendard subset woff2
│   ├── images/teachers/       # default-male.png, default-female.png
│   └── og-image.png
├── scripts/
│   ├── check-env.ts
│   ├── setup-storage.ts
│   ├── seed-sample-data.ts
│   └── migrate-data-only.sh
└── src/
    ├── app/                   # App Router 페이지 + API (58 routes)
    ├── components/            # 도메인별 UI
    ├── hooks/                 # useConsultationCta, useTheme
    ├── lib/                   # 비즈니스 로직 (51 files)
    └── types/                 # next-auth.d.ts
```

---

## 7. 페이지 & 라우팅

### 역할별 진입 (`portal-roles.ts`)

| role | `portalHomeHref` |
|------|------------------|
| STUDENT | `/dashboard` |
| TEACHER / MANAGER | `/teacher-portal/dashboard` |
| ADMIN | `/admin` |
| 비로그인 | `/` |

### 공개 페이지

| URL | revalidate | 주요 컴포넌트 |
|-----|------------|---------------|
| `/` | 300s | `LandingRoot` → `LandingPageV2` |
| `/pricing` | — | `PricingContent`, `PublicShell` |
| `/tutors`, `/tutors/[id]` | 300s | `TutorsListing`, 강사 상세 |
| `/faq` | — | `FaqPageContent` |
| `/reviews` | — | `ReviewsPageContent` |
| `/login` | — | `LoginForm` (+ `?setup=admin`) |
| `/register` | — | 상담 모달 오픈 후 홈 리다이렉트 |
| `/register/teacher` | — | 3단계 지원 폼 |
| `/checkout` | — | `CheckoutContent` (query: sessions, subjects, tutor) |
| `/success` | — | `SuccessPaymentComplete` |

### 학생

| URL | 가드 | 설명 |
|-----|------|------|
| `/dashboard` | STUDENT, active match 필요 | `StudentDashboard` |
| `/dashboard/consultation` | STUDENT, match 없을 때 | `ConsultationBookingPage` |

### 선생님 포털 (`/teacher-portal/dashboard/…`)

| URL | 가드 | 컴포넌트 |
|-----|------|----------|
| `/teacher-portal` | — | `TeacherPortalLoginClient` |
| `/teacher-portal/apply` | — | `TeacherPortalApplyClient` |
| `…/dashboard` | TEACHER/MANAGER | `TeacherDashboardContent` |
| `…/profile` | 동상 | `TeacherProfileEditor` |
| `…/students` | 동상 | `TeacherStudentsManager` |
| `…/consultations` | **MANAGER** | `ManagerConsultationsPage` |
| `…/matching` | **MANAGER** | `ManagerMatchingPage` |
| `…/monitoring` | **MANAGER** | `ManagerMonitoringPage` |

### 관리자

| URL | 컴포넌트 |
|-----|----------|
| `/admin` | `AdminDashboard` |
| `/admin/students` | `AdminStudentsPage` |
| `/admin/teachers` | `AdminTeachersPage` |
| `/admin/matches` | `AdminMatchesPage` |
| `/admin/cms` | `AdminCmsPage` |
| `/admin/data` | `AdminDataPage` |

### Provider 구조

- **루트 `layout.tsx`**: Pretendard, `landing-v2.css`, 테마 FOUC 방지 스크립트
- **공개 페이지**: `PublicAppProviders` (Session + ConsultationSignup)
- **대시보드/포털**: `PortalSiteContentProvider` (CMS 포털 문구)

---

## 8. 인증 & 미들웨어

### NextAuth (`auth.ts`)

- **전략**: JWT (`session.strategy: "jwt"`)
- **Provider**: Credentials (`identifier` + `password`)
- **로그인 식별자**:
  - 이메일 (`@` 포함)
  - 전화번호 → `Student.phone` / `Teacher.phone` 또는 합성 이메일
    - 학생: `student+{digits}@concord.local`
    - 선생님: `teacher+{digits}@concord.local`
- **비밀번호**: bcrypt (가입 시 rounds=12)
- **JWT 페이로드**: `id`, `role`, `name`
- **방어**: `userForAuthSelect` — relation 전체 include 금지 (P2022 방지)

### middleware.ts

| 조건 | 동작 |
|------|------|
| `/admin/*` | ADMIN 아니면 → `/login` |
| STUDENT 로그인 | 마케팅 공개 경로 + `/dashboard` + `/api`만 허용, 나머지 → `/dashboard` |
| TEACHER/MANAGER | 마케팅 + `/teacher-portal` + `/api`, 나머지 → 포털 |
| ADMIN | 전 경로 허용 |
| 비로그인 + `/dashboard` | → `/login` |
| 비로그인 + `/teacher-portal/dashboard` | → `/teacher-portal` |

**마케팅 공개 경로** (`public-routes.ts`): `/`, `/pricing`, `/tutors`, `/faq`, `/reviews`, `/login`, `/register`, `/checkout`, `/success`

**matcher 제외**: `api/auth`, `_next/static`, `_next/image`, `favicon.ico`, `fonts`, `images`

### API 권한 헬퍼

| 파일 | export | 역할 |
|------|--------|------|
| `admin-auth.ts` | `requireAdmin` | ADMIN만 |
| `student-auth.ts` | `requireStudent` | STUDENT + student 레코드 |
| `teacher-auth.ts` | `requireTeacher` | TEACHER 또는 MANAGER |
| `manager-auth.ts` | `requireManager` | MANAGER만 |
| `manager-page-auth.ts` | `requireManagerPage` | 페이지용 redirect |
| `notification-auth.ts` | `requireNotificationUser` | 로그인만 |
| `teacher-student-match.ts` | `requireTeacherStudentMatch` | active 매칭 확인 |

---

## 9. DB & Prisma

**연결**: 런타임 `DATABASE_URL` (pooler 6543, `pgbouncer=true`), 마이그레이션 `DIRECT_URL` (5432).

### 모델 관계

```
User 1──1 Student | 1──1 Teacher | 1──N Notification
Student N──M Teacher (TeacherStudent: subjects, startDate, isActive)
Student 1──1 ConsultationBooking N──1 Teacher(manager)
Student N──M Teacher (ManagerStudent)
Student 1──N StudyPlan 1──N StudyTask
Student 1──N Question
Teacher 1──1 TeacherProfile
SiteContent / Testimonial / FaqItem — CMS (User FK 없음)
```

### ConsultationBooking 필드

| 필드 | 설명 |
|------|------|
| `preferredTimes` | JSON string, 기본 `"[]"` |
| `visitPreferredTimes` | `{ "YYYY-MM-DD": ["09-11시", …] }` JSON |
| `status` | WAITING / ASSIGNED / COMPLETED / CANCELLED |
| `managerNote` | 매니저 완료 시 필수 메모 |

### Testimonial / FaqItem 노출 플래그

| 모델 | 필드 | 기본값 |
|------|------|--------|
| `Testimonial` | `showOnHome`, `showOnReviewsPage` | false / true |
| `FaqItem` | `showOnHome`, `showOnFaqPage` | false / true |

### 마이그레이션 (로컬)

1. `20260514190000_supabase_init`
2. `20260516000000_baseline_missing_tables`
3. `20260517000000_add_indexes`
4. `20260518081500_add_teacher_documents`
5. `20260520120000_visit_consultation_times`
6. `20260520180000_teacher_gender`
7. `20260521120000_student_gender`
8. `20260521130000_cms_tables`
9. `20260527120000_faq_reviews_surface_flags`

> 스키마 전문은 `prisma/schema.prisma` 참조.

---

## 10. API 전체 목록

총 **58** route. 인증: §8 헬퍼 기준.

### Auth (1)

| Method | Path | 인증 |
|--------|------|------|
| * | `/api/auth/[...nextauth]` | Public |

### Register (4)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/register/student` | 가입. `instantEnroll` 시 Chief 배정 |
| POST | `/api/register/teacher` | 선생님 지원 |
| PATCH | `/api/register/teacher` | `resumeUrls`, `documentUrls` 저장 |
| POST | `/api/register/teacher/documents` | multipart 업로드 |

### Plans (5) — STUDENT

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/plans` | `?month`, `?date`, `?before&recent` 조합 |
| POST | `/api/plans` | 날짜별 플랜 생성 (idempotent) |
| POST | `/api/plans/copy` | 플랜 복사 |
| POST | `/api/plans/[planId]/tasks` | 태스크 추가 |
| PATCH | `/api/plans/[planId]/tasks` | taskIds 순서 재배열 |
| PATCH/DELETE | `/api/plans/tasks/[taskId]` | 태스크 수정/삭제 |

### Questions (4) — STUDENT

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/questions?date=` | 일별 질문 |
| POST | `/api/questions` | 생성 + 선생님 알림 |
| PATCH | `/api/questions/[id]` | `isResolved` |
| POST | `/api/questions/[id]/ai-answer` | AI 답변 생성 |

### Consultation (3) — STUDENT

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/consultation/request` | WAITING 생성 |
| GET | `/api/consultation/my-booking` | 내 상담 DTO |
| PATCH | `/api/consultation/visit-times` | 방문 시간 (다음 7일) |

### Payments (1) — STUDENT

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/payments/complete` | Chief 매니저 배정 (멱등) |

### Notifications (3) — ANY_USER

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/notifications` | 목록 또는 `?summary=1` |
| PATCH | `/api/notifications/[id]/read` | 읽음 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 |

### Teacher (8) — TEACHER

| Method | Path | 설명 |
|--------|------|------|
| GET/PATCH | `/api/teacher/profile` | 프로필 |
| GET/POST/DELETE | `/api/teacher/profile/documents` | 서류 signed URL |
| GET | `/api/teacher/students` | 담당 학생 |
| GET | `/api/teacher/students/[id]/plans` | 학생 플랜 |
| GET | `/api/teacher/students/[id]/questions` | 학생 질문 |
| PATCH | `/api/teacher/plans/[planId]/comment` | 플랜 코멘트 |
| PATCH | `/api/teacher/questions/[id]/answer` | 답변 |

### Manager (8) — MANAGER

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/manager/consultations/waiting` | 대기 목록 |
| GET | `/api/manager/consultations/mine` | 내 담당 |
| PATCH | `…/consultations/[id]/assign` | 원자적 선점 |
| PATCH | `…/consultations/[id]/complete` | COMPLETED |
| PATCH | `…/consultations/[id]/cancel` | WAITING 롤백 |
| GET/POST | `/api/manager/matches` | 매칭 조회·생성 |
| GET | `/api/manager/monitoring` | 모니터링 목록 |
| GET | `/api/manager/monitoring/stats?studentId=` | 학생 상세 |

### Admin (13 + CMS 11)

**운영**: `setup`, `recover`, `stats`, `students`, `teachers`, `matches`, `data/plans`, `data/questions`, `check-alerts`, `db-check`

**CMS**: `cms` (GET/PATCH/POST/DELETE), `cms/init`, `cms/content`, `cms/upload-image`, `cms/faq`, `cms/faq/[id]`, `cms/testimonials`, `cms/testimonials/[id]`

### Cron (1)

| Method | Path | 인증 |
|--------|------|------|
| GET | `/api/cron/check-alerts` | `Bearer ${CRON_SECRET}` |

> `/api/dev/skip-payment-enroll` — **삭제됨** (2026-06 기준 코드베이스에 없음).

---

## 11. CMS 시스템

### 데이터 소스

| 테이블 | 용도 |
|--------|------|
| `SiteContent` | section + key → value (텍스트·이미지·숫자) |
| `Testimonial` | 후기 (홈/후기 페이지 노출 분리) |
| `FaqItem` | FAQ (홈/FAQ 페이지 노출 분리) |

### 캐시

- **revalidate**: 300초 (`PUBLIC_CMS_REVALIDATE_SECONDS`)
- **태그**: `site-content`, `testimonials`, `faqs`, `public-teachers`
- Admin PATCH 후 `revalidatePublicCms()` 호출

### SiteContent 주요 섹션

| section | 용도 |
|---------|------|
| `hero`, `stats`, `results`, `management`, `cta` | 홈 섹션 |
| `compare` | 서비스 비교 테이블 (9행) |
| `home_page` | 홈 FAQ/후기/요금 섹션 가시성 |
| `pricing_page` | 요금제 페이지 (박스 1–6, 중등/고등) |
| `tutors_page` | 강사진 페이지 |
| `faq_page`, `reviews_page` | 전용 페이지 |
| `checkout_page` | 결제 페이지 문구 |
| `footer` | 푸터·회사 정보 |
| `spacing` | 섹션별 padding (pt/pb/px) |
| `student_dashboard`, `student_consultation` | 학생 포털 문구 |
| `teacher_portal` | 선생님 포털 네비·브랜드 |

### 가시성 규칙 (`parseCmsVisibility`)

- `"0"` / `"false"` / `"off"` / `"숨김"` → 숨김
- 빈 값 → `defaultVisible` (보통 true)
- 요금 카드: 박스 5·6 기본 비노출, 중등 키 없으면 고등 폴백

### CMS 시드

- `POST /api/admin/cms/init` → `seedDefaultCmsContent()` (`cms-seed.ts`)
- `skipDuplicates: true`, FAQ/후기 0건일 때만 삽입

### 인라인 편집

- Admin + `?cms_edit=1` → `CmsEditOverlay` / `CmsEdit` 컴포넌트

---

## 12. 알림 & SMS

### 인앱 알림 타입 (`notifications.ts`)

| type | 발생 시점 | SMS |
|------|-----------|-----|
| `NEW_STUDENT_WAITING` | 상담 신청 / Cron 2h 대기 | — |
| `NEW_BOOKING` | (레거시) | — |
| `BOOKING_CONFIRMED` | 매니저 배정 | ✅ |
| `TEACHER_ASSIGNED` | 선생님 매칭 | ✅ |
| `NEW_STUDENT_ASSIGNED` | 선생님에게 학생 배정 | ✅ |
| `NEW_QUESTION` | 학생 질문 생성 | — |
| `QUESTION_UNANSWERED` | 24h 미답변 (Cron) | ✅ |
| `TEACHER_ANSWERED` | 선생님 답변 | — |
| `TEACHER_COMMENT` | 플랜 코멘트 | — |
| `VISIT_TIMES_UPDATED` | 방문 시간 변경 | — |
| `PROGRESS_WARNING` | 주간 완료율 <70% (Cron, 월요일 KST) | — |
| `PROGRESS_DANGER` | 주간 완료율 <50% | — |

### Cron 배치 (`run-alert-checks.ts`)

매일 00:00 UTC (`vercel.json`):

1. **미답변 질문**: AI 답변 있음 + teacherAnswer 없음 + 24h 경과 → 선생님·매니저 (24h 중복 방지)
2. **주간 진도**: KST 월요일만, 전주 완료율 <50% / <70% → 매니저
3. **대기 상담**: WAITING 2h+ → 모든 매니저

### SMS (Solapi)

- **파일**: `src/lib/sms.ts`
- **env**: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_PHONE`
- **동작**: env 미설정 시 no-op, 실패해도 예외 미전파 (fire-and-forget)
- **이메일 발송**: 없음

---

## 13. 외부 연동

### Supabase

| 용도 | 방식 |
|------|------|
| PostgreSQL | Prisma (`DATABASE_URL` / `DIRECT_URL`) |
| Auth | **미사용** (자체 User + bcrypt) |
| Storage | anon key (클라이언트) + service role (CMS 업로드) |

**Storage 버킷**:

| 버킷 | 용도 |
|------|------|
| `question-images` | 학생 질문 첨부 |
| `teacher-photos` | 선생님 프로필 (`{teacherId}/profile.jpg`) |
| `teacher-documents` | 이력서·증빙 (PDF/이미지) |
| `cms-images` | CMS 이미지 (없으면 자동 생성) |

**RLS**: 앱 코드에 정책 없음 — Supabase 대시보드에서 별도 설정 필요.

### Toss Payments

- 클라이언트 위젯만 (`TOSS_WIDGET_CLIENT_KEY`, 미설정 시 테스트 키 폴백)
- 서버 승인·웹훅 없음

### Anthropic

- 모델: `claude-sonnet-4-20250514`, max_tokens 1000, 한국어

---

## 14. 환경변수

**값은 커밋하지 않음.** `.env.example` + `scripts/check-env.ts` 기준.

### 필수 (check-env)

| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Prisma 런타임 (pooler, `connection_limit=1` 권장) |
| `DIRECT_URL` | `prisma migrate deploy` |
| `AUTH_SECRET` | NextAuth JWT (또는 `NEXTAUTH_SECRET`) |
| `NEXTAUTH_URL` | 배포 origin (**경로 붙이면 안 됨**) |
| `ADMIN_SETUP_SECRET` | 최초 ADMIN / recover |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Storage 클라이언트 |
| `CRON_SECRET` | Cron Bearer |
| `ANTHROPIC_API_KEY` | AI 답변 (check-env 필수, 없으면 mock) |

### 선택

| 변수 | 용도 |
|------|------|
| `AUTH_URL` | NextAuth v5 호스트 |
| `CHIEF_MANAGER_EMAIL` | 결제·즉시등록 Chief 매니저 |
| `DEFAULT_MANAGER_EMAIL` | Chief 폴백용 대표 매니저 |
| `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY` | 토스 위젯 |
| `SUPABASE_SERVICE_ROLE_KEY` | CMS 업로드·setup-storage |
| `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER_PHONE` | SMS |

### 주의

- `NEXTAUTH_URL`에 `/login` 등 경로 포함 → `basePath` 오염 → **전원 로그인 실패**
- `connection_limit=1`이면 동일 요청 내 Prisma `Promise.all` 병렬 쿼리 불가 — 코드는 순차·`cache()` 처리

---

## 15. 배포 & 운영

| 항목 | 값 |
|------|-----|
| 호스팅 | Vercel (`tutormatch-web`) |
| Cron | `GET /api/cron/check-alerts` 매일 00:00 UTC |
| Build | `prisma migrate deploy && next build` |
| postinstall | `prisma generate` |

### 자주 나는 이슈

- `AUTH_SECRET` / `NEXTAUTH_URL` 누락 → 로그인 실패
- `DIRECT_URL` 없음 → migrate 실패
- 마이그레이션 미적용 → P2022 (unknown column), 특히 로그인
- Chief 미설정 → 결제/즉시등록 503

### redirects (`next.config.mjs`)

- `/teacher-potal` → `/teacher-portal` (오타 수정)

---

## 16. `src/lib` 파일 인덱스

| 파일 | 역할 |
|------|------|
| **인프라** | |
| `prisma.ts` | PrismaClient 싱글톤 |
| `supabase-client.ts` | Storage 업로드 (anon) |
| `supabase-admin.ts` | Service role 클라이언트 |
| `perf-timer.ts` | 성능 타이머 |
| **인증** | |
| `admin-auth.ts` | ADMIN API 가드 + 페이지네이션 |
| `student-auth.ts` | STUDENT 가드 + 날짜 검증 |
| `teacher-auth.ts` | TEACHER/MANAGER 가드 |
| `manager-auth.ts` | MANAGER API 가드 |
| `manager-page-auth.ts` | MANAGER 페이지 redirect |
| `notification-auth.ts` | 알림 API 로그인 체크 |
| `portal-roles.ts` | 역할별 홈 href |
| `public-routes.ts` | 마케팅 공개 경로 |
| `phone-login.ts` | 합성 이메일·전화 정규화 |
| `get-teacher-cache.ts` | React `cache()` Teacher 조회 |
| `teacher-student-match.ts` | active 매칭 가드 |
| **등록·매니저** | |
| `student-enrollment.ts` | 상담 생성, Chief/Default 배정 |
| `chief-manager.ts` | Chief 매니저 조회 |
| `default-manager.ts` | 대표 매니저 조회 |
| `consultation-booking-dto.ts` | 상담 DTO |
| `consultation-grades.ts` | 학년 선택지 (13종) |
| `visit-consultation.ts` | 방문 시간 직렬화·검증 |
| **요금·결제** | |
| `pricing-plans.ts` | 플랜 정의·계산·checkout URL |
| `order-pricing.ts` | 체크아웃 breakdown·파싱 |
| `pricing-cms.ts` | CMS 요금 카드 빌드 |
| `pricing-tier-preference.ts` | 중등/고등 탭 sessionStorage |
| `toss-client.ts` | 토스 클라이언트 키 |
| `format-won.ts` | 원화 포맷 |
| **CMS** | |
| `cms-page-defaults.ts` | CMS 기본값·키·가시성·간격 |
| `cms-seed.ts` | DB 시드 |
| `cms.ts` | 공개 CMS 캐시 (후기·FAQ) |
| `site-content.ts` | SiteContent ISR |
| `public-cms-cache.ts` | 캐시 태그·revalidate |
| `compare-cms.ts` | 비교 테이블 CMS |
| `cta-benefits.ts` | CTA 혜택 카드 |
| `faq-defaults.ts` | FAQ 폴백 |
| **공개 데이터** | |
| `public-teachers-cache.ts` | 강사 목록/상세 캐시 |
| `landing-data.ts` | 쇼케이스 더미 데이터 |
| `landing-data-types.ts` | ShowcaseTutor 타입 |
| `public-card-sizes.ts` | 랜딩 카드 치수 |
| `result-card-images.ts` | RESULTS 이미지 URL |
| **학습** | |
| `study-plan-dates.ts` | 날짜·캘린더 유틸 |
| `slot-times.ts` | 수업 시간 슬롯 |
| **매니저 포털** | |
| `manager-stats.ts` | 완료율·배지·주간 범위 |
| `manager-student-stats.ts` | 학생별 주간 통계 |
| `manager-portal-data.ts` | 상담·매칭·모니터링 쿼리 |
| **알림·AI** | |
| `notifications.ts` | 알림 생성·UI 유틸 |
| `sms.ts` | Solapi SMS |
| `run-alert-checks.ts` | Cron 배치 |
| `ai-answer.ts` | Claude 답변 |
| **프로필** | |
| `profile-gender.ts` | 성별·기본 사진 |
| `teacher-profile-types.ts` | 프로필 폼 타입·JSON 파싱 |

---

## 17. 컴포넌트 인덱스

### `landing/`

`LandingRoot`, `LandingPageV2` (**활성**), `LandingPage`, `LandingPageThemed` (보존), `HomeConsultationCtaSection`, `ServiceCompareSection`, `SiteHeader`, 레거시 섹션들

### `dashboard/`

`StudentDashboard`, `DashboardCalendar`, `DailyPlanView`, `TaskList`, `SortableTaskItem`, `QuestionSection`, `QuestionCard`, `AddQuestionModal`, `CopyPlanModal`, `ConsultationBookingPage`, `VisitTimesPicker`, `DashboardTopBar`, `ImageLightbox`

### `teacher-portal/`

`TeacherPortalShell`, `TeacherPortalLoginClient`, `TeacherDashboardContent`, `TeacherProfileEditor`, `TeacherStudentsManager`, `TeacherStudentPlanTab`, `TeacherStudentQuestionsTab`, `ManagerConsultationsPage`, `ManagerMatchingPage`, `ManagerMonitoringPage`

### `admin/`

`AdminShell`, `AdminDashboard`, `AdminStudentsPage`, `AdminTeachersPage`, `AdminMatchesPage`, `AdminCmsPage`, `AdminDataPage`, `CmsEditOverlay`

### `pricing/` / `checkout/` / `auth/` / `consultation/`

`PricingContent`, `PricingPlanCard`, `PricingPlansGrid`, `FloatingConsultationCue`, `CheckoutContent`, `ConsultationSignupModal`, `ConsultationSignupForm`, `ConsultationApplyButton`

### `providers/`

`AppSessionProvider`, `ConsultationSignupProvider`, `PortalSiteContentProvider`, `PublicAppProviders`

### `ui/`

`DefaultAvatar`, `GenderSelect`

---

## 18. 구현 상태 & 미구현

### ✅ 구현됨

- 마케팅 전 페이지 + CMS + ISR 캐시
- 4역할 인증·라우트 가드
- 학생 플래너 (DnD), 질문, AI 답변
- 상담·방문 시간·매니저 배정·매칭
- 선생님 포털 (프로필·서류·학생 관리)
- 매니저 포털 (상담·매칭·모니터링)
- Admin CRUD + CMS + 데이터 조회
- 인앱 알림 + Cron 배치
- SMS (Solapi, env 설정 시)
- 결제 UI + 결제 후 Chief 배정
- 성별·기본 프로필 사진
- 랜딩 V2 테마 (다크/라이트, 그린/블루)

### ❌ 미구현 · 부분

| 항목 | 상태 |
|------|------|
| 서버 결제 승인·웹훅 | ❌ |
| 이메일 발송 | ❌ |
| Supabase Auth | ❌ (자체 인증) |
| 자동 선생님 추천 | ❌ (수동 매칭) |
| 실시간 채팅 | ❌ |
| AI 이미지 비전 | ❌ (URL 텍스트만) |
| 학생 아바타 UI | 부분 (`gender` 저장만) |
| i18n | ❌ (한국어 고정) |
| E2E 테스트 | ❌ |

### 우선순위 제안

1. **P0** — 토스 서버 승인 검증, 결제 위변조 방지
2. **P0** — `CHIEF_MANAGER_EMAIL` 운영 문서화 + Vercel env
3. **P1** — Supabase Storage RLS 점검
4. **P1** — `assignDefaultManagerToStudent` 정리 (미사용)
5. **P2** — 레거시 랜딩 컴포넌트 정리 (`LandingPage`, `Hero.tsx` 등)
6. **P2** — `AdminCmsPage` 분할

---

## 19. 알려진 이슈 & 주의사항

| 이슈 | 설명 |
|------|------|
| 결제 검증 없음 | Success URL·클라이언트 위젯만 신뢰 |
| 토스 테스트 키 폴백 | `toss-client.ts` 하드코드 |
| 로그인 P2022 | DB 스키마 ≠ Prisma → migrate 필수 |
| CMS 캐시 300s | 변경 후 최대 5분 지연 |
| 합성 이메일 | `*@concord.local` — 실제 메일 없음 |
| Admin setup | non-production에서 secret 없이 허용 가능 |
| `instantEnroll` 에러 메시지 | `NO_DEFAULT_MANAGER` 체크하나 실제는 Chief 호출 |
| Prisma connection_limit=1 | 병렬 쿼리 주의 |

### 코드에서 특이한 처리

1. `auth.ts` `basePath: "/api/auth"` — `NEXTAUTH_URL`에 path 금지
2. 일반 가입은 상담 레코드 미생성 — `/dashboard/consultation`에서 별도 신청
3. `PricingPlanCard` CTA → `/checkout` (상담 모달 아님)
4. `/?signup=1&instant=1` → 상담 모달 + Chief 즉시 배정
5. `.cursor/rules/verify-build.mdc` — 변경 후 `npm run build` 확인
6. `.cursor/rules/auto-commit-push.mdc` — 에이전트 자동 커밋 규칙 (사용자 규칙과 충돌 시 사용자 지시 우선)

---

## 20. 로컬 개발 체크리스트

```bash
cp .env.example .env          # 값 채우기
npm install
npx prisma migrate deploy     # 또는 migrate dev
npm run setup-storage         # (선택) Supabase 버킷
npm run dev
```

**검증 시나리오**:
1. 학생: 상담 가입 → 상담 신청 → (Admin/매니저 배정·매칭) → 플래너
2. 결제: `/checkout` → success → Chief 배정 확인
3. 관리자: `/login?setup=admin` + `ADMIN_SETUP_SECRET`
4. 빌드: `npm run build` (DB/env 필요)

---

## 21. 빠른 참조

| 작업 | 파일 |
|------|------|
| 요금·체크아웃 URL | `src/lib/pricing-plans.ts`, `PricingPlanCard.tsx` |
| 매니저 배정 | `src/lib/student-enrollment.ts`, `chief-manager.ts` |
| 로그인 | `auth.ts`, `phone-login.ts` |
| 라우트 가드 | `middleware.ts`, `public-routes.ts` |
| CMS 기본값 | `src/lib/cms-page-defaults.ts`, `cms-seed.ts` |
| 공개 CMS 조회 | `src/lib/cms.ts`, `site-content.ts` |
| 상담 CTA | `src/hooks/useConsultationCta.ts` |
| 알림 배치 | `src/lib/run-alert-checks.ts` |
| 방문 상담 | `src/lib/visit-consultation.ts` |
| 강사 공개 목록 | `src/lib/public-teachers-cache.ts` |

---

*문서가 오래되면 `git log -20`, `prisma/schema.prisma`, `src/app/api/**/route.ts` 트리를 먼저 다시 확인하세요.*
