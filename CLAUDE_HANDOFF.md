# CLAUDE_HANDOFF.md

> **Concord Private Tutoring** (`premium-tutoring`) — 이 문서만 읽고 바로 개발에 참여할 수 있도록 작성된 핸드오프입니다.  
> 마지막 갱신: **2026-07-03 15:10 KST** · 브랜치 `main` · 원격 `https://github.com/prosj04/tutormatchWEB.git`

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
22. [미구현 핵심 플로우](#22-미구현-핵심-플로우)

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

### 0. 현재 작업 상태 요약 (2026-07-03)

- 로컬 `main`은 `origin/main`보다 12커밋 앞서 있음. 원격에는 아직 반영되지 않았다.
- 워크트리는 현재 clean 상태다. phase2 core loop 변경은 `feat(homework): align templates with core loop schema` 커밋(`a4408b5`)에 반영됐다.
- 이 묶음은 "첫 수업 설정 → 자동 숙제 분배 → 템플릿 CRUD 정합화 → 모바일 journey 갱신"으로 이어지는 phase2 core loop 보강이다.
- 배포 운영을 위해 `CRON_SECRET`은 Vercel Production env / GitHub Actions secret에 설정 완료했다.
- hourly GitHub Actions fallback은 초안까지 만들었지만, 현재 브랜치에는 포함하지 않았다. GitHub PAT에 `workflow` scope가 없어서 원격 push가 막혔고, 다음 세션에서 scope 보강 또는 SSH/대체 인증이 필요하다.
- 현재 브랜치가 실제로 담고 있는 cron은 Vercel daily 체크만이다. hourly fallback은 후속 세션에서 다시 붙인다.

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

운영 스케줄(2026-07-03 기준):

- **Vercel Cron**: Hobby 플랜 제한 때문에 `/api/cron/check-alerts`는 `vercel.json`에서 매일 00:00 UTC만 등록.
- **GitHub Actions**: `.github/workflows/hourly-alerts.yml`이 매시 정각 `https://tutormatch-web.vercel.app/api/cron/check-alerts`를 호출해 24h/1h 수업 리마인더를 보완.
- 두 경로 모두 `Authorization: Bearer ${CRON_SECRET}` 필요. `CRON_SECRET`은 Vercel Production env와 GitHub Actions secret에 같은 값으로 설정되어야 한다.

주요 작업:

1. **미답변 질문**: 웹 `Question` + 모바일 `QuestionMessage`, 24h 경과 → 선생님/매니저 알림 (중복 방지)
2. **주간 진도**: KST 월요일만, 전주 완료율 <50% / <70% → 매니저
3. **대기 상담**: WAITING 2h+ → 모든 매니저
4. **매칭 수락 대기**: `TeacherStudent.matchStatus=PENDING_STUDENT_ACCEPT`, 24h+ → 학생 수락 리마인더
5. **첫 수업 미설정**: 수락 후 48h+ 첫 수업 없음 → 선생님 리마인더
6. **구독 만료**: D-5/D-1 → 학생 `/pricing` 안내
7. **수업 리마인더**: 시작 24h/1h 전 학생·선생님 알림
8. **수업 완료 전환**: 과거 `SCHEDULED` 수업을 12h 버퍼 후 `COMPLETED`로 전환하고 lesson-source `StudySession` 재계산

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
| `ENABLE_AUTO_HOMEWORK_DISTRIBUTION` | 첫 수업 설정 후 템플릿 기반 숙제 자동 분배. 기본 OFF, 운영에서 명시적으로 `true`일 때만 동작 |

### 주의

- `NEXTAUTH_URL`에 `/login` 등 경로 포함 → `basePath` 오염 → **전원 로그인 실패**
- `connection_limit=1`이면 동일 요청 내 Prisma `Promise.all` 병렬 쿼리 불가 — 코드는 순차·`cache()` 처리

---

## 15. 배포 & 운영

| 항목 | 값 |
|------|-----|
| 호스팅 | Vercel (`tutormatch-web`) |
| Cron | Vercel daily + GitHub Actions hourly (`.github/workflows/hourly-alerts.yml`) |
| Build | `prisma migrate deploy && next build` |
| postinstall | `prisma generate` |

### 2026-07-03 운영 메모

- Vercel Hobby 플랜은 hourly cron을 허용하지 않으므로 `vercel.json`의 `/api/cron/check-alerts`는 daily로 유지한다.
- hourly alert는 GitHub Actions workflow가 담당한다. 배포 후 GitHub Actions secret `CRON_SECRET`과 Vercel Production env `CRON_SECRET`이 둘 다 존재하는지 확인한다.
- `ENABLE_AUTO_HOMEWORK_DISTRIBUTION`은 Production env에 없으면 안전하게 OFF다. 자동 분배를 켤 때만 `true`로 추가한다.
- Production deploy는 파일 수 제한을 피하려면 `vercel --prod --yes --archive=tgz`를 사용한다.
- 배포 후 smoke test 최소 경로: `/`, `/pricing`, `/register`, `/dashboard/consultation`, `/admin/payments`, `/api/cron/check-alerts`(401 확인 후 secret 호출).

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

> **재확인 기준**: 2026-06-30 · `main` · `HANDOFF.md` 교차 검증

### ✅ 구현됨 (웹)

- 마케팅 전 페이지 + CMS + ISR 캐시
- 4역할 인증·라우트 가드 (`STUDENT` / `TEACHER` / `MANAGER` / `CHIEF_MANAGER` / `ADMIN`)
- 학생 플래너 (DnD), 일별 질문 (`Question` 모델), AI 답변 (`ANTHROPIC_API_KEY` 시)
- 상담·방문 시간·매니저 배정·매칭 (매니저/Admin 수동)
- `resolveStudentJourneyStage()` — 웹 `/dashboard`는 `ACTIVE`만 진입 (`FIRST_LESSON_PENDING` 포함 비활성)
- 웹 가입 `POST /api/register/student` — `instantEnroll` 아닐 때 상담 booking 자동 생성
- 선생님 포털 (프로필·서류·학생 관리·첫 수업 일정·과제 분배 API)
- 매니저 포털 (상담·매칭·모니터링·강사 승인)
- Admin CRUD + CMS + 데이터 조회 + **전환 퍼널** (`/admin/funnel`, `AnalyticsEvent` DB)
- 인앱 알림 + Cron 배치 (`/api/cron/check-alerts`)
- SMS (Solapi, env 설정 시)
- 토스 결제 **위젯 UI** + success 페이지 → `completeStudentPayment()` (Chief 배정·구독 활성화)
- Chief 매니저 배정 로직 (`getChiefManager` → `assignChiefManagerToStudent`)
- 성별·기본 프로필 사진
- 랜딩 V2 테마 (다크/라이트, 그린/블루)
- 학생 웹 페이지: `/questions`, `/payments`, `/notifications`

### ✅ 구현됨 (모바일 · Expo 56)

- JWT 인증 (`/api/mobile/auth/*`) + AsyncStorage 토큰
- Journey 기반 cold start 라우팅 (`mobile/app/index.tsx` → status / match / tabs)
- 상담 퍼널: `consult/index` → (비로그인 pending) → signup attach → `consult/status` → `consult/match`
- 탭 API 연동: 홈·학습·QnA·MY·알림·리포트 (`/api/mobile/*`)
- QnA 채팅 (`QuestionMessage` 모델, `/api/mobile/qna`)
- `ErrorState` / `EmptyState` 분리 (홈·학습·QnA·MY·status)
- Expo 푸시 토큰 등록 (`expo-notifications` + `POST /api/mobile/push/register`)
- 분석 이벤트 전송 (`POST /api/events` → DB)

### ⚠️ 부분 구현

| 항목 | 현재 상태 (코드 기준) |
|------|----------------------|
| 결제 | 토스 위젯은 웹에만 있음. **서버 PG 승인 없음** — `orderId`만으로 구독 활성화 |
| 모바일 결제 | `checkout.tsx`가 `POST /api/mobile/payments/complete`에 `mobile-${Date.now()}` 전송 — **PG 없음** |
| Chief 자동 배정 | 결제·`instantEnroll` 경로만. 일반 상담 신청(`createConsultationRequest`)은 **매니저 수동 배정** |
| 선생님 매칭 | 매니저 `POST /api/manager/matches`로 즉시 `TeacherStudent` 생성 — **선생님 수락 단계 없음** |
| 첫 수업 일정 | API + 교사 포털 UI 있음. 앱·학생 측 설정 UI 없음. `FIRST_LESSON_PENDING`은 **웹 journey만** |
| 숙제 자동 분배 | API + 교사 포털 UI 있음. **매칭/첫 수업 후 자동 트리거 없음** (수동 호출) |
| QnA 데이터 | 웹 대시보드=`Question`, 앱=`QuestionMessage` — **모델 이원화** |
| 푸시 | 서버 발송(`expo-push.ts`) + 등록 있음. 실기기 E2E·`FIRST_LESSON_SET` 푸시 타입 미포함 |
| Journey 단계 | 웹 `FIRST_LESSON_PENDING` 있음 / 앱 enum에 **없음** (`mobile/lib/student-journey.ts`) |
| 방문 상담 시간 | 웹 `ConsultationBookingPage`만. **앱 미노출** |
| 수업 입장 | `Lesson.joinUrl` 필드만 — 영상/화상 연동 **미검증** |

### ❌ 미구현

| 항목 | 상태 |
|------|------|
| 토스 서버 승인·웹훅 | ❌ `paymentKey`/`amount` 미검증 |
| 이메일 발송 | ❌ |
| Supabase Auth | ❌ (자체 bcrypt + JWT) |
| 자동 선생님 추천·매칭 알고리즘 | ❌ (매니저 수동) |
| 선생님 매칭 수락/거절 워크플로 | ❌ |
| 상담 접수 시 Chief 자동 배정 (비결제) | ❌ |
| 매칭·첫 수업 후 숙제 자동 생성 | ❌ |
| 실시간 채팅 (WebSocket) | ❌ |
| AI 이미지 비전 | ❌ (URL 텍스트만) |
| i18n | ❌ (한국어 고정) |
| E2E 테스트 | ❌ |
| `POST /api/dev/skip-payment-enroll` | ❌ 프로덕션 `src/`에 **없음** (`.claude/worktrees/`에만 존재) |

### 우선순위 제안 (2026-06-30)

1. **P0** — 토스 서버 승인 검증 (`/api/payments/complete`, `/api/mobile/payments/complete`)
2. **P0** — 모바일 checkout 실 PG 연동 또는 웹뷰 위임
3. **P0** — `CHIEF_MANAGER_EMAIL` / `CHIEF_MANAGER` 역할 운영 세팅 문서화
4. **P1** — QnA 모델 통합 (`Question` ↔ `QuestionMessage`)
5. **P1** — 웹/앱 journey enum 동기화 (`FIRST_LESSON_PENDING`)
6. **P1** — Supabase Storage RLS 점검
7. **P2** — 레거시 랜딩 컴포넌트 정리 (`LandingPage`, `Hero.tsx` 등)
8. **P2** — `AdminCmsPage` 분할

---

## 19. 알려진 이슈 & 주의사항

### 결제 검증 우회 (P0 — 보안)

| 위치 | 동작 | 위험 |
|------|------|------|
| `src/lib/student-payment.ts` | `completeStudentPayment()` — 주석상 **PG 검증 분리·미구현**. `paymentKey`/`amount` 미사용 | 결제 없이 구독+Chief 배정 가능 |
| `POST /api/payments/complete` | NextAuth `STUDENT` 세션 + **non-empty `orderId`만** 검사 → `completeStudentPayment()` | 위젯 성공 URL만 알면 호출 가능 |
| `POST /api/mobile/payments/complete` | Mobile JWT + **`orderId`만** 검사 | 앱에서 임의 orderId 전송 가능 |
| `mobile/app/checkout.tsx` | `orderId: \`mobile-${Date.now()}\``, `amount: 740000` 하드코드 → 위 API 호출 | **실제 PG 없이** 결제 완료 UI 진입 |
| `src/components/success/SuccessPaymentComplete.tsx` | success 리다이렉트 후 `/api/payments/complete` 호출 (`paymentKey` body에 포함하나 **서버 무시**) | 클라이언트 신뢰 |
| `POST /api/dev/skip-payment-enroll` | **프로덕션 `src/app/api/`에 없음** — worktree 복사본에만 존재 | 로컬 혼동 주의 |

토스 **시크릿 키·confirm API** — repo에 서버 승인 구현 **NOT FOUND** (`src/lib/toss-client.ts`는 클라이언트 키만).

### 기타 이슈

| 이슈 | 설명 |
|------|------|
| 토스 테스트 키 폴백 | `toss-client.ts` 하드코드 |
| 로그인 P2022 | DB 스키마 ≠ Prisma → `prisma migrate deploy` 필수 |
| CMS 캐시 300s | 변경 후 최대 5분 지연 |
| 합성 이메일 | `*@concord.local` — 실제 메일 없음 |
| Admin setup | non-production에서 `ADMIN_SETUP_SECRET` 없이 허용 가능 |
| `instantEnroll` 에러 메시지 | `NO_DEFAULT_MANAGER` 체크하나 실제는 `getChiefManager()` 호출 |
| Prisma connection_limit=1 | 병렬 쿼리 주의 |
| QnA 모델 분리 | 웹 `Question` vs 앱 `QuestionMessage` — 답변·이력 불일치 가능 |
| Journey drift | 웹 `FIRST_LESSON_PENDING` / 앱 미반영 |
| `User.role` Prisma 주석 | `CHIEF_MANAGER` 누락 (런타임은 사용) |
| `npm run build` | `prisma migrate deploy` 필요 — DB 없으면 실패 |
| 모바일 tsc | `/(tabs)/` typed-route 경고 (`useAuth.ts`) |

### 코드에서 특이한 처리

1. `auth.ts` `basePath: "/api/auth"` — `NEXTAUTH_URL`에 path 금지
2. 웹 일반 가입(`instantEnroll` false) — **가입 직후** `createConsultationRequest()` 호출 (2026-06 이후). 별도 `/dashboard/consultation` 방문 없이 booking 생성 가능
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
| 모바일 API 기본 URL | `mobile/lib/api.ts` (`EXPO_PUBLIC_API_URL`) |
| Journey 단계 (웹) | `src/lib/student-journey.ts` |
| Journey 단계 (앱) | `mobile/lib/student-journey.ts` |
| 핸드오프 (아키텍처) | `HANDOFF.md` (루트) |

---

## 22. 미구현 핵심 플로우

> 현재 **Prisma 스키마**(`prisma/schema.prisma`) 기준으로, 의도된 비즈니스 플로우 대비 구현 가능 여부와 빠진 필드를 정리합니다.  
> 재확인: 2026-06-30

### 22.1 Chief Manager 자동 배정

| 항목 | 내용 |
|------|------|
| **의도** | 상담 접수 또는 결제 후 학생에게 Chief(대표) 매니저가 자동으로 붙는다 |
| **현재 구현** | **부분** — `assignChiefManagerToStudent()` (`src/lib/student-enrollment.ts`) + `getChiefManager()` (`src/lib/chief-manager.ts`) |
| **동작하는 경로** | `completeStudentPayment()` (웹·앱 결제 complete), `instantEnroll: true` 웹 가입, checkout success |
| **동작 안 하는 경로** | 일반 상담 `createConsultationRequest()` — `ConsultationBooking.status=WAITING`, `managerId=null`, 매니저들에게 `NEW_STUDENT_WAITING` 알림만 |
| **스키마로 가능?** | **예** — 기존 필드만으로 저장 가능 |
| **사용 테이블·필드** | `ConsultationBooking.managerId`, `ConsultationBooking.status`, `ConsultationBooking.assignedAt`, `ManagerStudent` (managerId+studentId) |
| **빠진 것 (스키마)** | 없음 (로직·트리거만 추가하면 됨) |
| **빠진 것 (운영·코드)** | DB에 `User.role=CHIEF_MANAGER` 또는 `CHIEF_MANAGER_EMAIL` env; 상담 신청 직후 자동 `assignChiefManagerToStudent` 호출 분기 미구현 |

### 22.2 선생님 배정 / 수락

| 항목 | 내용 |
|------|------|
| **의도** | 매니저가 후보 선생님을 제안하고, 선생님이 수락한 뒤 학생과 매칭된다 |
| **현재 구현** | **배정만** — `POST /api/manager/matches`, `POST /api/admin/matches`가 `TeacherStudent`를 **`isActive: true`로 즉시 생성**. `NEW_STUDENT_ASSIGNED` / `TEACHER_ASSIGNED` 알림 발송 |
| **수락 UI/API** | **NOT FOUND** — 선생님 포털에 수락·거절 화면·엔드포인트 없음 |
| **스키마로 가능?** | **부분** — 즉시 매칭 저장은 가능, **수락 대기 상태 표현 불가** |
| **사용 테이블·필드** | `TeacherStudent` (teacherId, studentId, subjects, startDate, isActive, createdAt) |
| **빠진 필드 (권장)** | `TeacherStudent.matchStatus` (`PENDING`/`ACCEPTED`/`DECLINED`) 또는 별도 `MatchProposal` 모델 (proposalId, teacherId, studentId, status, proposedAt, respondedAt) |
| **빠진 것 (코드)** | 선생님 수락 API, pending 상태 조회, 거절 시 재매칭 큐, 앱 `consult/match`는 **조회 전용** (선생님 선택·수락 없음) |

### 22.3 첫 수업 날짜 설정

| 항목 | 내용 |
|------|------|
| **의도** | 매칭 후 선생님이 첫 수업 일시를 정하고, 학생 앱·journey가 `ACTIVE`로 전환된다 |
| **현재 구현** | **API + 교사 포털 UI** — `PATCH /api/teacher/students/[id]/first-lesson` → `Lesson` create/update, `TeacherStudent.startDate` 갱신, `FIRST_LESSON_SET` 알림 |
| **Journey** | 웹 `resolveStudentJourneyStage()`: `activeTeacherCount>0 && lessonCount>0` → `ACTIVE`, 그 전 → `FIRST_LESSON_PENDING` |
| **앱** | `mobile/lib/student-journey.ts`에 **`FIRST_LESSON_PENDING` 없음** — 매칭 후에도 `MATCHING`/`ACTIVE` 혼동 가능 |
| **스키마로 가능?** | **예** |
| **사용 테이블·필드** | `Lesson` (studentId, teacherId, subject, startAt, durationMin, joinUrl, status), `TeacherStudent.startDate` |
| **빠진 필드 (선택)** | `Lesson`에 `lessonType` (FIRST/REGULAR), `TeacherStudent.firstLessonAt` (중복 표현 정리용) — **필수는 아님** |
| **빠진 것 (코드·UX)** | 학생/앱 측 첫 수업 확인·일정 변경 UI; `joinUrl` 화상 연동; 푸시 타입 `FIRST_LESSON_SET`이 `PUSH_NOTIFICATION_TYPES`에 **미포함** (`src/lib/notifications.ts`) |

### 22.4 숙제 자동 분배

| 항목 | 내용 |
|------|------|
| **의도** | 첫 수업·매칭 후 N일치 과제가 자동으로 학습 플랜에 깔린다 |
| **현재 구현** | **수동 API** — `POST /api/teacher/students/[id]/homework-distribution` (`startDate`, `days` 4\|7, `tasks[]`, `repeatWeeks`) → `StudyPlan` + `StudyTask` 일괄 생성. UI: `TeacherStudentPlanTab.tsx` |
| **자동 트리거** | **NOT FOUND** — 매칭 완료·첫 수업 설정 후 자동 호출 없음 |
| **스키마로 가능?** | **저장은 예** / **규칙·템플릿 저장은 아니오** |
| **사용 테이블·필드** | `StudyPlan.date`, `StudyTask` (title, isDone, order), `StudyPlan.comment` (선생님 코멘트) |
| **빠진 필드 (권장)** | `HomeworkTemplate` (teacherId, subject, tasks JSON, defaultDays) 또는 `Student.homeworkProfile`; `StudyPlan.source` (`MANUAL`/`AUTO_DISTRIBUTION`) |
| **빠진 것 (코드)** | 매칭·첫 수업 완료 시 hook/cron; 앱 학습 탭은 API로 **조회만** (자동 생성 없음); AI 기반 과제 생성 없음 |

### 22.5 플로우 의존 관계 (요약)

```
상담 WAITING ──(수동)──► manager ASSIGNED ──(수동)──► consultation COMPLETED / journey MATCHING
                                                              │
                    ┌─────────────────────────────────────────┘
                    ▼
         manager POST /matches ──► TeacherStudent (즉시 active, 수락 없음)
                    │
                    ▼
         teacher first-lesson API ──► Lesson + FIRST_LESSON_PENDING → ACTIVE (웹만)
                    │
                    ▼
         teacher homework-distribution API ──► StudyPlan[] (수동, 자동 아님)

결제 complete ──► assignChiefManager + Subscription ACTIVE  (PG 검증 없음 — §19)
```

---

## 23. 장기 로드맵

> 작성: 2026-07-03. 각 Phase는 순서대로 진행하되, 완료 기준을 만족해야 다음 Phase로 넘어간다.

### Phase 0 — 아키텍처 부채 해소 (✅ 2026-07-03 완료)

- **목표**: docs/IMPLEMENTATION_PLAN_2026-07.md의 P0 항목 + 재검사에서 나온 보안·버그 수정
- **완료 기준**: ✅ 결제 서버 검증(Toss confirm) / ✅ 매칭 상태머신(PENDING_STUDENT_ACCEPT→ACTIVE, 학생 수락) / ✅ Toss 웹훅 / ✅ 방치 매칭 알림 / ✅ 소프트삭제 스키마 / ✅ 계정삭제 API / ✅ `tsc --noEmit`·`next lint` 무오류
- **잔여**: 마이그레이션 `20260703014634_soft_delete_and_match_reason` **프로덕션 적용 대기** (§25 참조)

### Phase 1 — 출시 차단 요소 해소 (법·결제 신뢰)

- **목표**: 실 고객에게 돈을 받아도 법적·신뢰 리스크가 없는 상태
- **범위**: 법적 문서 3종(이용약관·개인정보처리방침·환불정책) 실제 텍스트 (BR-7, 현재 "준비 중" placeholder), 미성년자 결제 시 법정대리인 동의 수집 (BR-8/9), 푸터 사업자 정보 실제 값 (MK-1), Toss 대시보드 웹훅 URL 등록, 마이그레이션 적용, 체크아웃 페이지에 환불 보장 문구 재노출, §24.3 확정 항목 **#1 #8(1단계) #13 #30**
- **완료 기준**: (1) 법적 페이지 placeholder 0개 (2) 실 결제 1건이 "결제→웹훅→구독 생성→치프 배정" E2E로 검증됨 (3) 14세 미만 가입 시 보호자 동의 필드 필수화 (4) 푸터에 실제 상호/대표/사업자등록번호/통신판매업신고번호 표기

### Phase 2 — 핵심 루프 완성 (수업 운영, 북극성 7~9번)

- **목표**: 매칭 이후 "수업이 실제로 굴러가는" 상태를 시스템이 추적
- **범위**: Lesson COMPLETED 전이 자동화 (EC-7 — 정산·리포트·환불의 근간), 숙제 자동 분배 트리거 (첫 수업 설정 시 자동 StudyPlan 생성, §22.4), `HomeworkTemplate` 모델로 주간 반복 패턴 재사용, 수업 취소/보강/이월 정책 구현 (BR-20), §24.3 확정 항목 **#6 #14 #15 #16+#28 #21 #23 #25 #27**
- **완료 기준**: (1) 선생이 4일/7일치 숙제를 1회 입력하면 가중치 분배로 자동 생성 (2) 지난 수업이 COMPLETED로 자동/반자동 전이 (3) 템플릿 재사용으로 2회차부터 재입력 불필요

### Phase 3 — 리텐션·수익 구조

- **목표**: 1회 결제로 끝나지 않는 매출 구조
- **범위**: 구독 만료 D-5/D-1 알림 + 재결제 유도 (BR-1), Toss 빌링키 자동결제 (미결 질문 Q2), 월간 리포트 AI 요약 고도화 (FI-1), 첫 수업 D+7 만족도 체크인, 상담 이력화(`ConsultationBooking.studentId` @unique 해제 — findUnique 사용처 전면 리팩토링 필요), Prisma enum 전환 (§19 문제 5), §24.3 확정 항목 **#2 #10 #17 #18 #19 #22 #8(2단계)**
- **완료 기준**: (1) 만료 임박 알림 자동 발송 (2) 재결제 전환율이 어드민에서 측정 가능 (3) 상담 재신청이 이력으로 쌓임

### Phase 4 — 확장·운영 성숙

- **목표**: 매니저 1인 병목 해소 + 앱 스토어 출시
- **범위**: 매니저 성과 대시보드 (매칭 수락률·상담→결제 전환율 — matchStatus/respondedAt 데이터는 이미 축적 중), 선생 정산 모델 (Q3), 모바일 앱 스토어 제출 (계정삭제 API 완료로 5.1.1(v) 충족, 모바일 journey enum에 MATCH_PENDING_ACCEPT 반영 필요), 관리자 감사로그 (BR-15), Supabase RLS (BR-14), §24.3 확정 항목 **#3 #29(보류 해제 시)**
- **완료 기준**: (1) 앱 심사 통과 (2) 매니저별 지표 대시보드 가동 (3) 치프 외 매니저로 배정 분산 가능

### 미결 질문 (사용자 결정 필요)

| # | 질문 | 막히는 Phase |
|---|------|------|
| Q1 | 법적 문서 3종의 실제 텍스트는 누가 작성하는가? (변호사 검토 여부) | Phase 1 |
| Q2 | 재결제 방식: Toss 빌링키 자동결제 vs 수동 재결제 링크? | Phase 3 |
| Q3 | 선생 정산 구조(월급제/수수료율)가 정해졌는가? | Phase 2~4 |
| Q4 | 푸터에 넣을 실제 사업자 정보(상호·사업자번호·통신판매업신고)가 확보됐는가? | Phase 1 |
| Q5 | 프로덕션 DB(Supabase)에 대기 중인 마이그레이션을 언제 적용할지? (적용 전까지 deletedAt/matchReason 코드가 프로덕션에서 오류 가능 — 배포 전 필수) | Phase 1 |
| Q6 | 서비스 지역(서울/분당 등)을 사이트에 명시할 것인가? (MK-3) | Phase 1 |

---

## 24. 사업/마케팅 개선 포인트

> 2026-07-03 분석. docs/BUSINESS_AND_MARKETING_REVIEW.md (BR-1~6, MK-1~8)와 중복되지 않는 신규 포인트 위주. 기존 항목은 해당 문서 참조.

### 24.1 사업 리스크 (신규 식별)

1. **중개 우회(디스인터미디에이션)** — 이 업종 최대 이탈 지점. 첫 매칭 후 학생·선생이 직거래로 전환하면 재결제가 사라진다. 대응: (a) 숙제 자동 분배·월간 리포트·질문답변을 플랫폼 안에 잠금(가치 락인 — Phase 2가 곧 리텐션 장치) (b) 선생 계약서에 직거래 금지 조항 (c) 수업 완료 추적(EC-7)으로 "플랫폼 밖 수업" 탐지 근거 확보.
2. **선생 공급 풀 관리 부재** — 수요가 몰리면 매칭 SLA가 무너진다. 과목×지역별 가용 선생 수를 어드민에서 볼 수 없고, 선생 온보딩 파이프라인(모집→검증→활성)이 시스템 밖에 있다. 매칭 수락률(respondedAt 데이터)로 선생별 반응성도 측정 가능한데 미사용.
3. **첫 4주 경험이 재결제를 결정** — 첫 수업 후 만족도 체크인(D+7)이 없어 불만이 재결제 거부 시점에야 드러난다. 조기 신호 수집 → 매니저 개입 루프가 필요 (Phase 3).
4. **매니저 성과가 측정 불가** — 상담→결제 전환율, 매칭 수락률, 응답 시간의 원천 데이터는 이미 쌓이는데 지표화가 안 됨. 매니저 증원 시 관리 불가능 (Phase 4).
5. **환불·중도해지 정산 로직 부재** — BR-4/BR-20의 하위 문제. "몇 회 수업 후 해지 시 얼마 환불"을 계산하려면 Lesson COMPLETED 카운트가 선행 조건. 정책(문서)과 정산(코드) 둘 다 없음.

### 24.2 홈페이지 전환율 개선 (2026-07-03 실사이트 감사)

> 기준: https://tutormatch-web.vercel.app 실제 fetch 감사. 홈·/pricing의 소셜프루프와 가격 노출은 양호. 아래는 구조적 누락.

| # | 페이지 | 누락 | 이탈 시나리오 | 조치 |
|---|--------|------|--------------|------|
| H1 | /refund | "준비 중" placeholder | 홈의 "첫 수업 100% 환불 보장"을 확인하러 온 사용자가 빈 페이지를 보고 신뢰 상실 — 결제 직전 최대 이탈점 | 실제 환불 규정 게시 (Q1) |
| H2 | /terms, /privacy | "준비 중" placeholder | 결제 전 실사하는 학부모가 약관·개인정보 처리를 확인 불가. 전상법·개인정보보호법 위반 소지 | Phase 1 법적 문서 |
| H3 | /checkout | 환불 보장 문구 미재노출 + "결제 수단 불러오는 중…" 상태 노출 | 결제 확정 순간에 신뢰 신호가 없고 결제수단이 안 보이면 즉시 이탈 | 환불 배지 재노출, 위젯 로딩 UX 개선 |
| H4 | /login | 회원가입 CTA 부재 (무료 상담 유도만 존재) | 바로 가입하려는 사용자가 경로를 못 찾음. 가입=상담신청인지 불명확 | 가입 경로 명시 또는 "상담 신청이 곧 가입" 안내 |
| H5 | 전체 | 카카오톡 채널 부재 (MK-7 재확인) | 40대 학부모의 기본 문의 채널이 없어 저관여 접점 상실 | 카카오 채널 개설 + 플로팅 버튼 |

미검증(로그인 벽): 결제 완료 페이지의 환불 문구, 실제 결제수단 목록. 다음 감사 시 테스트 계정으로 확인할 것.

### 24.3 개선 확정 항목 21선 + 구현 계획 (2026-07-03 오너 확정)

> 2·3차 분석 30개 중 오너가 21개 채택 (**원 번호 유지** — #1~10은 구 24.3, #11~30은 구 24.4). 미채택 #4,5,7,9,11,12,20,24,26은 제거됨. 각 항목: 배치 Phase → 코드 작업 / 비코드 작업.

#### Phase 1 배치 (출시 전)

- **#1 가격 앵커링** — 회당 단가만 보여 체크아웃에서 월 총액 첫 체감.
  - 코드: `pricing-plans.ts`에 `PLAN_INCLUDES` 상수(전담 매니저·월간 리포트·숙제 관리·질문답변) → 요금 카드에 월 총액 병기 + 포함 가치 리스트, 체크아웃 요약에도 동일 노출.
  - 비코드: 포함 가치 카피 확정.
- **#8 환불 보장 남용 방어** — ⚠️ **오너 지시: 홈/마케팅에 노출 금지. 시스템(내부 추적)과 약관에만 반영.**
  - 코드(1단계): `/refund` 정책에 "첫 수업 환불 보장은 학생 1인 최초 가입 1회 한정, 재가입 시 미적용" 조항 추가 (마케팅 카피는 불변).
  - 코드(2단계, Phase 3): 환불 처리 시 `PaymentCompletion.status=REFUNDED` 기록 → 어드민 학생 상세에 "환불 이력" 배지 + 월별 환불율 지표.
  - 비코드: 환불율 경고 임계값 결정(권장: 마진 계산상 15%).
- **#13 네이버 생태계** —
  - 코드: 네이버 서치어드바이저 verification 메타 태그, `sitemap.xml`/`robots.txt` 라우트, OG 태그 정비(제목·설명·이미지).
  - 비코드: 네이버 블로그·플레이스 개설, 지역 키워드("분당 수학 과외" 등) 콘텐츠 주 1회, 서치어드바이저 사이트 등록(사용자).
- **#30 백업/BCP** —
  - 코드: 없음. (선택: 주간 `pg_dump` GitHub Actions 아카이브 — Supabase 무료 백업 미흡 시)
  - 비코드(사용자): Supabase 대시보드에서 백업 플랜/PITR 확인·활성화, 복구 절차 1페이지 문서(RTO/RPO 목표 포함).

#### Phase 2 배치 (핵심 루프)

- **#6 상담 일정 자동화** —
  - 코드: `run-alert-checks.ts`에 상담 D-1·당일 아침 SMS 리마인더(학생+매니저), `ConsultationBooking.status`에 `NO_SHOW` 추가 + 매니저 포털 노쇼 처리 버튼 → 재예약 유도 문자 자동 발송.
  - 비코드: 노쇼 대응 매니저 지침(2회 노쇼 시 처리 등).
- **#14 카카오 로그인** —
  - 코드: next-auth `KakaoProvider` 추가, `User`에 `provider`/`providerId` 필드(마이그레이션), 기존 이메일 계정 연결 플로우, 소셜 가입 시 전화번호 추가 수집 단계.
  - 비코드(선행): 카카오 개발자 앱 등록 — 사업자등록번호 필요 가능성 있어 Q4 이후.
- **#15 미결제 리드 너처링** —
  - 코드: `run-alert-checks.ts`에 "상담 COMPLETED + 3일 경과 + 구독 없음" 체크 → 팔로업 SMS 1회(발송 이력 기록, 재발송 방지), 수신 거부 플래그.
  - 비코드: 팔로업 메시지 카피(진단 요약 + 상담 매니저 직통 안내).
- **#16 상담 표준화 + #28 학습 목표 합의서** (통합 구현) —
  - 코드: `ConsultationReport` 모델(bookingId, goals JSON[정량1+정성1], subjectLevels JSON, recommendedPlan, note) + 매니저 포털 구조화 입력 폼 → 학생 대시보드 "이번 달 목표" 카드 노출 → `generate-monthly-report.ts`가 목표 대비 문구 인용.
  - 비코드: 상담 스크립트 문서(도입-진단-목표합의-플랜제안 4단계), 매니저 온보딩 자료.
- **#21 현금영수증** —
  - 코드: Toss confirm 응답의 `cashReceipt` 필드 저장(`PaymentCompletion`에 컬럼 추가) + 결제 내역 화면 표시. 카드 결제는 카드전표로 갈음됨을 FAQ에 명시.
  - 비코드: Toss 대시보드에서 현금영수증 자동발급 설정(가상계좌·계좌이체 열 경우).
- **#23 결제→첫 수업 SLA** —
  - 코드: `run-alert-checks.ts`에 "구독 ACTIVE + 7일 경과 + 첫 Lesson 없음" → 치프 에스컬레이션 알림, 어드민 지표에 결제일→첫수업일 평균 리드타임.
  - 비코드: SLA 목표 확정(권장 7일), 초과 시 보상 여부 결정.
- **#25 선생 교체 정책** —
  - 코드: 학생 대시보드/앱 "선생님 교체 상담 요청" 버튼 → 매니저 알림 → 매니저가 기존 매칭 비활성 + 신규 `PENDING_STUDENT_ACCEPT` 생성(기존 상태머신 재사용, EC-1 해소 겸용).
  - 비코드: 교체 정책 문구(횟수 제한 여부 — 무제한 보장 여부는 오너 결정) 약관·FAQ 반영, 매니저 지침.
- **#27 선생 노쇼 보상** —
  - 코드: `Lesson.status`에 `CANCELLED_BY_TEACHER` 구분, 취소 시 보강 Lesson 자동 생성 플로우, 어드민 선생 상세에 노쇼 카운트.
  - 비코드: 보상 규정(보강 + 수업 1회 추가 권장) 약관·선생 계약서 반영.

#### Phase 3 배치 (리텐션·수익)

- **#2 LTV/코호트 지표** —
  - 코드: `GET /api/admin/metrics/cohorts` — `PaymentCompletion(createdAt, studentId)` 기반 월별 최초결제 코호트 × 익월 재결제 매트릭스 + 어드민 `/admin/metrics` 페이지.
  - 비코드: 목표 리텐션 정의(권장: 2회차 재결제율 60%), 월간 리뷰 루틴.
- **#10 매니저 케어 가시화** —
  - 코드: `ManagerCareLog` 모델(managerId, studentId, type[상담/개입/점검], note, createdAt) + 매니저 포털 입력 UI + 학생/학부모 대시보드 "매니저 활동" 타임라인 + 월간 리포트 포함.
  - 비코드: 케어 로그 작성 기준(학생당 주 1회 이상) 매니저 지침.
- **#17 번들 할인** —
  - 코드: `pricing-plans.ts`에 할인 규칙 함수(2과목 할인율, 형제 코드), `planIdFromAmount` 역매핑 갱신 — ⚠️ **웹훅 금액 검증(`/api/webhooks/toss`)과 반드시 정합 유지**, 체크아웃 UI 반영.
  - 비코드(선행): 마진 계산 후 할인율 확정(BR-5 의존).
- **#18 구독 일시정지** — ⚠️ **오너 지시: 학생 셀프서비스 아님. "매니저에게 문의" 방식 + 매니저 지침 문서화.**
  - 코드: `Subscription.status`에 `PAUSED` + 매니저/어드민 전용 pause API(사유·기간 기록, 만료일 자동 연장), 학생 화면엔 "일시정지는 매니저에게 문의" 안내만.
  - 비코드: **매니저 pause 지침 문서**(허용 기준: 최대 1개월/연 2회 권장, 승인 절차, 기록 방법).
- **#19 결제 실패 dunning** (빌링키 도입과 동시) —
  - 코드: 자동결제 실패 시 `Subscription.status=PAST_DUE`, D+1/D+3 재시도, D+3 알림, D+7 서비스 정지 + 복구 플로우.
  - 비코드: 유예 기간 정책 확정.
- **#22 알림톡 전환** —
  - 코드: `sms.ts`에 Solapi 알림톡(kakaoOptions) 우선 발송 + SMS 폴백 함수, 템플릿 코드 상수 관리.
  - 비코드(선행): 카카오 비즈니스 채널 개설(H5 겸용) + 알림톡 템플릿 심사 등록.

#### Phase 4 배치 / 보류

- **#3 선생 리텐션 인센티브** — Q3(정산 구조) 결정 선행.
  - 코드: 정산 모델 구축 시 `Teacher` 활동 통계(수업 수·유지율)·등급 필드.
  - 비코드: 선생 계약서에 등급·인센티브 조항, 분기 간담회.
- **#29 웹/앱 채널 역할** — 🟡 **보류 (오너 방향, 2026-07-03)**: 마케팅+전체 기능 = 웹, 결제·학습 = 앱에도 이중 구현이 목표. 학부모 전용 앱 여부 고민 중. 결정 시점: Phase 4 앱 심사 준비 전. 그 전까지 신규 기능은 웹 우선 + API는 모바일 재사용 가능하게 설계.

---

## 25. 현재 작업 상태 (2026-07-03 세션 종료 시점)

> 다음 AI를 위한 스냅샷. §19(알려진 이슈)·§22(미구현 플로우)의 일부 서술은 이 세션으로 해소되어 낡았다 — 이 섹션이 우선한다.

### 25.1 오늘 완료한 작업

- **§19/§22에서 해소됨**: 결제 PG 검증 없음 → Toss confirm 서버 검증 (`src/lib/toss-payments.ts`), 매칭 즉시 active → `matchStatus: PENDING_STUDENT_ACCEPT` + 학생 수락 (`/api/matches/[matchId]/accept`), journey drift → 서버 단일 소스 + `MATCH_PENDING_ACCEPT` 단계 추가
- **보안**: `cookies.txt`/`admin_cookies.txt` 삭제, `.gitignore` 보강
- **버그**: CHIEF_MANAGER 누락 role 체크 6곳 수정 (`useConsultationCta.ts`, `teacher-portal/page.tsx`, `LoginForm.tsx`, `TeacherPortalLoginClient.tsx`, `ConcordSiteHeader.tsx`)
- **가드**: EC-8 (COMPLETED/CANCELLED 상담 덮어쓰기 방지, `student-enrollment.ts`), EC-7 (과거·완료 수업 수정 409, `first-lesson/route.ts`)
- **신규**: Toss 웹훅 `POST /api/webhooks/toss` (멱등, Toss API 재검증, `planIdFromAmount`로 플랜 도출), 방치 매칭 알림 `STALE_MATCH_ACCEPTANCE` (`run-alert-checks.ts`, 24h, 매니저+학생, 중복 방지), 계정삭제 (`src/lib/account-deletion.ts`, `DELETE /api/mobile/me`, `POST /api/account/delete`, 탈퇴계정 로그인 차단 `auth.ts`), matchReason 입력(매니저 매칭 폼)→표시(학생 수락 카드, 모바일 `why` 필드)
- **스키마**: `User.deletedAt`, `Student.deletedAt`, `TeacherStudent.matchReason`, PaymentCompletion/Subscription `onDelete: Cascade→Restrict`
- **검증**: `npx tsc --noEmit` ✅, `npm run lint` ✅

### 25.1b 같은 날 2차 세션 추가 완료분 (2026-07-03)

- ✅ 마이그레이션 `20260703014634` **프로덕션(Supabase) 적용 완료** (Q5 해소 — 배포 블로커 없음)
- ✅ 법적 문서 3종 초안 완성: `/terms`(14개 조항, 직거래 금지·미성년 동의 포함), `/privacy`(12개 조항, 위탁: Toss·Supabase·Vercel·Solapi), `/refund`(첫 수업 100% 환불 + 중도 해지 정산 예시) — placeholder `[기재 예정]`은 대표자명·사업자등록번호·통신판매업신고·주소·시행일뿐. **배포 전 변호사 검토 예정** (사용자가 직접 진행)
- ✅ 푸터 더미 사업자 정보(홍길동/123-45-67890/가짜 주소) 제거, 상호 "콘코드"만 표기 (CMS `company_*` 키에 저장값 없음 확인)
- ✅ 체크아웃 결제 버튼 위에 환불 보장 문구 + /refund 링크 재노출 (H3 해소)
- ✅ §24.3 사업 지적점 10선 추가
- ✅ (3차) 개선 항목 30개 중 오너가 21개 확정 → §24.3을 항목별 코드/비코드 구현 계획으로 재구성, §23 Phase 범위에 배치
- ✅ (3차) Phase 1 코드 항목 구현: #1 가격 앵커링(`PLAN_INCLUDES` — 요금 카드·체크아웃에 포함 가치 노출; 월 총액 "원/월" 표기는 기존에 이미 존재), #8 1단계(환불 보장 1인 1회 한정 조항 — /refund에만, 마케팅 비노출), #13 SEO(루트 메타데이터·OG·네이버 verification env, robots/sitemap은 기존 존재 확인)

### 25.2 다음 세션에서 이어할 작업 (우선순위순)

1. 법적 문서 변호사 검토 결과 반영 (사용자 담당) + 사업자등록 후 `[기재 예정]` placeholder 채우기 (terms/privacy/refund + 푸터 CMS `company_*` 키)
2. Toss 대시보드에 웹훅 URL 등록: `https://tutormatch-web.vercel.app/api/webhooks/toss` (사용자 담당, 코드 준비 완료)
3. Phase 1 잔여: 14세 미만 가입 시 보호자 동의 필드 수집 (BR-8 — 약관에는 명시됐으나 가입 폼 미구현)
4. 모바일 `mobile/lib/student-journey.ts` enum에 `MATCH_PENDING_ACCEPT` 추가 (웹과 drift 방지)
5. 이월 과제: 상담 이력화(@unique 해제 리팩토링), Prisma enum 전환, QnA 테이블 통합(P2), Phase 2(수업 완료 추적·숙제 자동 분배)

### 25.3 열린 결정사항

§23 미결 질문 중 Q1(변호사 검토 — 사용자 진행 중), Q4(사업자 정보 — 미확보, 상호만 "콘코드" 확정), Q2·Q3·Q6 미결. Q5는 해소됨.

---

*문서가 오래되면 `git log -20`, `prisma/schema.prisma`, `src/app/api/**/route.ts` 트리를 먼저 다시 확인하세요.*
