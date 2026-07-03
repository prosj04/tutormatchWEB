# Concord Private Tutoring — 기술 아키텍처 개요

> 대상: 신규 합류 엔지니어  
> 기준: 저장소 실측 (2026-07-04)  
> 리서치 원칙: 파일 실측만 반영. 확인하지 못한 항목은 `[미확인]`.

---

## 1. 스택 요약

`package.json` (2026-07-04) 실측:

| 계층 | 라이브러리 | 버전 |
|---|---|---|
| 프레임워크 | `next` | 14.2.35 (App Router) |
| 언어 | `typescript` | ^5 |
| 인증 | `next-auth` | ^5.0.0-beta.31 (JWT Credentials) |
| ORM | `@prisma/client`, `prisma` | 5.22.0 |
| DB | Supabase PostgreSQL (pooler 6543 + direct 5432) | — |
| 스토리지 | `@supabase/supabase-js` | ^2.105.4 |
| 결제 | `@tosspayments/payment-widget-sdk` | ^0.12.1 |
| AI | `@anthropic-ai/sdk` | ^0.96.0 |
| 스타일 | `tailwindcss` | ^3.4.1 |
| 모션·DnD | `framer-motion` 12.38, `@dnd-kit/*` | — |
| 문서 생성 | `docx` | ^9.7.0 |
| 해시 | `bcryptjs` | ^3.0.3 |

빌드 스크립트: `next build` 앞단에 `prisma migrate deploy`가 붙어 있어 배포 시 DB 마이그레이션이 강제됨 (`package.json` `build`).

---

## 2. 디렉토리 구조

### 루트

```
premium-tutoring/
├─ auth.ts                 # NextAuth v5 엔트리(핸들러·auth 함수)
├─ middleware.ts           # 역할별 라우트 가드
├─ next.config.mjs
├─ vercel.json             # icn1 리전, cron 2건
├─ prisma/
│  ├─ schema.prisma        # 608 줄, 모델 30여 개
│  └─ migrations/
├─ scripts/                # check-env, setup-storage, seed-sample
├─ src/
│  ├─ app/                 # App Router
│  ├─ components/
│  └─ lib/                 # 도메인 로직·헬퍼 (약 80개)
├─ mobile/                 # React Native (Expo) 앱 워크스페이스
└─ docs/                   # 제품·핸드오프 문서
```

### `src/app` 라우트 그룹

| 경로 | 목적 |
|---|---|
| `(home)/` | 마케팅 홈 (라우트 그룹으로 그룹핑, URL엔 미노출) |
| `login`, `register`, `checkout`, `success` | 공개 진입점 |
| `dashboard/` | 학생 포털 |
| `teacher-portal/` | 선생님·매니저 포털 (역할별 탭 분기) |
| `admin/` | 관리자 CMS·운영 콘솔 |
| `pricing`, `faq`, `tutors`, `reviews`, `terms`, `privacy`, `refund` | 공개 페이지 |
| `notifications`, `payments`, `questions` | 학생용 서브 페이지 |
| `api/` | 서버 라우트 (`route.ts` 110개) |
| `layout.tsx`, `robots.ts`, `sitemap.ts` | 전역 |

### `src/lib` 핵심 모듈 (요약 인덱스, 실측 80+ 파일 중 발췌)

| 파일 | 역할 |
|---|---|
| `prisma.ts` | Prisma 클라이언트 싱글턴 |
| `admin-auth.ts`, `student-auth.ts`, `teacher-auth.ts`, `manager-auth.ts`, `mobile-auth.ts`, `notification-auth.ts` | 라우트별 `requireXxx()` 가드 |
| `student-enrollment.ts` | 상담 신청·Chief 즉시 배정 로직 |
| `student-payment.ts` | Toss 결제 완료 후 구독·Chief 배정 (멱등) |
| `toss-payments.ts` | Toss confirm / fetch / 빌링키 발급·청구 |
| `manager-portal-data.ts` | 매니저 포털 서버 페처 |
| `manager-student-stats.ts`, `manager-stats.ts` | 매니저 KPI |
| `pricing-plans.ts`, `pricing-cms.ts`, `pricing-tier-preference.ts` | 요금제 |
| `qna.ts`, `ai-answer.ts` | 통합 QnA + Anthropic AI 답변 |
| `homework-distribution.ts` | 주간 숙제 자동 분배 |
| `landing-data.ts`, `cms.ts`, `cms-seed.ts`, `cms-page-defaults.ts`, `site-content.ts` | CMS 콘텐츠 조회·시딩 |
| `public-cms-cache.ts`, `public-teachers-cache.ts` | `unstable_cache` 태그 관리 |
| `run-alert-checks.ts` | 크론 알림·모니터링 배치 |
| `generate-monthly-report.ts` | 월간 리포트 생성 |
| `analytics.ts`, `analytics-events.ts`, `analytics-funnel.ts`, `analytics-journey.ts` | 이벤트 로깅·퍼널 |
| `supabase-admin.ts`, `supabase-client.ts` | Supabase Storage 클라이언트 |
| `audit-log.ts` | `AuditLog` 기록 헬퍼 (BR-15 요건) |
| `sms.ts`, `expo-push.ts`, `notifications.ts` | 알림 채널 |
| `visit-consultation.ts` | 방문 상담 시간대 파싱 |
| `chief-manager.ts`, `default-manager.ts` | Chief 매니저 조회·폴백 |
| `consultation-report.ts`, `consultation-booking-dto.ts` | 상담 리포트·DTO |

---

## 3. 인증·인가 흐름

### 3.1 NextAuth v5 설정 (`auth.ts`)

- `basePath: "/api/auth"` — `NEXTAUTH_URL`에 경로 포함 금지 (basePath 오염 시 전원 로그인 실패).
- `session.strategy: "jwt"` — DB 세션 미사용.
- Secret: `AUTH_SECRET` 또는 `NEXTAUTH_SECRET` (앞의 값 우선).
- Provider: `CredentialsProvider` 하나만. `identifier`(이메일 또는 전화번호) + `password`.
- 전화번호 로그인: `phone-login.ts`의 `normalizePhoneDigits`로 정규화 후, 학생·선생님 합성 이메일(`*@concord.local` 계열) 또는 relation `phone` 컬럼과 매칭.
- 소프트 삭제 가드: `user.deletedAt`이 있으면 authorize에서 null 반환.
- `jwt` 콜백에서 `id`, `role`, `name`을 토큰에 저장 → `session` 콜백에서 `session.user`에 주입.
- **Prisma select 최소화**: `include` 대신 명시적 `select`. 신규 컬럼이 마이그레이션 이전이면 P2022로 모든 로그인이 죽는 사고를 방지하기 위한 의도적 설계.

### 3.2 미들웨어 라우트 가드 (`middleware.ts`)

`matcher`가 `/api/auth`·정적 자산을 제외한 모든 경로에 적용됨.

- `/admin/*` → `ADMIN`만 통과, 이외는 `/login`으로 리다이렉트.
- 로그인한 `STUDENT`:
  - 허용: `isMarketingPublicPath(pathname)` OR `/dashboard/*` OR `/api/*`
  - 그 외는 `/dashboard`로 리다이렉트.
- 로그인한 `TEACHER` 또는 `MANAGER`:
  - 허용: 마케팅 공개 경로 OR `/teacher-portal/*` OR `/api/*`
  - 그 외는 `/teacher-portal/dashboard`로 리다이렉트.
- `ADMIN`은 자유롭게 통과.
- 비로그인: `/dashboard`, `/teacher-portal/dashboard` 접근 시 각각 `/login`·`/teacher-portal`로 리다이렉트.

주의: 미들웨어는 `CHIEF_MANAGER`를 명시적으로 분기하지 않음. 미들웨어의 `role === "MANAGER"` 매칭에 `CHIEF_MANAGER`는 걸리지 않아, 현재 코드 경로에서는 `else`로 빠져 아무 리다이렉트도 걸리지 않을 가능성이 있음 (마지막 `!session` 블록에서만 걸림). **`CHIEF_MANAGER` 세션 유저가 어떤 경로로 라우팅되는지 [미확인]** — 실제 UI 동작을 통해 검증 필요.

### 3.3 공개 경로 판정 (`src/lib/public-routes.ts`)

`isMarketingPublicPath()`는 다음 prefix를 정확히 매치하거나 하위 경로로 허용:

`/`, `/pricing`, `/tutors`, `/faq`, `/reviews`, `/login`, `/register`, `/checkout`, `/success`

### 3.4 API 라우트 가드 헬퍼

역할별 헬퍼가 있고 `route.ts`에서 `if ("error" in r) return r.error` 패턴으로 호출:

| 헬퍼 | 통과 역할 | 부가 검사 |
|---|---|---|
| `requireStudent` | `STUDENT` | `Student` 레코드 존재 확인 (`userId` unique) |
| `requireTeacher` | `TEACHER` / `MANAGER` / `CHIEF_MANAGER` | `Teacher` 레코드 존재 확인 |
| `requireManager` | `MANAGER` / `CHIEF_MANAGER` | 캐시된 `Teacher` 조회 |
| `requireAdmin` | `ADMIN` / `CHIEF_MANAGER` | — |
| `requireNotificationUser` | 로그인 유저 전체 (역할 미검사) | — |
| `requireMobileStudent` | Bearer 토큰 `role=STUDENT` | HMAC-SHA256 JWT 검증 후 `Student` 조회 |

특이 사항:
- `requireAdmin`이 `CHIEF_MANAGER`도 통과시킴 → `admin/*` 상당수를 Chief가 사용할 수 있음 (미들웨어는 `/admin` UI를 Chief에게 열지 않으나 API는 열림).
- `chief-manager/teacher-approval`·`manager/teacher-approval` 두 라우트는 `requireAdmin` 후 다시 `ADMIN` 또는 `CHIEF_MANAGER`만 통과시키는 이중 가드 (동일 코드 · 별도 위치).

### 3.5 모바일 인증

- `src/lib/mobile-auth.ts` — HMAC-SHA256 서명 커스텀 JWT (외부 라이브러리 없이 `crypto`).
- Access: 7일, Refresh: 60일.
- `Authorization: Bearer <token>`.
- Secret은 `AUTH_SECRET` / `NEXTAUTH_SECRET` 재사용.

---

## 4. DB 모델 관계도

`prisma/schema.prisma` 608줄, enum 6개 + 모델 27개 실측.

### 4.1 enum

- `UserRole`: `ADMIN`, `CHIEF_MANAGER`, `MANAGER`, `TEACHER`, `STUDENT`
- `ConsultationStatus`: `WAITING`, `ASSIGNED`, `COMPLETED`, `CANCELLED`
- `LessonStatus`: `SCHEDULED`, `COMPLETED`, `CANCELLED`
- `SubscriptionStatus`: `ACTIVE`, `PAST_DUE`, `PAUSED`, `CANCELLED`
- `MatchStatus`: `PENDING_STUDENT_ACCEPT`, `ACTIVE`, `CANCELLED`
- `PaymentStatus`: `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`

### 4.2 텍스트 관계도

```
User (role: UserRole, deletedAt?)
 ├─1:1─ Student ──1:1─ OnboardingSurvey
 │       ├─1:1─ BillingProfile (customerKey = "student-{studentId}")
 │       ├─1:N─ StudyPlan ──1:N─ StudyTask
 │       ├─1:N─ Question              (DEPRECATED — QuestionMessage로 통합)
 │       ├─1:N─ QuestionMessage (self-join: replyToId → parent)
 │       ├─1:N─ TeacherStudent ──N:1─ Teacher   (매칭 · MatchStatus)
 │       ├─1:N─ ConsultationBooking ──N:1─ Teacher(as manager)
 │       │       └─1:1─ ConsultationReport
 │       ├─1:N─ ManagerStudent ──N:1─ Teacher(as manager)
 │       ├─1:N─ ManagerCareLog ──N:1─ Teacher(as manager)
 │       ├─1:N─ Lesson ──N:1─ Teacher
 │       ├─1:N─ TutorReview ──N:1─ Teacher
 │       ├─1:N─ StudySession
 │       ├─1:N─ Subscription           (SubscriptionStatus)
 │       ├─1:N─ PaymentCompletion      (orderId unique · 멱등성)
 │       ├─1:N─ TokenWallet            (studentId+month unique)
 │       ├─1:N─ MonthlyReport          (studentId+month unique)
 │       └─1:N─ SatisfactionCheckin
 ├─1:1─ Teacher (approved, gender)
 │       ├─1:1─ TeacherProfile
 │       ├─1:N─ TutorAvailability
 │       ├─1:N─ HomeworkTemplate
 │       └─(N:M via TeacherStudent · ManagerStudent · ManagerCareLog · Lesson · TutorReview · QuestionMessage · ConsultationBooking)
 ├─1:N─ Notification
 └─1:N─ PushDevice          (expoPushToken unique)

무관계(독립):
 - SiteContent (section+key unique)
 - Testimonial · FaqItem  (CMS)
 - AnalyticsEvent (userId는 FK 없음, 플레인 문자열)
 - AuditLog (BR-15 요건 · FK 없음)
```

주요 유니크·인덱스 하이라이트:
- `TeacherStudent (teacherId, studentId)` 유니크 → 학생–선생 1쌍 매칭.
- `ConsultationBooking.studentId` — 학생당 다중 booking 허용 (2026-06 이후 히스토리 축적 정책).
- `TutorReview (teacherId, studentId)` — 학생당 한 강사 1리뷰.
- `PaymentCompletion.orderId` unique → Toss 재시도·중복 콜백 대비 멱등성 키.
- `BillingProfile.customerKey` unique.
- `TutorAvailability (teacherId, weekday, time)` — 슬롯 중복 방지.

**주의점**:
- `Student ⇄ Teacher` 매칭 활성 판단은 여전히 `isActive` 기준 (스키마 코멘트, 라인 139–141). `matchStatus`는 병기되지만 정책적 진리는 `isActive`.
- `Question` 모델은 DEPRECATED (`QuestionMessage`로 통합).
- 결제 이력 무결성을 위해 `Subscription`, `PaymentCompletion.student`는 `onDelete: Restrict`.

---

## 5. 캐싱 전략

Next.js `unstable_cache` 태그 기반 재검증.

### 5.1 태그 정의 (`src/lib/public-cms-cache.ts`)

- `PUBLIC_CMS_REVALIDATE_SECONDS = 300` — 5분.
- 태그:
  - `public-site-content` (`SITE_CONTENT_CACHE_TAG`)
  - `public-testimonials` (`TESTIMONIALS_CACHE_TAG`)
  - `public-faqs` (`FAQS_CACHE_TAG`)
  - `public-teachers` (`PUBLIC_TEACHERS_CACHE_TAG`)
- `revalidatePublicCms(...tags)` — 관리자 CMS 변경 후 호출. 인자 미지정 시 상단 3개(teachers 제외)를 일괄 재검증.
- Teachers 캐시는 별도 태그로 분리 — 강사 승인·프로필 변경 시에만 무효화.

### 5.2 캐시 사용처 [미확인 상세]

- `src/lib/cms.ts`, `landing-data.ts`, `public-teachers-cache.ts`가 `unstable_cache`로 감싸 tag를 부여함 (파일 존재 실측, 구현 상세 [미확인]).
- Admin CMS 라우트(`api/admin/cms/*`)와 `api/admin/teachers/*` 및 `api/teacher/profile/*`는 변경 시 `revalidatePublicCms(...)` 또는 `revalidateTag(PUBLIC_TEACHERS_CACHE_TAG)`를 호출 (import 실측).

---

## 6. 결제 흐름

### 6.1 웹 정기결제 (일회성 위젯)

1. `/checkout` — Toss Payments 위젯 SDK가 렌더링. `TOSS_CLIENT_KEY` 사용(`toss-client.ts`).
2. 사용자가 승인 → Toss가 `/success?paymentKey=&orderId=&amount=`로 리다이렉트.
3. `SuccessPaymentComplete` 클라이언트 컴포넌트가 `POST /api/payments/complete`로 전송.
4. `/api/payments/complete` (`src/app/api/payments/complete/route.ts`):
   - `auth()` → `role === "STUDENT"` 필수.
   - body 필수 필드: `orderId` (string), `paymentKey` (string), `amount` (number).
   - `planIdFromAmount(amount)`로 서버가 요금제를 재계산 — 클라이언트 값 미신뢰.
   - `completeStudentPayment()` 호출.
5. `completeStudentPayment()` (`src/lib/student-payment.ts`):
   - `PaymentCompletion.orderId`로 멱등성 조회.
   - COMPLETED 재호출: DB 상태만 반환.
   - REFUNDED: `PAYMENT_REFUNDED` throw.
   - PROCESSING: 이미 처리 중 → 상태만 조회 시도.
   - FAILED/신규: **`confirmTossPayment(paymentKey, orderId, amount)` 호출**(Toss `/v1/payments/confirm`) → PROCESSING로 upsert → `assignChiefManagerToStudent()` → `Subscription` upsert (ACTIVE, 1개월 periodEnd) → PaymentCompletion을 COMPLETED로 클로즈.
   - 예외 발생 시 `PaymentCompletion.status = FAILED`로 재설정.

### 6.2 빌링키 자동결제

- 등록: 위젯이 authKey를 `?authKey=&customerKey=`로 `/api/billing/register-success?authKey=&customerKey=`로 리다이렉트.
- `/api/billing/register-success`:
  - `STUDENT` 세션 필수.
  - `customerKey === "student-{studentId}"` 검증 (미스매치 시 실패).
  - `issueBillingKey(authKey, customerKey)` → Toss `/v1/billing/authorizations/issue`.
  - `BillingProfile` upsert (autoRenew=true 기본).
- `/api/billing/autorenew` — `POST { enabled: boolean }`로 학생이 토글. billingKey는 유지되므로 재등록 없이 재활성 가능.
- 결제: `src/lib/toss-payments.ts`의 `chargeBillingKey({ billingKey, customerKey, amount, orderId, orderName, customerName })` → Toss `/v1/billing/{billingKey}`. 실패 시 `TOSS_BILLING_CHARGE_FAILED:{code}`로 상위(dunning) 로직에 위임.
- **자동 청구를 실제로 트리거하는 스케줄러 진입점** [미확인] — `chargeBillingKey`를 호출하는 크론/API 위치를 검증하지 않았음.

### 6.3 웹훅

- `POST /api/webhooks/toss` — Toss `PAYMENT_STATUS_CHANGED` 수신.
- 서명 검증 없이 body에서 `paymentKey`를 뽑아 `fetchTossPayment`로 **Toss 서버에서 직접 재확인**한 뒤 처리 (본문 신뢰 최소화).
- 인식 못 하는 이벤트도 200 반환 (Toss 재시도 유도 방지).

### 6.4 모바일 결제

- `POST /api/mobile/payments/complete` — **미구현 501** 반환. 모바일은 웹 체크아웃 사용 유도.

---

## 7. 배포 · 인프라

### 7.1 Vercel (`vercel.json`)

- Region: `icn1` (서울)
- Cron:
  - `/api/cron/check-alerts` — 매일 00:00 UTC.
  - `/api/cron/generate-monthly-reports` — 매월 1일 01:00 UTC.
- 인증: `CRON_SECRET` 환경변수. `Authorization: Bearer $CRON_SECRET` 또는 Vercel의 `x-vercel-cron` 헤더 중 하나 필요 (`src/app/api/cron/check-alerts/route.ts` 등).

### 7.2 환경변수 (실측 소스: `.env.example` + `scripts/check-env.ts`)

`check-env.ts` `REQUIRED_KEYS` (배포 필수):

| 키 | 용도 |
|---|---|
| `DATABASE_URL` | Supabase pooler (6543, `pgbouncer=true&connection_limit=1`) — Prisma 런타임 |
| `DIRECT_URL` | Supabase direct (5432) — `prisma migrate deploy` 전용 |
| `AUTH_SECRET` | NextAuth JWT 서명 (fallback: `NEXTAUTH_SECRET`) |
| `NEXTAUTH_URL` | 스킴+호스트만 (경로 붙이면 basePath 오염) |
| `ADMIN_SETUP_SECRET` | 최초 관리자 부트스트랩·비밀번호 복구 |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 클라이언트 |
| `CRON_SECRET` | Vercel Cron 인증 |
| `ANTHROPIC_API_KEY` | Claude AI 답변 (`ai-answer.ts`) |

`.env.example`에서 추가로 언급된 키:

- `DEFAULT_MANAGER_EMAIL` (선택) — 즉시 등록 시 배정할 대표 매니저.
- `NEXTAUTH_SECRET` (`AUTH_SECRET` fallback).
- `AUTH_URL` (선택).
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용, `npm run setup-storage`에서 사용.
- `NEXT_PUBLIC_PORTAL_DESIGN` (선택) — `concord` / `legacy`.

핸드오프에 언급되나 `.env.example`에 없는 키(코드 grep으로 확인됨):

- `TOSS_SECRET_KEY` — `src/lib/toss-payments.ts`의 confirm/fetch/billing에서 사용. **production 미설정 시 confirm/fetch가 명시적으로 throw**.
- `CHIEF_MANAGER_EMAIL` — 결제·즉시등록 Chief 매니저 지정 (핸드오프 §14 언급, 파일 grep 필요) `[미확인]` (코드 상세 미검증).

### 7.3 Supabase Storage

- 버킷 이름은 `src/lib/supabase-client.ts`에 상수로 정의 (`TEACHER_DOCUMENT_BUCKET` 등).
- 사용처:
  - `POST /api/register/teacher/documents` — 이력서·인증서류 업로드.
  - `POST /api/admin/teachers/[id]/documents` — 관리자용.
  - `POST /api/teacher/profile/documents`, `POST /api/teacher/profile/photo` — 강사 본인 업로드.
  - `POST /api/admin/teachers/[id]/photo`, `POST /api/admin/cms/upload-image`, `POST /api/student/question-images` — 이미지 업로드.
- 서버 사이드는 `createSupabaseAdminClient()` (service role) 사용.

---

## 8. 알려진 기술 부채

### 8.1 결제 검증 (핸드오프 §19에서 지적된 P0 이슈)

핸드오프 §19는 `/api/payments/complete`가 `orderId`만 검사한다고 서술하나, **현행 코드는 갱신됨**:

- `route.ts:41–49`가 `paymentKey`, `amount`를 필수화하고 서버가 `planIdFromAmount(amount)`로 요금제를 결정.
- `student-payment.ts:107–109`에서 `confirmTossPayment(paymentKey, orderId, amount)`를 실제 호출 (프로덕션 secret 미설정 시 throw).
- 모바일 `/api/mobile/payments/complete`는 501로 명시적 차단됨.

**남은 우려**:
- **웹훅 서명 검증 부재** — `/api/webhooks/toss`는 Toss가 서명 헤더를 보내더라도 확인하지 않고, Toss 서버 재조회로만 신뢰를 확보 (본문 위조 방지에는 충분하나 재플레이·타이밍 공격 관점 `[미확인]`).
- `TOSS_SECRET_KEY` 미설정 시 dev/test 환경에서 confirm/fetch가 warning으로 통과 → 로컬 테스트 편의성 vs. 스테이징 실수 위험 트레이드오프.

### 8.2 Supabase RLS

- 앱 코드에 RLS 정책 정의 없음 (핸드오프 §13 명시).
- `SUPABASE_SERVICE_ROLE_KEY`를 서버에서 사용하므로 스토리지 접근은 서비스 롤로 우회됨. 프론트가 anon 키로 스토리지 직접 접근하는 경로가 있는지 `[미확인]`.

### 8.3 기타 (핸드오프 §19·§18에서 요약)

- **QnA 모델 이중화**: `Question`(DEPRECATED) vs `QuestionMessage`(현행). 웹 카드와 앱 flat 리스트가 같은 소스를 소비하지만 히스토리 잔재 정리 마이그레이션 대기.
- **Journey drift**: 웹 `FIRST_LESSON_PENDING` 단계가 앱 `student-journey.ts`에 미반영.
- **CMS 캐시 5분 지연**: `PUBLIC_CMS_REVALIDATE_SECONDS = 300`.
- **합성 이메일 `*@concord.local`**: 실제 메일 없음 → 이메일 채널 알림 불가.
- **`connection_limit=1`**: pooler URL 설정 → `Promise.all` 병렬 Prisma 쿼리 금지, `cache()`/순차 처리로 우회.
- **`admin/setup`·`admin/recover` non-production 완화**: `ADMIN_SETUP_SECRET`이 없을 때 dev에서 통과 허용 (production은 여전히 403/503).
- **`CHIEF_MANAGER` 미들웨어 경로 처리 [미확인]**: `middleware.ts`가 `MANAGER`만 명시적으로 매칭하고 있어 Chief의 UI 라우팅이 어떻게 되는지 검증 필요.
- **모바일 프론트엔드**: 백엔드 API는 완성, RN 프론트엔드 미시작 상태 (MEMORY.md 참조).

---

## 부록. 참고 문서

- 상세 온보딩: `CLAUDE_HANDOFF.md` (프로젝트 루트)
- 제품 상태: `docs/PRODUCT_DESIGN_TRACKER.md`
- API 표: `docs/internal/API_REFERENCE.md` (본 문서와 함께 유지)
