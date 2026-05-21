# CLAUDE_HANDOFF.md

> **Concord Private Tutoring** (`premium-tutoring`) — 이 문서만 읽고 바로 개발에 참여할 수 있도록 작성된 핸드오프입니다.  
> 마지막 갱신: 2026-05-21 · 브랜치 `main` · 원격 `https://github.com/prosj04/tutormatchWEB.git`

---

## 1. 프로젝트 개요

### 서비스 이름 · 한 줄 설명

- **브랜드**: Concord. (메타데이터: Concord Private Tutoring)
- **한 줄**: 1:1 맞춤 과외 매칭·학습 관리 플랫폼 — 학부모/학생 상담 신청 → 매니저 배정 → 선생님 매칭 → 일별 학습 플랜·질문·AI/강사 답변.

### 타겟 사용자

| 역할 | 설명 |
|------|------|
| **STUDENT** | 학생(학부모가 대리 가입). 학습 플래너, 질문, 상담 예약. |
| **TEACHER** | 과외 선생님. 담당 학생 플랜·질문 답변, 프로필 관리. |
| **MANAGER** | 학습 매니저(같은 포털 UI). 상담 대기·배정, 학생–선생님 매칭, 모니터링. |
| **ADMIN** | 운영자. CMS, 학생/선생님/매칭, 통계, 알림 배치. |

### 핵심 기능 (구현 여부)

#### ✅ 구현됨

- **마케팅**: 홈(랜딩), 요금제, 강사진 목록/상세, FAQ, 학습후기, 공통 헤더·상담 CTA
- **가입·인증**: NextAuth JWT + Credentials(이메일 또는 전화번호), 학생 상담 가입 모달, 선생님 3단계 지원
- **결제 UI**: 토스페이먼츠 결제 위젯(테스트 키), `/checkout` → `/success`, 결제 후 Chief 매니저 배정 API
- **학생 대시보드**: 캘린더 기반 일별 학습 플랜(태스크 DnD), 질문+이미지 업로드, AI 답변(Anthropic), 상담·방문 시간
- **선생님/매니저 포털**: 학생 관리, 플랜 코멘트, 질문 답변, 프로필·서류, 매니저 상담/매칭/모니터링
- **관리자**: 대시보드 통계, 학생·선생님 CRUD, Teacher–Student 매칭, CMS(텍스트·이미지·FAQ·후기·요금제 카드 노출), 데이터 조회
- **알림**: DB 인앱 알림 + Vercel Cron 일일 배치(`check-alerts`)
- **CMS 연동**: `SiteContent` / `Testimonial` / `FaqItem`, 공개 페이지 revalidate 60s
- **성별·기본 프로필 사진**: Student/Teacher `gender`, CMS·로컬 기본 남/여 이미지

#### ❌ 미구현 · 부분 구현

- **실결제 정산**: 서버 측 결제 승인 검증(시크릿 키·웹훅) 없음 — 클라이언트 위젯 + success URL 파라미터만
- **SMS / 이메일 발송**: 없음 (알림은 앱 내 DB만)
- **Supabase Auth**: 미사용 (자체 User 테이블 + bcrypt)
- **자동 선생님 추천 알고리즘**: 매니저 수동 매칭만
- **실시간 채팅**: 없음
- **학생 프로필 아바타 UI**: `gender` 저장만, 대시보드 아바타 노출 거의 없음
- **i18n**: 한국어 고정

---

## 2. 기술 스택

### 런타임 · 프레임워크

| 항목 | 버전 |
|------|------|
| Node | 20.x 권장 (`@types/node` ^20) |
| **Next.js** | 14.2.35 (App Router) |
| **React** | ^18 |
| **TypeScript** | ^5 |
| **Prisma** | 5.22.0 |
| **PostgreSQL** | Supabase 호스팅 |
| **Tailwind CSS** | ^3.4.1 |
| **next-auth** | ^5.0.0-beta.31 (JWT) |

### package.json dependencies (전체)

```json
"@anthropic-ai/sdk": "^0.96.0",
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2",
"@prisma/client": "5.22.0",
"@supabase/supabase-js": "^2.105.4",
"@tosspayments/payment-widget-sdk": "^0.12.1",
"bcryptjs": "^3.0.3",
"framer-motion": "^12.38.0",
"next": "14.2.35",
"next-auth": "^5.0.0-beta.31",
"react": "^18",
"react-dom": "^18"
```

### devDependencies

```json
"@types/bcryptjs": "^2.4.6",
"@types/node": "^20",
"@types/react": "^18",
"@types/react-dom": "^18",
"eslint": "^8",
"eslint-config-next": "14.2.35",
"postcss": "^8",
"prisma": "5.22.0",
"tailwindcss": "^3.4.1",
"typescript": "^5"
```

### 스크립트

- `npm run dev` — 개발 서버
- `npm run build` / `start` — 프로덕션
- `npm run lint` — ESLint
- `postinstall` — `prisma generate`

### 폰트 · UI

- **Pretendard** (`public/fonts/`, `--font-pretendard`)
- Primary `#2563EB`, Accent `#E91E8C`, Neutral 스케일 (`tailwind.config.ts`)

---

## 3. 폴더 구조

```
premium-tutoring/
├── auth.ts                 # NextAuth 설정 (루트; basePath /api/auth)
├── middleware.ts           # 역할별 라우트 가드
├── next.config.mjs         # redirects, Prisma external, 이미지 도메인
├── vercel.json             # Cron: /api/cron/check-alerts 매일 00:00 UTC
├── prisma/
│   ├── schema.prisma
│   └── migrations/         # Supabase/인덱스/성별/방문상담 등
├── public/
│   ├── fonts/              # Pretendard subset woff2
│   └── images/teachers/    # default-male.png, default-female.png
└── src/
    ├── app/                # App Router 페이지 + API
    ├── components/         # UI·도메인 컴포넌트
    ├── hooks/              # useConsultationCta 등
    ├── lib/                # 비즈니스 로직·유틸
    └── types/              # next-auth.d.ts
```

### `src/app/` — 페이지·API

| 경로 | 역할 |
|------|------|
| `page.tsx` | 홈 — `LandingPage` (CMS) |
| `layout.tsx` | 전역 Session + ConsultationSignupProvider |
| `globals.css` | Tailwind base, 스크롤·FAQ 애니메이션 |
| `login/` | 로그인 (+ `?setup=admin` 최초 관리자) |
| `register/` | `/register` → 홈으로 리다이렉트 + 상담 모달 |
| `register/teacher/` | 선생님 3단계 지원 폼 |
| `pricing/` | 요금제 (`PublicShell`) |
| `checkout/` | 결제 |
| `success/` | 결제 완료 + Chief 배정 트리거 |
| `tutors/`, `tutors/[id]/` | 강사 목록·상세 |
| `faq/`, `reviews/` | FAQ·후기 |
| `dashboard/` | 학생 플래너 |
| `dashboard/consultation/` | 상담·방문 시간 |
| `teacher-portal/` | 포털 로그인 |
| `teacher-portal/dashboard/` | 선생님/매니저 대시보드·하위 탭 |
| `teacher-portal/apply/` | 지원 안내 |
| `admin/` | 관리자 (ADMIN 전용) |
| `api/**` | REST API (아래 §7) |

### `src/components/` — 도메인

| 폴더 | 역할 |
|------|------|
| `landing/` | `LandingPage`, `SiteHeader`, `HomeConsultationCtaSection` |
| `pricing/` | 요금제 카드·그리드·토글 |
| `checkout/` | 토스 위젯 결제 폼 |
| `auth/` | `ConsultationSignupForm`, 모달 |
| `dashboard/` | 학생 플래너·질문·캘린더·DnD |
| `teacher-portal/` | 포털 셸, 매칭, 상담, 프로필 편집 |
| `admin/` | 학생/선생님/매칭/CMS/데이터 |
| `consultation/` | `ConsultationApplyButton` |
| `layout/` | `PublicShell` |
| `providers/` | Session, CMS copy, 상담 모달 URL 파싱 |
| `ui/` | `GenderSelect`, `DefaultAvatar` |

### `src/lib/` — 핵심 라이브러리

| 파일 | 역할 |
|------|------|
| `prisma.ts` | Prisma 싱글톤 |
| `pricing-plans.ts` | 요금 계산, `buildCheckoutHref` |
| `order-pricing.ts` | 체크아웃 플랜 라벨·금액 |
| `student-enrollment.ts` | 상담 생성, Chief/기본 매니저 배정 |
| `chief-manager.ts` / `default-manager.ts` | 매니저 조회 |
| `profile-gender.ts` | 성별 파싱·기본 사진 URL |
| `cms-page-defaults.ts` | CMS 섹션 기본값·시드 키 |
| `pricing-cms.ts` | 요금제 카드 CMS 노출 필터 |
| `supabase-client.ts` | Storage 업로드 헬퍼 |
| `ai-answer.ts` | Claude 질문 답변 |
| `notifications.ts` / `run-alert-checks.ts` | 알림 생성·배치 |
| `phone-login.ts` | `student+{digits}@concord.local` 합성 이메일 |
| `portal-roles.ts` | 역할·포털 홈 href |
| `public-routes.ts` | 로그인 후에도 접근 가능한 마케팅 경로 |
| `toss-client.ts` | 결제 위젯 클라이언트 키 |

---

## 4. 페이지 & 라우팅

### 역할별 진입 (로그인 후)

| role | 기본 홈 (`portalHomeHref`) |
|------|---------------------------|
| STUDENT | `/dashboard` |
| TEACHER / MANAGER | `/teacher-portal/dashboard` |
| ADMIN | `/admin` |
| 비로그인 | `/` |

`middleware.ts`: STUDENT는 마케팅 공개 경로 + `/dashboard` + `/api`만; TEACHER/MANAGER는 마케팅 + `/teacher-portal` + `/api`; `/admin`은 ADMIN만.

### 공개·마케팅 페이지

| URL | 역할 | 주요 컴포넌트 |
|-----|------|----------------|
| `/` | 홈 랜딩 | `LandingPage`, `SiteHeader` |
| `/pricing` | 요금제 | `PricingContent`, `PublicShell` |
| `/tutors` | 강사 목록 | `TutorsListing` |
| `/tutors/[id]` | 강사 상세 | 서버 컴포넌트 + 프로필 |
| `/faq` | FAQ | `FaqPageContent` |
| `/reviews` | 후기 | `ReviewsPageContent` |
| `/login` | 로그인 | `LoginForm` |
| `/register` | 상담 유도 | `ConsultationSignupProvider` → `/?signup=1` |
| `/register/teacher` | 선생님 지원 | 다단계 폼 + `GenderSelect` |
| `/checkout` | 결제 | `CheckoutContent` (query: `sessions`, `subjects`, `tutor`) |
| `/success` | 결제 완료 | `SuccessPaymentComplete`, `SuccessPageActions` |

### 학생

| URL | 역할 | 주요 컴포넌트 |
|-----|------|----------------|
| `/dashboard` | 학습 플래너 | `StudentDashboard` — 매칭 없으면 `/dashboard/consultation` |
| `/dashboard/consultation` | 상담 신청·방문 시간 | `ConsultationBookingPage` |

### 선생님·매니저 포털 (`teacher-portal/dashboard/`)

| URL | 역할 | 비고 |
|-----|------|------|
| `/teacher-portal` | 로그인 | `TeacherPortalLoginClient` |
| `/teacher-portal/apply` | 지원 안내 | |
| `.../dashboard` | 홈 | `TeacherDashboardContent` |
| `.../students` | 담당 학생 | 플랜·질문 탭 |
| `.../profile` | 프로필 CMS용 | `TeacherProfileEditor` |
| `.../consultations` | 상담 (MANAGER) | `ManagerConsultationsPage` |
| `.../matching` | 매칭 (MANAGER) | `ManagerMatchingPage` |
| `.../monitoring` | 모니터링 (MANAGER) | `ManagerMonitoringPage` |

> **참고**: `approved: false` 선생님도 포털 대시보드 진입 가능(최근 정책). 공개 `/tutors`는 `approved: true`만.

### 관리자

| URL | 역할 |
|-----|------|
| `/admin` | 대시보드 `AdminDashboard` |
| `/admin/students` | 학생 목록·담당 매니저 |
| `/admin/teachers` | 선생님·승인·역할 |
| `/admin/matches` | Teacher–Student 매칭 |
| `/admin/cms` | 사이트 콘텐츠 |
| `/admin/data` | 플랜·질문 raw 조회 |

### API Auth

- `GET/POST /api/auth/*` — NextAuth (`auth.ts` handlers)

---

## 5. DB & Prisma

DB는 **Supabase PostgreSQL**. Prisma는 런타임 `DATABASE_URL`(pooler 6543), 마이그레이션 `DIRECT_URL`(5432).

### schema.prisma (전체)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  role          String         @default("STUDENT") // "STUDENT" | "TEACHER" | "MANAGER" | "ADMIN"
  student       Student?
  teacher       Teacher?
  notifications Notification[]
  createdAt     DateTime       @default(now())
}

model Student {
  id            String                @id @default(uuid())
  userId        String                @unique
  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  grade         String
  subjects      String
  phone         String
  /// "MALE" | "FEMALE" — 기본 프로필 이미지 구분
  gender        String?
  plans         StudyPlan[]
  questions     Question[]
  teachers      TeacherStudent[]
  consultationBooking ConsultationBooking?
  managerLinks  ManagerStudent[]
}

model Teacher {
  id              String             @id @default(uuid())
  userId          String             @unique
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  phone           String
  subjects        String
  bio             String
  education       String
  experience      String
  /// 공개 강사진 사진 구분: "MALE" | "FEMALE" (미설정 시 남성 기본 이미지)
  gender          String?
  approved        Boolean            @default(false)
  profile         TeacherProfile?
  students        TeacherStudent[]
  managerBookings ConsultationBooking[]
  managerStudents ManagerStudent[]   @relation("ManagerStudents")

  @@index([approved])
}

model TeacherStudent {
  id        String   @id @default(uuid())
  teacherId String
  studentId String
  teacher   Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subjects  String   // comma-separated
  startDate String   // "YYYY-MM-DD"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([teacherId, studentId])
  @@index([teacherId])
  @@index([studentId])
  @@index([isActive])
}

model StudyPlan {
  id        String      @id @default(uuid())
  studentId String
  student   Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  date      String      // "YYYY-MM-DD"
  tasks     StudyTask[]
  comment   String?
  commentAt DateTime?
  commentBy String?     // Teacher id
  createdAt DateTime    @default(now())

  @@index([studentId])
  @@index([date])
  @@index([studentId, date])
}

model StudyTask {
  id     String    @id @default(uuid())
  planId String
  plan   StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  title  String
  isDone Boolean   @default(false)
  doneAt DateTime?
  order  Int       @default(0)
}

model Question {
  id              String    @id @default(uuid())
  studentId       String
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  date            String    // "YYYY-MM-DD"
  content         String
  imageUrl        String?
  aiAnswer        String?
  teacherAnswer   String?
  teacherAnswerAt DateTime?
  answeredBy      String?
  isResolved      Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([studentId])
  @@index([studentId, date])
  @@index([isResolved])
  @@index([createdAt])
}

model TeacherProfile {
  id           String   @id @default(uuid())
  teacherId    String   @unique
  teacher      Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  photoUrl     String?
  intro        String?
  career       String?  // JSON array string
  education    String?
  certificates String?
  resumeUrls   String?
  documentUrls String?
  updatedAt    DateTime @default(now()) @updatedAt
}

model ConsultationBooking {
  id             String    @id @default(uuid())
  studentId      String    @unique
  student        Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  managerId      String?
  manager        Teacher?  @relation(fields: [managerId], references: [id])
  preferredTimes      String    @default("[]")
  visitPreferredTimes String    @default("{}")
  status              String    @default("WAITING")
  // WAITING | ASSIGNED | COMPLETED | CANCELLED
  note           String?
  managerNote    String?
  assignedAt     DateTime?
  createdAt      DateTime  @default(now())

  @@index([managerId])
  @@index([status])
  @@index([managerId, status])
  @@index([status, createdAt])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  body      String
  isRead    Boolean  @default(false)
  relatedId String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([userId, createdAt])
  @@index([userId, isRead])
}

model ManagerStudent {
  id        String   @id @default(uuid())
  managerId String
  manager   Teacher  @relation("ManagerStudents", fields: [managerId], references: [id], onDelete: Cascade)
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([managerId, studentId])
  @@index([managerId])
  @@index([studentId])
}

model SiteContent {
  id        String   @id @default(uuid())
  section   String
  key       String
  value     String
  type      String   @default("text")
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  updatedAt DateTime @updatedAt
  updatedBy String?

  @@unique([section, key])
}

model Testimonial {
  id        String   @id @default(uuid())
  quote     String
  author    String
  imageUrl  String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model FaqItem {
  id        String   @id @default(uuid())
  question  String
  answer    String
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 모델 관계 요약

```
User 1──1 Student | 1──1 Teacher
Student N──M Teacher (TeacherStudent, subjects/startDate/isActive)
Student 1──1 ConsultationBooking N──1 Teacher(manager)
Student N──M Teacher (ManagerStudent, 매니저–학생 링크)
Student 1──N StudyPlan 1──N StudyTask
Student 1──N Question
Teacher 1──1 TeacherProfile
User 1──N Notification
SiteContent / Testimonial / FaqItem — CMS (User FK 없음)
```

### 마이그레이션 (로컬 폴더)

- `20260514190000_supabase_init`
- `20260516000000_baseline_missing_tables`
- `20260517000000_add_indexes`
- `20260518081500_add_teacher_documents`
- `20260520120000_visit_consultation_times`
- `20260520180000_teacher_gender`
- `20260521120000_student_gender`

배포 DB 반영: `npx prisma migrate deploy` (DIRECT_URL 필요).

---

## 6. Supabase 사용 현황

### 프로젝트 지역

- 코드 저장소에 **고정 region 없음**. `DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` 호스트에서 확인 (예: `ap-northeast-2.pooler.supabase.com`).

### Auth

- **Supabase Auth 미사용.**
- 인증: **NextAuth v5 JWT** + **Credentials** (`auth.ts`)
  - 이메일 + 비밀번호
  - 전화번호 → `Student.phone` / `Teacher.phone` 또는 합성 이메일 `student+{digits}@concord.local`, `teacher+{digits}@concord.local`
- 비밀번호: `bcryptjs` 해시 (`User.password`)

### Storage (버킷)

| 버킷 | 용도 | 업로드 위치 |
|------|------|-------------|
| `question-images` | 학생 질문 첨부 | 클라이언트 `uploadQuestionImage` |
| `teacher-photos` | 선생님 프로필 사진 | 클라이언트·관리자 API |
| `teacher-documents` | 이력서·증빙 PDF/이미지 | 가입·포털·관리자 (경로 저장, signed URL 조회) |
| `cms-images` | CMS 이미지 | `POST /api/admin/cms/upload-image` (없으면 createBucket) |

클라이언트: `@supabase/supabase-js` + `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`.

### RLS

- **앱 코드에 RLS 정책 정의 없음.** Supabase 대시보드에서 버킷 public/정책을 별도 설정했을 수 있음 → 배포 환경 문서/대시보드 확인 필요.
- API 라우트·서버에서 `createSupabaseBrowserClient()`로 업로드/서명 URL 생성.

### Edge Functions

- **미사용.**

---

## 7. API 구조

Base: `/api`. 인증은 대부분 `auth()` 세션 + 역할 체크 헬퍼(`requireAdmin`, `teacher-auth` 등).

### Auth

| Method | Path | 역할 |
|--------|------|------|
| * | `/api/auth/[...nextauth]` | NextAuth 핸들러 |

### Register

| Method | Path | 역할 · 파라미터 |
|--------|------|-----------------|
| POST | `/api/register/student` | 상담 가입. `name, phone, password, grade, subjects, gender`, optional `instantEnroll`, `note` |
| POST | `/api/register/teacher` | 선생님 지원 생성 |
| PATCH | `/api/register/teacher` | 지원 후 `resumeUrls`, `documentUrls` 등 프로필 경로 저장 |

### Consultation

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/consultation/request` | 상담 신청 (WAITING) |
| GET | `/api/consultation/my-booking` | 내 상담 상태 |
| PATCH | `/api/consultation/visit-times` | 방문 희망 시간 JSON |

### Payments

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/payments/complete` | 결제 완료 후 STUDENT → `assignChiefManagerToStudent`. Body: `orderId` |

### Plans & Questions (학생·공통)

| Method | Path | 역할 |
|--------|------|------|
| GET/POST | `/api/plans` | 일별 플랜 조회·생성 (`date`, `studentId` 등) |
| POST | `/api/plans/copy` | 플랜 복사 |
| POST | `/api/plans/[planId]/tasks` | 태스크 추가 |
| PATCH/DELETE | `/api/plans/tasks/[taskId]` | 태스크 완료·삭제·순서 |
| GET/POST | `/api/questions` | 질문 목록·생성 |
| PATCH | `/api/questions/[id]` | 질문 수정 |
| POST | `/api/questions/[id]/ai-answer` | AI 답변 생성 |

### Teacher

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/teacher/students` | 담당 학생 목록 |
| GET | `/api/teacher/students/[id]/plans` | 학생 플랜 |
| GET | `/api/teacher/students/[id]/questions` | 학생 질문 |
| PATCH | `/api/teacher/plans/[planId]/comment` | 플랜 코멘트 |
| PATCH | `/api/teacher/questions/[id]/answer` | 강사 답변 |
| GET/PATCH | `/api/teacher/profile` | 프로필 조회·수정 |
| GET/POST/DELETE | `/api/teacher/profile/documents` | 서류 signed URL |

### Manager

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/manager/consultations/waiting` | 대기 상담 |
| GET | `/api/manager/consultations/mine` | 내 배정 상담 |
| PATCH | `/api/manager/consultations/[id]/assign` | 상담 가져오기 |
| PATCH | `/api/manager/consultations/[id]/complete` | 완료 |
| PATCH | `/api/manager/consultations/[id]/cancel` | 취소 |
| GET/POST | `/api/manager/matches` | 매칭 후보·생성 |
| GET | `/api/manager/monitoring` | 모니터링 목록 |
| GET | `/api/manager/monitoring/stats` | 통계 |

### Admin

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/admin/setup` | 최초 ADMIN (`ADMIN_SETUP_SECRET`) |
| POST | `/api/admin/recover` | ADMIN 비밀번호 복구 |
| GET | `/api/admin/stats` | 대시보드 통계 |
| GET | `/api/admin/students` | 학생 페이지네이션·검색 |
| PATCH/DELETE | `/api/admin/students/[id]` | 학생 수정·삭제 |
| GET | `/api/admin/teachers` | 선생님 목록 |
| PATCH/DELETE | `/api/admin/teachers/[id]` | 선생님 수정·삭제 |
| PATCH | `/api/admin/teachers/[id]/role` | TEACHER↔MANAGER |
| POST | `/api/admin/teachers/[id]/photo` | 사진 업로드 |
| GET/DELETE | `/api/admin/teachers/[id]/documents` | 서류 |
| GET/POST | `/api/admin/matches` | 매칭 |
| PATCH/DELETE | `/api/admin/matches/[id]` | 매칭 수정 |
| GET/PATCH/POST/DELETE | `/api/admin/cms` | SiteContent CRUD |
| GET/PATCH | `/api/admin/cms/content` | 섹션별 콘텐츠 |
| POST | `/api/admin/cms/init` | CMS 시드 |
| POST | `/api/admin/cms/upload-image` | 이미지 업로드 |
| GET/POST | `/api/admin/cms/faq`, `/faq/[id]` | FAQ |
| GET/POST | `/api/admin/cms/testimonials`, `/[id]` | 후기 |
| GET | `/api/admin/data/plans`, `/questions` | 운영 데이터 조회 |
| POST | `/api/admin/check-alerts` | 수동 알림 배치 |

### Notifications

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/notifications` | 내 알림 |
| PATCH | `/api/notifications/[id]/read` | 읽음 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 |

### Cron · Dev

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/cron/check-alerts` | Vercel Cron, `Authorization: Bearer CRON_SECRET` |
| POST | `/api/dev/skip-payment-enroll` | **임시** 결제 스킵 + Chief 배정 (주석: DELETE ME) |

---

## 8. 환경변수

**값은 커밋하지 않음.** `.env.example` + 코드 참조 기준 키 목록:

| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Prisma 런타임 (Supabase pooler, `pgbouncer=true`) |
| `DIRECT_URL` | `prisma migrate deploy` 전용 직접 연결 |
| `AUTH_SECRET` | NextAuth JWT 시크릿 (권장) |
| `NEXTAUTH_SECRET` | `AUTH_SECRET` 대체 |
| `NEXTAUTH_URL` | 배포 origin (**경로 붙이면 안 됨**, 예: `https://xxx.vercel.app/`) |
| `AUTH_URL` | NextAuth v5 호스트 URL |
| `ADMIN_SETUP_SECRET` | `/login?setup=admin`, `/api/admin/setup`, recover |
| `DEFAULT_MANAGER_EMAIL` | 일반 상담 즉시 배정 매니저 (선택) |
| `CHIEF_MANAGER_EMAIL` | **결제 완료** 시 Chief 매니저 (선택, `.env.example` 미기재) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Storage 클라이언트 |
| `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY` | 토스 결제 위젯 (미설정 시 문서용 `test_gck_*` 기본값) |
| `ANTHROPIC_API_KEY` | AI 질문 답변 (없으면 AI 비활성) |
| `CRON_SECRET` | `/api/cron/check-alerts` Bearer |
| `NODE_ENV` | `production`에서 setup secret 필수 등 |

---

## 9. 배포 환경

| 항목 | 값 |
|------|-----|
| **호스팅** | Vercel |
| **Vercel 프로젝트명** | `premium-tutoring` (`.vercel/project.json`) |
| **GitHub 레포** | `prosj04/tutormatchWEB` |
| **Cron** | `vercel.json` → 매일 `GET /api/cron/check-alerts` |
| **Prisma** | `postinstall`: `prisma generate`; migrate는 CI/수동 `migrate deploy` |

### 배포 상태

- 이 문서 작성 시점에 **Vercel CLI/gh API로 라이브 배포 성공 여부는 미확인**.
- 최근 `main` 커밋은 푸시됨 (`b0b036b` 요금제 CTA → checkout 복구 등).
- 확인 방법: Vercel 대시보드 → `premium-tutoring` → Deployments / Build Logs.

### 배포 시 자주 나는 이슈

- `AUTH_SECRET` / `NEXTAUTH_URL` 누락 → 로그인 전원 실패
- `NEXTAUTH_URL`에 `/login` 등 경로 포함 → `basePath` 오염
- `DATABASE_URL`만 있고 `DIRECT_URL` 없음 → migrate 실패
- Prisma 마이그레이션 미적용 → `P2022` unknown column (특히 로그인 select)

---

## 10. 현재 개발 상황

### 완료된 기능 (최근)

- 상담 CTA 통일 (`useConsultationCta`, `ConsultationApplyButton`)
- 요금제 페이지 레이아웃·홈 상담 CTA CMS (`HomeConsultationCtaSection`)
- 학생/선생님 **성별 필수** + 기본 프로필 이미지
- 결제 완료 시 **Chief_manager** 즉시 배정 (`/api/payments/complete`)
- 선생님 전화 가입·로그인, 미승인 포털 진입
- 관리자 테이블 UX (담당 매니저, 열 너비)
- 모바일 반응형 1차 (공개·결제·로그인)
- 요금제 카드 → **`/checkout` 복구** (`buildCheckoutHref`)

### 진행 중 / 방금 맞춘 것

- 마케팅·결제 플로우 안정화
- CMS 기본 문구와 실제 UI 문구 동기화(단가 문구 제거 등)

### 앞으로 할 일 (우선순위 제안)

1. **P0** — 프로덕션 결제: 토스 시크릿 키·서버 승인 검증, `skip-payment-enroll` 제거
2. **P0** — `CHIEF_MANAGER_EMAIL` / 매니저 시드 운영 문서화 + Vercel env 등록
3. **P1** — Supabase Storage RLS·버킷 정책 점검
4. **P1** — CMS DB에 남은 구형 `header_subtext` 정리
5. **P2** — 학생 아바타 UI, 이메일/SMS 알림
6. **P2** — `LandingPage` vs 레거시 `Hero.tsx` 등 중복 컴포넌트 정리

---

## 11. 알려진 버그 & 이슈

| 이슈 | 설명 |
|------|------|
| 결제 검증 없음 | Success URL만 신뢰; 위변조·미결제 성공 페이지 가능 |
| `dev/skip-payment-enroll` | 모든 환경 노출 임시 API — 제거 예정 |
| 토스 테스트 키 기본값 | `toss-client.ts` 하드코드 fallback |
| 로그인 P2022 | DB 스키마 ≠ Prisma 시 전체 로그인 실패 → `userForAuthSelect`로 relation 최소화했으나 마이그레이션 필수 |
| Chief 미설정 | `NO_CHIEF_MANAGER` / 503 — env·DB 매니저 확인 |
| CMS 캐시 | `revalidate = 60` — CMS 변경 후 최대 1분 지연 |
| 합성 이메일 | `*@concord.local` — 실제 메일 발송 없음 |
| 관리자 setup | non-production에서 `ADMIN_SETUP_SECRET` 없이 setup 허용 가능 |

### 우회·임시 처리

- 결제 스킵 버튼 (`DevSkipPaymentButton`) + `/api/dev/skip-payment-enroll`
- AI 답변: 키 없으면 `isAiAnswerEnabled()` false
- 기본 매니저: `CHIEF` → 이름 검색 → `DEFAULT_MANAGER_EMAIL` → 첫 MANAGER

---

## 12. 기타 주의사항

### 외부 연동

| 서비스 | 용도 |
|--------|------|
| **Supabase** | PostgreSQL + Storage |
| **Vercel** | 호스팅 + Cron |
| **Toss Payments** | 결제 위젯 (클라이언트) |
| **Anthropic Claude** | 학생 질문 AI 답변 |

SMS·이메일·카카오 알림톡: **없음**.

### 코드에서 특이한 처리

1. **`auth.ts` `basePath: "/api/auth"`** — `NEXTAUTH_URL`에 path 넣지 말 것.
2. **로그인 `userForAuthSelect`** — relation 전체 include 금지 (마이그레이션 누락 컬럼 방어).
3. **날짜** — 학습/질문/매칭 `startDate`·`date`는 **string `YYYY-MM-DD`** (타임존은 `study-plan-dates.ts` 등 참고).
4. **상담 CTA** — 비로그인: 모달 / STUDENT: `/dashboard/consultation` / TEACHER·MANAGER: 포털 / ADMIN: `/admin`.
5. **요금제 CTA** — `PricingPlanCard` → `buildCheckoutHref` → `/checkout?sessions=&subjects=&tutor=1`.
6. **`/?signup=1&instant=1`** — 상담 모달 + instantEnroll (요금제 카드와 별개).
7. **`.cursor/rules/auto-commit-push.mdc`** — 의미 있는 변경 후 자동 커밋·푸시 규칙(에이전트용).

### 리팩토링 후보

- `src/components/landing/Hero.tsx`, `Features.tsx` 등 — 현재 홈은 **`LandingPage.tsx` 단일** 사용 여부 확인 후 dead code 제거
- `buildInstantSignupHref` — 상담 모달용으로만 유지 vs checkout 통일 정책 문서화
- Admin CMS 거대 컴포넌트 `AdminCmsPage.tsx` 분할
- Storage 업로드를 서버 전용 service role로 이전 (anon 키 노출 최소화)
- 결제·등록 플로우 E2E 테스트 부재

### 로컬 실행 체크리스트

```bash
cp .env.example .env   # 값 채우기
npm install
npx prisma migrate deploy   # 또는 dev: migrate dev
npm run dev
```

- 학생 테스트: 상담 가입 → (선택) checkout → success → Chief 배정 확인
- 관리자: `/login?setup=admin` + `ADMIN_SETUP_SECRET`

---

## 빠른 참조 — 파일 수정 시 자주 보는 곳

| 작업 | 파일 |
|------|------|
| 요금·체크아웃 URL | `src/lib/pricing-plans.ts`, `src/components/pricing/PricingPlanCard.tsx` |
| 매니저 배정 | `src/lib/student-enrollment.ts`, `src/lib/chief-manager.ts` |
| 로그인 | `auth.ts`, `src/lib/phone-login.ts` |
| 라우트 가드 | `middleware.ts`, `src/lib/public-routes.ts` |
| CMS 기본값 | `src/lib/cms-page-defaults.ts` |
| 공개 요금 카드 | `src/lib/pricing-cms.ts` |
| 상담 버튼 동작 | `src/hooks/useConsultationCta.ts` |

---

*문서가 오래되면 `git log -20`, `prisma/schema.prisma`, `src/app/api` 트리를 먼저 다시 확인하세요.*
