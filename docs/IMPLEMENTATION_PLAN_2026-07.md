# Concord 아키텍처 리뷰 & 미구현 핵심 플로우 구현 계획

> 작성: 2026-07-02 · 기준: `CLAUDE_HANDOFF.md` (§18–22) + `prisma/schema.prisma` 실측 교차 검증
> 대상 독자: Claude Code (이 문서의 스키마·API 명세를 그대로 구현 가능하도록 작성)
> 📁 **경로 이동 고지 (2026-07-12 문서 재편, 내용 추가만)**: 본문이 참조하는 `PRODUCT_DESIGN_TRACKER.md` → `30-제품·디자인.md` Part A로 병합됨 (원본은 `archive/`). 매핑: `docs/README.md`.

---

## 1. 현재 아키텍처 문제점

### 문제 1 — 결제 서버 검증 부재 (보안, 최우선)

- `POST /api/payments/complete`·`POST /api/mobile/payments/complete`는 **non-empty `orderId`만 검사**하고 `completeStudentPayment()`를 호출한다. Toss `paymentKey`/`amount`는 body로 받지만 서버에서 무시된다.
- `mobile/app/checkout.tsx`는 PG 없이 `orderId: mobile-${Date.now()}`, `amount: 740000` 하드코드를 전송한다.
- 결과: **결제 없이 구독 활성화 + Chief 매니저 배정이 가능**하다. `src/lib/toss-client.ts`에는 클라이언트 키만 있고 시크릿 키·confirm API 호출이 없다.

### 문제 2 — 매칭에 상태 머신이 없음 (북극성 플로우 위반)

- `TeacherStudent`는 `isActive: Boolean` 하나로 상태를 표현한다. 매니저가 `POST /api/manager/matches`를 호출하면 **즉시 active 매칭**이 생성되고 학생은 곧바로 `/dashboard`에 진입한다.
- CLAUDE.md 북극성 6번: *"Student must explicitly accept the assigned teacher with an acceptance button before classes are considered active"* — **학생 수락 단계가 표현 불가능**하다. (핸드오프 §22.2는 "선생님 수락"으로 기술했으나 북극성 기준은 **학생 수락**이다. 아래 설계는 북극성을 따른다.)
  > ⚠️ **정책 갱신 (2026-07-08, `CLAUDE.md` 현행)**: 수락 버튼은 **형식적 절차**이며 마케팅·UI에서 강조하지 않는다. 아래 상태 머신(`matchStatus`·거절·재배정)은 데드락 방지용 **기능**으로 유효 — 구현은 그대로 두되, "학생 수락"을 관문·마일스톤으로 **강조하는 서술은 폐기**한다.

### 문제 3 — QnA 데이터 모델 이원화

- 웹 대시보드는 `Question` (날짜 연결, aiAnswer/teacherAnswer 컬럼), 앱은 `QuestionMessage` (채팅 말풍선, sender/tokenCost). 같은 학생의 질문·답변 이력이 **두 테이블에 분산**되어 선생님이 웹에서 답한 내용이 앱에 안 보이고, 미답변 Cron(`run-alert-checks.ts`)은 `Question`만 본다.

### 문제 4 — Journey 로직이 웹/앱에 중복 구현되어 이미 drift 발생

- `src/lib/student-journey.ts`(웹)에는 `FIRST_LESSON_PENDING`이 있으나 `mobile/lib/student-journey.ts`(앱) enum에는 **없다**. 매칭 직후 앱은 `MATCHING`/`ACTIVE`를 혼동한다.
- 근본 원인: journey stage를 **클라이언트가 각자 계산**한다. 서버가 단일 소스로 stage를 내려주는 API가 없어, 단계를 추가할 때마다 두 곳을 고쳐야 한다 (매칭 수락 단계가 추가되면 세 번째 drift가 예정되어 있다).

### 문제 5 — 역할·상태가 전부 자유 문자열 (Prisma enum 미사용)

- `User.role`, `ConsultationBooking.status`, `Lesson.status`, `Subscription.status` 등이 모두 `String` + 주석이다. `User.role` 주석에는 런타임에서 실제 사용 중인 `CHIEF_MANAGER`가 **누락**되어 있다 (핸드오프 §19). 오타가 컴파일·마이그레이션 어디서도 잡히지 않고, `role === "MANAGER"` 분기가 CHIEF_MANAGER를 빠뜨리는 버그가 구조적으로 재발한다.

### 문제 6 — 상담이 학생당 1레코드 (이력 불가)

- `ConsultationBooking.studentId`가 `@unique`라 재상담·상담 이력·취소 후 재신청이 모델 차원에서 불가능하다. `CANCELLED`로 바꾸면 새 상담을 만들 수 없어 매니저가 ASSIGNED→WAITING 롤백으로 우회 중이다.

### 문제 7 — 알림 적시성: Cron 하루 1회에 의존

- "WAITING 2시간 경과" 알림이 `vercel.json` Cron(매일 00:00 UTC 1회)에 묶여 있어 실제로는 **최대 24시간 지연**된다. 유료 학생 응대 SLA와 맞지 않는다. (숙제 자동 분배·매칭 리마인더 등 이벤트 훅도 같은 제약을 받는다.)

### 문제 8 — 날짜 타입 혼재

- `StudyPlan.date`·`TeacherStudent.startDate`는 string `"YYYY-MM-DD"`, `Lesson.startAt`은 `DateTime`. "첫 수업일 = TeacherStudent.startDate 갱신 + Lesson.startAt 생성"처럼 **같은 사실이 두 타입으로 중복 저장**되어 불일치 가능성이 있다 (핸드오프 §22.3도 지적).

---

## 2. DB 스키마 변경사항 (§22 플로우 구현용)

> 마이그레이션 1개로 통합: `prisma/migrations/20260703000000_match_acceptance_homework_templates/`
> 아래 diff를 `prisma/schema.prisma`에 적용 후 `npx prisma migrate dev --name match_acceptance_homework_templates`

### 2.1 `TeacherStudent` — 매칭 수락 상태 머신 (§22.2)

```prisma
model TeacherStudent {
  id            String    @id @default(uuid())
  teacherId     String
  studentId     String
  teacher       Teacher   @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  student       Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subjects      String
  startDate     String
  isActive      Boolean   @default(true)
  // ▼ 추가 — 매칭 상태 머신
  matchStatus   String    @default("ACTIVE") // "PENDING_STUDENT_ACCEPT" | "ACTIVE" | "DECLINED" | "ENDED"
  proposedById  String?   // 제안한 매니저 Teacher.id
  respondedAt   DateTime? // 학생이 수락/거절한 시각
  declineReason String?
  createdAt     DateTime  @default(now())

  @@unique([teacherId, studentId])
  @@index([teacherId])
  @@index([studentId])
  @@index([isActive])
  @@index([studentId, matchStatus]) // ▼ 추가
}
```

- **기본값을 `"ACTIVE"`로** 두어 기존 행이 마이그레이션 후에도 그대로 유효 (backfill 불필요).
- 신규 매칭 생성 시 코드에서 `matchStatus: "PENDING_STUDENT_ACCEPT"`, `isActive: false`로 생성한다. 학생 수락 시 `matchStatus: "ACTIVE"`, `isActive: true`, `respondedAt: now()`.
- `isActive`는 기존 쿼리(`teacher-student-match.ts`, 대시보드 가드, 모니터링) 호환을 위해 유지하고 **`matchStatus === "ACTIVE"`와 항상 동기화**한다. 별도 `MatchProposal` 모델은 만들지 않는다 — 조인·동기화 비용 대비 이점이 없고 `@@unique([teacherId, studentId])` 재사용이 가능하다.

### 2.2 `HomeworkTemplate` — 반복 숙제 패턴 저장 (§22.4, 북극성 8·9번)

```prisma
/// 선생님별 숙제 템플릿 (주간 반복 패턴 재사용)
model HomeworkTemplate {
  id          String   @id @default(uuid())
  teacherId   String
  teacher     Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  name        String   // 예: "고2 수학 주간 기본"
  subject     String?
  days        Int      @default(7) // 4 | 7 — 분배 대상 일수
  tasks       String   @default("[]") // JSON: [{ title, weight?, dayHint? }]
  useCount    Int      @default(0)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now()) @updatedAt

  @@index([teacherId])
}
```

- `Teacher` 모델에 관계 추가: `homeworkTemplates HomeworkTemplate[]`
- 기존 `POST /api/teacher/students/[id]/homework-distribution`의 body(`tasks[]`, `days`, `repeatWeeks`)와 같은 구조를 저장만 하는 모델이므로 분배 로직 재사용 가능.

### 2.3 `StudyPlan.source` — 자동 분배 추적 (§22.4)

```prisma
model StudyPlan {
  // …기존 필드 유지…
  source     String  @default("MANUAL") // "MANUAL" | "AUTO_DISTRIBUTION"
  templateId String? // 사용된 HomeworkTemplate.id (FK 아님 — 템플릿 삭제 시 플랜 보존)
}
```

### 2.4 `Lesson.lessonType` — 첫 수업 구분 (§22.3)

```prisma
model Lesson {
  // …기존 필드 유지…
  lessonType String @default("REGULAR") // "FIRST" | "REGULAR"
}
```

- 기존 first-lesson API가 만든 Lesson과 자동 스케줄이 생길 미래 수업을 구분한다. journey 계산에서 `lessonCount>0` 대신 `FIRST` 레슨 존재 여부로 판정 가능해진다.

### 2.5 `User.role` 주석 정정 (§22.1 — 스키마 변경 아님, 문서 버그 수정)

```prisma
  role String @default("STUDENT") // "STUDENT" | "TEACHER" | "MANAGER" | "CHIEF_MANAGER" | "ADMIN"
```

§22.1 Chief 자동 배정은 **스키마 변경 불필요** — 기존 `ConsultationBooking.managerId/status/assignedAt` + `ManagerStudent`로 충분하다. 로직 분기만 추가한다 (§3.1).

---

## 3. API 추가/수정 목록

### 3.1 Chief Manager 자동 배정 (§22.1) — 수정 1건

| # | Method·Path | 변경 | 내용 |
|---|-------------|------|------|
| A1 | `POST /api/consultation/request` **수정** | 로직 | `createConsultationRequest()`(`src/lib/student-enrollment.ts`) 안에서 WAITING 생성 직후 `getChiefManager()` 조회 → 성공 시 `assignChiefManagerToStudent()` 호출해 곧바로 `ASSIGNED` + `ManagerStudent` upsert + `BOOKING_CONFIRMED` 알림. Chief 미설정(`null`) 시 **기존 WAITING + `NEW_STUDENT_WAITING` 알림 동작을 그대로 폴백** (503 내지 않음 — 결제 플로우와 달리 상담은 수동 배정으로 계속 굴러가야 함). |

- 북극성 2·3번 주의: "apply-only는 대기, **paid는 chief 자동**"이 원칙이므로, 자동 배정을 결제 여부와 무관하게 켤지 여부는 env 플래그 `AUTO_ASSIGN_CHIEF_ON_CONSULT=1`로 gating (기본 off → 기존 동작 보존).

### 3.2 매칭 제안 → 학생 수락 (§22.2) — 신규 4 + 수정 3

> **현행화 (2026-07-02)**: 작업 트리에 B1(isActive:false 생성)·B6·B7(모바일 수락 API `POST /api/mobile/matches`)이 이미 부분 구현되어 있음을 코드 실측으로 확인. 남은 것은 거절·매니저 취소·웹 수락·matchStatus 도입 — 상세 지시는 `docs/PRODUCT_DESIGN_TRACKER.md` EC-1~EC-4 참조 (그 문서가 우선).

| # | Method·Path | 변경 | 내용 |
|---|-------------|------|------|
| B1 | `POST /api/manager/matches` **수정** | 로직 | `TeacherStudent`를 `matchStatus: "PENDING_STUDENT_ACCEPT"`, `isActive: false`, `proposedById: manager.id`로 생성. 알림을 `TEACHER_ASSIGNED` 대신 신규 `MATCH_PROPOSED`(학생)로 발송. `NEW_STUDENT_ASSIGNED`(선생님)는 수락 시점으로 이동. |
| B2 | `POST /api/admin/matches` **수정** | 로직 | B1과 동일 규칙. 단 Admin은 `immediate: true` body 옵션으로 기존 즉시-active 생성 허용 (운영 백도어). |
| B3 | `GET /api/student/match-proposal` **신규** | STUDENT | 내 `PENDING_STUDENT_ACCEPT` 매칭 DTO (선생님 이름·사진·과목·소개). `requireStudent` 가드. |
| B4 | `POST /api/student/match-proposal/[id]/accept` **신규** | STUDENT | 본인 매칭인지 검증 → `matchStatus: "ACTIVE"`, `isActive: true`, `respondedAt` 세팅 (단일 `update`, `updateMany`+where로 원자적 선점). 알림: `NEW_STUDENT_ASSIGNED`(선생님) + `MATCH_ACCEPTED`(매니저). |
| B5 | `POST /api/student/match-proposal/[id]/decline` **신규** | STUDENT | `matchStatus: "DECLINED"`, `declineReason` 저장. 알림 `MATCH_DECLINED`(매니저) → 매니저 포털 매칭 화면에서 재제안. `@@unique([teacherId, studentId])` 충돌 대비: 같은 조합 재제안 시 DECLINED 행을 upsert로 PENDING으로 되살림. |
| B6 | `GET /api/mobile/matches` **수정** | 로직 | 응답에 `matchStatus` 포함, PENDING 매칭도 내려줌 (앱 `consult/match.tsx`가 수락 버튼 렌더링). |
| B7 | `POST /api/mobile/matches/[id]/respond` **신규** | Mobile JWT | body `{ action: "accept" \| "decline", reason? }` — B4/B5와 동일 로직 공유 (`src/lib/match-response.ts`로 추출해 웹·앱 공용). |

**연쇄 수정**: `resolveStudentJourneyStage()`에 `TEACHER_ACCEPT_PENDING` 단계 추가 (`PENDING_STUDENT_ACCEPT` 매칭 존재 시). `requireTeacherStudentMatch`·대시보드 가드·모니터링 쿼리는 `isActive: true` 조건을 이미 쓰므로 수정 불필요 (PENDING은 isActive=false).

### 3.3 첫 수업 & Journey 동기화 (§22.3) — 수정 3

| # | Method·Path | 변경 | 내용 |
|---|-------------|------|------|
| C1 | `PATCH /api/teacher/students/[id]/first-lesson` **수정** | 가드+필드 | `matchStatus === "ACTIVE"`인 매칭만 허용 (수락 전 첫 수업 설정 차단). Lesson 생성 시 `lessonType: "FIRST"`. |
| C2 | `src/lib/notifications.ts` **수정** | 상수 | `FIRST_LESSON_SET`을 `PUSH_NOTIFICATION_TYPES`에 추가 (푸시 발송 누락 수정). |
| C3 | `GET /api/mobile/me` **수정** | 응답 | journey stage를 **서버가 계산해 내려줌** (`journeyStage` 필드, `src/lib/student-journey.ts` 단일 소스). `mobile/lib/student-journey.ts`는 서버 값 우선 사용 + enum에 `FIRST_LESSON_PENDING`·`TEACHER_ACCEPT_PENDING` 추가 (구버전 앱 폴백용 로컬 계산은 유지). |

### 3.4 숙제 템플릿 & 자동 분배 (§22.4) — 신규 3 + 수정 2

| # | Method·Path | 변경 | 내용 |
|---|-------------|------|------|
| D1 | `GET /api/teacher/homework-templates` **신규** | TEACHER | 내 템플릿 목록 (`lastUsedAt desc`). |
| D2 | `POST /api/teacher/homework-templates` **신규** | TEACHER | 템플릿 생성 `{ name, subject?, days, tasks[] }`. |
| D3 | `PATCH·DELETE /api/teacher/homework-templates/[id]` **신규** | TEACHER | 수정·삭제 (본인 소유 검증). |
| D4 | `POST /api/teacher/students/[id]/homework-distribution` **수정** | 로직 | body에 `templateId?`·`saveAsTemplate?: { name }` 추가. `templateId` 지정 시 템플릿 tasks 로드 후 분배, `useCount++`·`lastUsedAt` 갱신. 생성되는 `StudyPlan.source = "AUTO_DISTRIBUTION"`, `templateId` 기록. |
| D5 | first-lesson 설정 훅 **수정** | 로직 | C1 성공 시 해당 선생님의 `lastUsedAt` 최신 템플릿이 있으면 첫 수업일부터 자동 분배 실행 (없으면 skip, `HOMEWORK_AUTO_DISTRIBUTED` 알림). env `AUTO_HOMEWORK_ON_FIRST_LESSON=1` gating. |

### 3.5 결제 서버 검증 (P0 — §22 밖이지만 선행 필수)

| # | Method·Path | 변경 | 내용 |
|---|-------------|------|------|
| E1 | `src/lib/toss-server.ts` **신규** | lib | `confirmTossPayment(paymentKey, orderId, amount)` — `POST https://api.tosspayments.com/v1/payments/confirm`, `Authorization: Basic base64(TOSS_SECRET_KEY + ":")`. env `TOSS_SECRET_KEY` 추가 (`check-env.ts`·`.env.example` 반영). |
| E2 | `POST /api/payments/complete` **수정** | 로직 | `paymentKey`·`amount` 필수화 → E1 confirm 성공 시에만 `completeStudentPayment()`. `PaymentCompletion`에 검증 결과 기록 (기존 멱등 구조 재사용). 서버 계산 금액(`order-pricing.ts`)과 `amount` 불일치 시 400. |
| E3 | `POST /api/mobile/payments/complete` **수정** | 로직 | E2와 동일. `mobile/app/checkout.tsx`의 하드코드 orderId/amount 제거 — 실 PG 연동 전까지는 **웹 `/checkout` 웹뷰 위임**으로 전환. |

---

## 4. 구현 우선순위

### P0 — 보안·금전 (즉시)

1. **E1–E3 토스 서버 승인 검증** — 현재 무결제 구독 활성화 가능. 스키마 변경 없음, `TOSS_SECRET_KEY` env만 추가. *(예상 변경: `src/lib/toss-server.ts` 신규, `payments/complete` 2개 route, `check-env.ts`)*
2. **운영 세팅**: 프로덕션에 `CHIEF_MANAGER_EMAIL` 설정 확인 (미설정 시 결제 플로우 503 — 핸드오프 §15).

### P1 — 북극성 핵심 플로우 (이번 사이클)

3. **§2 마이그레이션 1건** (matchStatus + HomeworkTemplate + StudyPlan.source + Lesson.lessonType) — P1 전체의 선행 조건.
4. **B1–B7 매칭 제안→학생 수락** (북극성 6번). UI: 앱 `consult/match.tsx` 수락/거절 버튼, 웹 `/dashboard/consultation` 매칭 카드, 매니저 포털 매칭 화면에 PENDING/DECLINED 뱃지.
5. **C1–C3 첫 수업 가드 + journey 서버 단일화** (북극성 7번, 웹/앱 drift 해소).
6. **A1 상담 접수 Chief 자동 배정** (env gating, 북극성 3번).

### P2 — 생산성·자동화 (다음 사이클)

7. **D1–D5 숙제 템플릿 + 자동 분배 트리거** (북극성 8·9번). D1–D4 먼저, D5 자동 트리거는 D4 검증 후.
8. **QnA 모델 통합** — `QuestionMessage`를 정본으로 하고 `Question`을 읽기 마이그레이션 (별도 설계 문서 필요, 이번 범위 밖).

### P3 — 구조 개선 (기회 있을 때)

9. status/role 문자열 → 상수 모듈(`src/lib/enums.ts`)로 중앙화 (Prisma enum 전환은 마이그레이션 리스크 커서 보류).
10. `ConsultationBooking.studentId` unique 해제 + 이력화, Cron 주기 상향(Vercel Cron 시간별), 레거시 랜딩 컴포넌트 정리.

### 실행 순서 (Claude Code 세션 단위)

```
세션 1: E1–E3 (결제 검증)            → npm run build + 수동 결제 시나리오
세션 2: 스키마 마이그레이션 (§2)      → npx prisma migrate dev + build
세션 3: B1–B7 + journey (§3.2–3.3)  → 매칭 제안→수락→첫수업 E2E 수동 검증
세션 4: A1 (Chief 자동 배정)         → env off/on 양쪽 검증
세션 5: D1–D5 (숙제 템플릿)          → 분배 결과 StudyPlan 확인
```

각 세션 종료 조건: `npm run lint` + `npm run build` 통과, 핸드오프 §20 검증 시나리오 통과, 변경 파일 리뷰.

---

## 부록 — 신규 알림 타입 요약

| type | 수신자 | 발생 | 푸시 |
|------|--------|------|------|
| `MATCH_PROPOSED` | 학생 | 매니저 매칭 제안 | ✅ |
| `MATCH_ACCEPTED` | 매니저 | 학생 수락 | — |
| `MATCH_DECLINED` | 매니저 | 학생 거절 | ✅ |
| `HOMEWORK_AUTO_DISTRIBUTED` | 학생 | 첫 수업 후 자동 분배 | ✅ |
| `FIRST_LESSON_SET` | 학생 | (기존) 푸시 타입 목록에 추가 | ✅ |
