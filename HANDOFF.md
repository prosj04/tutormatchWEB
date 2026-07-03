# HANDOFF.md — Concord Private Tutoring 마스터 핸드오프

> 이 문서는 **모든 후속 AI 세션의 진입점**이다. 다른 문서로 가기 전에 Part 0을 반드시 통독한다.  
> 갱신: **2026-07-04 · main** · 원격 `https://github.com/prosj04/tutormatchWEB.git`  
> 상세 히스토리 원본: `CLAUDE_HANDOFF.md` (1,425줄, §1~26 세션 로그·이연 스펙 보존)  
> 문서 지도: `docs/README.md`

---

## 목차

- [Part 0 — AI 운영 하네스 (필독)](#part-0)
- [Part 1 — 5분 온보딩](#part-1)
- [Part 2 — 시스템 상세 (요약 + 참조)](#part-2)
- [Part 3 — 2026-07-04 현재 상태 스냅샷](#part-3)
- [Part 4 — 다음 작업 백로그](#part-4)
- [Part 5 — 문서 지도 · 세션 로그](#part-5)

---

<a id="part-0"></a>
## Part 0 — AI 운영 하네스 (이 저장소에서 작업하는 모든 AI에게 적용)

> 이 절은 시스템 프롬프트 또는 `AGENTS.md`로 그대로 복사·확장 가능한 규범 집합이다. 기존 `AGENTS.md` / `CLAUDE.md`가 규정하지 않은 조건은 이 절이 우선한다.

### 0.1 제품 북극성 — 프리미엄 과외 9단계

`CLAUDE.md`의 원문을 그대로 승계한다. 모든 구현·리팩터·문서 결정은 이 순서를 배반하지 않아야 한다.

1. 학생이 상담을 신청하거나 결제한다.
2. 신청만 한 학생은 **매니저 배정 대기 상태**로 남는다.
3. 결제한 학생은 **치프 매니저에게 자동 배정**된다.
4. 매니저는 배정된 학생을 받아 대면 상담 일정을 조율한다.
5. 대면 상담 중 매니저가 적합한 선생님을 자유롭게 배정한다.
6. 학생은 **수락 버튼**으로 배정된 선생님을 명시적으로 수락해야 수업이 활성화된다.
7. 수락 이후 담당 선생님이 첫 수업 날짜를 정하고 수업을 시작한다.
8. 대면 수업은 선생님이 1주(또는 4일)치 숙제를 한 번에 입력하면 시스템이 **가중치 기반으로 자동 분배**한다.
9. 매주 반복되는 숙제 패턴은 **템플릿으로 재사용** 가능해야 한다.

`resolveStudentJourneyStage()` (`src/lib/student-journey.ts`) 및 `mobile/lib/student-journey.ts`의 stage enum이 이 9단계의 코드 반영이다. 두 곳의 enum이 어긋나면 반드시 웹을 기준으로 모바일을 갱신한다.

### 0.2 멀티 세션 프로토콜 (중요)

**이 저장소는 복수 AI 세션이 동시에 작업 중이다.** 다음 규칙을 무조건 지킨다.

- **세션 시작 시** `git status && git log --oneline -10 && git rev-list --count origin/main..HEAD`을 먼저 실행해 **타 세션의 미커밋 파일·최근 커밋·push 대기 수**를 확인한다.
- **타 세션의 미커밋 파일은 절대 수정·스테이징하지 않는다.** 특히 `prisma/schema.prisma` 및 `prisma/migrations/**`은 **현재 결제/정산 세션이 소유**하고 있는 것으로 간주한다. 다른 세션에서 스키마를 만져야 할 필요가 생기면 오너에게 조율 요청.
- 자신의 변경분만 **명시적 경로**로 `git add`한다. `git add -A`, `git add .` 금지.
- 세션 간 통신은 이 파일의 [Part 5 · 세션 로그](#part-5)에 append 한다.

### 0.3 DB는 프로덕션이다 — 데이터 파괴 금지

- `.env`의 `DATABASE_URL`은 **실서비스 Supabase 인스턴스**(pgbouncer 6543, DIRECT_URL 5432)이며 실사용자 데이터가 존재한다.
- 다음 작업은 **오너 승인 없이 실행 금지**:
  - 시드 스크립트 (`npm run seed:sample` 등) — 이미 실행된 이력이 있어 재실행 시 [sample] 접두사 데모 계정이 중복될 수 있다. 공개 노출은 코드 필터(`src/app/api/tutors` 등)로 차단되어 있으나 사이드이펙트 있음.
  - `prisma migrate reset`, `prisma db push --force-reset`, 직접 `DELETE FROM` 실행.
  - 새 마이그레이션의 프로덕션 적용 (`prisma migrate deploy`) — 스키마 세션 소유자와 조율 후 실행.
- **CMS 테이블(`SiteContent`, `Testimonial`, `FaqItem`)이 비어 있는 것은 의도된 상태다.** 사이트는 `cms-page-defaults.ts` / `cms-seed.ts`의 **코드 fallback**으로 렌더링 중이며, CMS 시딩(`POST /api/admin/cms/init`)은 오너 승인이 있어야 실행한다.
- **DB에 `[sample]` 접두사 데모 계정이 존재**한다. 공개 강사 목록 등은 코드 레벨에서 이 접두사를 필터링한다(`src/app/tutors`, `src/lib/public-teachers-cache.ts`). 필터 제거 금지.

### 0.4 배포 규칙 — main push = 프로덕션

- `origin/main`에 push하면 Vercel(`tutormatch-web`)이 **즉시 프로덕션에 배포**한다.
- **오너의 명시 승인 없이는 push하지 않는다.** 현재 로컬 `main`은 `origin/main`보다 **29 커밋 앞서** 있으며 다수의 미배포 변경이 대기 중이다. 상황 그대로 유지하고, 새 커밋도 로컬에만 쌓는다.
- 배포 시 빌드는 `prisma migrate deploy && next build`. 미적용 마이그레이션이 있으면 배포가 스키마를 자동 반영한다 — 이는 스키마 세션의 결정 사항이므로 임의로 트리거하지 않는다.

### 0.5 검증 프로토콜

- **타입 검사**: `npx tsc --noEmit && echo OK` 사용. 파이프로 `tail` 등을 붙이면 `$?`가 파이프 마지막 명령의 종료코드가 되어 실패가 은폐된다.
- **린트**: 파일 단위 실행이 빠르다. `npx next lint --file <상대경로>`.
- **UI 스모크**: dev 서버는 3000 포트를 타 세션이 쓸 수 있으니 **여유 포트(예: 3987)** 로 띄운다. `PORT=3987 npm run dev`, 스모크 후 반드시 프로세스 종료.
- **API 스모크**: 로컬 `curl` — cron/알림 계열은 `Authorization: Bearer $CRON_SECRET`이 필요.
- **모바일 tsc**: `mobile/` 워크스페이스에서 별도로 `npx tsc --noEmit`.

### 0.6 커밋 규칙

- **오너가 요청할 때만 커밋한다.** 자동 커밋 금지.
- Conventional Commits + `(scope)` 형태를 유지한다. 최근 로그 스타일 참조:
  ```
  feat(consultations): allow consultation history per student
  fix(security): require session ownership for teacher document uploads
  docs(handoff): record phase 3 completion state (§25.1d)
  ```
- 논리 단위별로 커밋을 분리한다. 서로 무관한 변경을 한 커밋에 묶지 않는다.
- **`--no-verify` 금지.** 훅이 실패하면 원인을 고치고 새 커밋을 만든다 (amend 금지 — 실제 커밋되지 않은 상태에서 amend하면 이전 커밋을 덮어쓴다).
- 시크릿·생성물(`cookies.txt` 류) 절대 커밋 금지. `.gitignore` 확인.

### 0.7 디자인 규칙

- **홈 랜딩(`/`)**: `landing-v2.css`, 클래스 접두사 `.lp2-`. `LandingRoot` → `LandingPageV2` 트리에서만 사용.
- **서브페이지(요금·강사·FAQ·후기·법률 등)**: `concord.css`.
- **색상은 반드시 CSS 변수 토큰**을 통해서만 사용한다 (`--bg`, `--fg`, `--acc`, `--acc-text`, `--panel`, `--line` 등). 하드코딩 색은 자동으로 다크모드가 깨진다. 세부는 `design handoff/DESIGN_SYSTEM.md`.
- **타이포**: Pretendard, 전역 `word-break: keep-all` (한글 어절 줄바꿈).
- 디스플레이 800 / 제목 700 / 본문 400. 굵기 남발 금지, 크기와 색으로 위계.
- 새 스타일은 `.lp2-` 또는 `concord.css` 어느 쪽에 속하는지 판단하고 해당 파일에만 추가한다.

### 0.8 문서 규칙

- 모든 산출 문서는 **한국어**. 갱신 시 `docs/README.md` 인덱스 동반 갱신.
- **검증 불가한 수치를 창작하지 않는다.** 확신 없는 값은 `[확인 필요]` 표기.
- **법률 문서는 초안 표시를 유지**한다. `docs/internal/contracts/**` 및 `docs/internal/LEGAL_ADVISORY_MEMO.md`는 AI 임시 자문이며 **정식 자문 전 대외 사용 금지**.
- `docs/IMPLEMENTATION_PLAN_2026-07.md`, `docs/IMPLEMENTATION_SESSIONS_REVISED.md`, `docs/MANAGER_GUIDELINES.md`는 **다른 세션이 활성 사용 중** — 구조 변경 금지, 내용 추가만.
- 세션 종료 시 이 파일 [Part 5 · 세션 로그](#part-5)에 엔트리 append (`CLAUDE_HANDOFF.md §25` 스타일 승계).

### 0.9 금지 사항

- `git commit --no-verify`, `git push --force`, `git reset --hard`, `git clean -f` — 오너 명시 지시 없이는 절대 실행 금지.
- `/api/dev/*` 류의 개발용/우회 라우트를 프로덕션 코드에 추가하고 방치하는 것. 과거 `POST /api/dev/skip-payment-enroll`은 이미 제거되었다.
- **AI 인물 사진을 실존 인물처럼 보이도록 프로필에 무단 적용**. 사진 작업은 오너 보류 중(`docs/PHOTO_GENERATION_PROMPT.md`).
- CMS 테이블 임의 시딩, 시드 스크립트 임의 실행.
- 마이그레이션의 로컬 실행/프로덕션 적용을 스키마 세션과 조율 없이 진행.
- Toss 시크릿 키·Supabase Service Role·Anthropic 키를 로그·응답·문서에 노출.

### 0.10 작업 종료 시 체크리스트

1. `npx tsc --noEmit && echo OK` 통과 확인.
2. 변경 파일에 `npx next lint --file` 실행.
3. dev 서버 프로세스 종료(백그라운드 잔존 금지).
4. **[Part 5 · 세션 로그](#part-5)에 오늘 작업·핵심 파일·커밋 해시·미해결 항목을 append.** (`CLAUDE_HANDOFF.md §25.1x` 형식.)
5. 오너 미승인 push·커밋 없음 확인.

---

<a id="part-1"></a>
## Part 1 — 5분 온보딩

### 제품 한 줄
**Concord Private Tutoring** — 1:1 프리미엄 과외 매칭·학습관리 플랫폼. 학부모(결제자) 대상, 매니저가 상담·매칭·리텐션을 중개.

### 역할 4개와 진입점

| 역할 | 로그인 후 홈 | 핵심 UI |
|------|-------------|--------|
| STUDENT | `/dashboard` (active match 필요) / `/dashboard/consultation` | 캘린더·플래너·QnA·상담·결제내역 |
| TEACHER | `/teacher-portal/dashboard` | 담당 학생·플랜·질문 답변·프로필 |
| MANAGER (+ CHIEF_MANAGER) | `/teacher-portal/dashboard` | 위 + 상담·매칭·모니터링·케어로그·상담 리포트 |
| ADMIN | `/admin` | 전 CRUD·CMS·지표·정산·감사로그·환불 |

역할 상세 정책은 `CLAUDE_HANDOFF.md §2`. `CHIEF_MANAGER`는 결제 자동 배정 대상이며 `requireAdmin` / `requireManager` 통과.

### 현재 단계
**출시 전, 파일럿 준비 단계.** 코드는 결제→매칭→수락→첫 수업→숙제 자동 분배→월간 리포트→정산까지 관통 가능. 다음 블로커는 (1) 사업자 등록, (2) 법률 문서 변호사 검토, (3) `origin/main`에 대기 중인 29 커밋의 배포 승인.

### 라이브 URL / 저장소

| 항목 | 값 |
|---|---|
| 프로덕션 URL | `https://tutormatch-web.vercel.app` |
| Vercel 프로젝트 | `tutormatch-web` |
| GitHub | `prosj04/tutormatchWEB` |
| 브랜치 | `main` (로컬은 origin보다 29 커밋 앞섬) |

### 기술 스택 한 줄
**Next.js 14.2 App Router · TypeScript · NextAuth v5 (JWT/Credentials) · Prisma 5.22 + Supabase PostgreSQL · Toss Payments (위젯 + 서버 confirm + 웹훅 + 빌링키) · Anthropic Claude · React Native (Expo, `mobile/`) · Vercel + Cron.**

### "지금 이어서 할 일" 후보

우선순위와 참조는 [Part 4 · 백로그](#part-4). 상위 5개는:

1. Toss 대시보드에 웹훅 URL 등록 (오너 액션).
2. 사업자 등록 후 법률 문서 `[기재 예정]` 8곳 채우기 (오너 액션).
3. `origin/main`에 대기 중인 29 커밋의 배포 승인 (오너 결정).
4. 프로덕션 스모크 테스트 (로컬 스모크는 §25.1f에서 9/10 통과 확인됨).
5. 커스텀 도메인·GA4·비밀번호 재설정 등 파일럿 이전 필수 최소 리스트 진행.

---

<a id="part-2"></a>
## Part 2 — 시스템 상세 (요약 + 참조)

> 이 절은 "**어디에 무엇이 있는지**"의 지도다. 상세 서술은 원본 문서로 이동한다.

### 2.1 아키텍처 개요 (참조 원본: `docs/internal/TECH_OVERVIEW.md`)

```
[마케팅] 홈(landing-v2) · 요금 · 강사 · FAQ · 후기 · 법률
    ↓ 상담 CTA / 결제
[가입] 학생(전화번호) / 선생(3단계 지원)
    ↓
[결제] Toss 위젯 → confirm 서버 검증 → 웹훅 재검증 → 구독 ACTIVE + 치프 배정
    ↓
[상담] ConsultationBooking (WAITING → ASSIGNED → COMPLETED, 이력 다행)
    ↓ 상담 리포트(목표·수준·추천 플랜)
[매칭] TeacherStudent matchStatus (PENDING_STUDENT_ACCEPT → ACTIVE)
    ↓ 학생 수락
[수업] 첫 수업 API + 자동 숙제 분배(템플릿) + Lesson 자동 COMPLETED 전이
    ↓
[운영] 매니저 케어 로그 · 만족도 D+7 · 월간 AI 리포트 · 어드민 지표 · 감사로그
    ↓
[수익] 빌링키 자동 갱신 · 셀프 해지 · dunning · 선생 시급 3만원 월별 정산
```

- **상세 아키텍처**: `docs/internal/TECH_OVERVIEW.md`
- **아키텍처 원본(구버전 포함)**: `CLAUDE_HANDOFF.md §1, §3, §5, §6`

### 2.2 역할·권한 (참조 원본: `CLAUDE_HANDOFF.md §2, §8`)

- 4 역할: `STUDENT` / `TEACHER` / `MANAGER` / `ADMIN` + 사실상 5번째 `CHIEF_MANAGER`.
- API 가드 헬퍼(`src/lib/`): `admin-auth`, `student-auth`, `teacher-auth`, `manager-auth`, `manager-page-auth`, `notification-auth`, `teacher-student-match`.
- `requireAdmin` → ADMIN **또는** CHIEF_MANAGER. `requireTeacher` → TEACHER/MANAGER/CHIEF_MANAGER. `requireManager` → MANAGER/CHIEF_MANAGER.
- 미들웨어 매칭·마케팅 공개 경로 목록은 `middleware.ts`, `src/lib/public-routes.ts`.

### 2.3 핵심 비즈니스 플로우 (승계 + 갱신)

`CLAUDE_HANDOFF.md §3`을 기준으로 하되 아래 사항은 세션 후 갱신됨:

- **§3.5 선생님 매칭**은 이제 즉시 active가 아니라 `PENDING_STUDENT_ACCEPT` → 학생 수락 시 `ACTIVE`. `matchStatus` 컬럼과 `POST /api/matches/[matchId]/accept`, 매니저가 입력한 `matchReason` 표시 포함.
- **§3.3 결제 플로우**는 v1 세션 기반이 아니라 **v2 시간제 월정액 8종** 기준. `src/lib/pricing-plans.ts`의 `PRICING_PLANS_V2` (중등·고등 × 주1회 2h / 주1회 3h / 주2회 2h / 주2회 3h). v1 금액은 `planIdFromAmount` 역매핑에서 계속 인식.
- **결제 완료**는 서버 confirm(`src/lib/toss-payments.ts`) + 웹훅(`/api/webhooks/toss`)로 검증됨. 과거 "orderId만으로 완료"의 우회 지점은 해소.
- **상담 이력화**: `ConsultationBooking.studentId @unique` 해제 완료 — 학생당 여러 상담 로우 존재 가능. `open` 상담은 `WAITING`/`ASSIGNED` 1건으로 앱 레벨 강제. 헬퍼: `src/lib/consultation-current.ts`.

### 2.4 인증·미들웨어

- `auth.ts`: NextAuth v5 JWT + Credentials. `basePath: /api/auth`. `NEXTAUTH_URL`에 절대 path 붙이지 않음 (붙이면 전원 로그인 실패).
- 로그인 식별자는 이메일 또는 전화번호 (`src/lib/phone-login.ts`). 합성 이메일: `student+{digits}@concord.local` / `teacher+{digits}@concord.local`.
- `deletedAt` non-null 계정은 로그인 차단.
- 세부는 `CLAUDE_HANDOFF.md §8`.

### 2.5 DB 모델 관계 (참조 원본: `prisma/schema.prisma`, `CLAUDE_HANDOFF.md §9`)

- 핵심 관계 그래프는 §9 참조. 그 후 추가된 모델(반드시 인지):
  - `AuditLog` — 계정삭제/환불/역할변경/일시정지 기록 (`/admin/audit-logs`).
  - `HomeworkTemplate` — title, defaultDays, isDefault, tasks JSON. 첫 수업 설정 시 자동 적용.
  - `ConsultationReport` — 매니저 상담 후 정량/정성 목표·수준·추천 플랜.
  - `ManagerCareLog` — 매니저의 상담/개입/점검 로그. 학생 대시보드에 공개 항목 노출.
  - `SatisfactionCheckin` — 첫 수업 D+7 만족도 1~5점.
  - `Subscription` `PAUSED` 상태 + `pausedAt`/`pausedUntil` (매니저 전용, 최대 35일, 만료일 자동 연장).
  - `BillingProfile` — 토스 빌링키(카드) 자동결제 프로필. `autoRenew` 셀프 토글.
  - `QuestionMessage` — QnA 통합 후 **단일 저장소**. `replyToId` 스레드, `date`, `isResolved`. 기존 `Question` 테이블은 DEPRECATED로 존치.
  - Prisma **enum 전환** 완료: `UserRole`, `ConsultationStatus`, `LessonStatus`, `SubscriptionStatus`, `MatchStatus`, `PaymentStatus` (수기 in-place 캐스트 SQL로 데이터 보존).
- **`ConsultationBooking.studentId`는 @unique가 아니다** (이력화 이후). `findUnique` 사용 금지 — `consultation-current.ts`의 헬퍼 사용.

### 2.6 API 개요

- **총 110 라우트** (`docs/internal/API_REFERENCE.md` 실측 기준. `CLAUDE_HANDOFF.md §10`의 58 라우트 표기는 **구버전**).
- 그룹: `account`, `admin` (30), `auth`, `billing` (2), `chief-manager`, `consultation`, `cron` (2), `events`, `manager` (13), `matches`, `mobile` (20), `notifications`, `payments`, `plans`, `questions`, `register`, `student`, `teacher`, `webhooks`.
- **상세 목록·권한·파라미터는 `docs/internal/API_REFERENCE.md` 하나로 통일**. 여기서는 중복 서술하지 않는다.
- 신규/최근 라우트 하이라이트:
  - `POST /api/webhooks/toss` — 결제 웹훅 (멱등, Toss 재검증).
  - `POST /api/matches/[matchId]/accept` — 학생 매칭 수락.
  - `POST /api/manager/subscriptions/[id]/pause` — 매니저 전용 일시정지.
  - `POST /api/admin/payments/[id]/refund` — 환불 마킹 + 구독 취소.
  - `POST /api/student/teacher-change-request` — 선생 교체 요청.
  - `PATCH /api/teacher/lessons/[id]/cancel` — 선생 취소 + 보강 자동 생성.
  - `GET /api/admin/metrics`, `/admin/settlements`, `/admin/audit-logs`.
  - `POST /api/student/question-images`, `POST /api/teacher/profile/photo` — 스토리지 서버 경유.
  - `POST /api/billing/register-success` — 빌링키 등록 완료.
  - `POST /api/account/delete`, `DELETE /api/mobile/me` — 계정 삭제(앱스토어 5.1.1(v)).

### 2.7 CMS 시스템 (참조: `CLAUDE_HANDOFF.md §11`)

- 소스: `SiteContent`(section+key→value) / `Testimonial` / `FaqItem`.
- **현재 DB 3 테이블 모두 비어 있다.** 사이트는 `src/lib/cms-page-defaults.ts` / `cms-seed.ts` / `landing-data.ts` 폴백으로 렌더링 중.
- 캐시: revalidate 300s + 태그 무효화(`revalidatePublicCms`).
- 시딩(`POST /api/admin/cms/init` → `seedDefaultCmsContent`)은 **오너 승인 후 실행**한다. 시딩 후에도 `skipDuplicates: true`.
- 인라인 편집: ADMIN + `?cms_edit=1` → `CmsEditOverlay`.

### 2.8 결제·정산·빌링·알림·cron

- **결제 (v2)**: `src/lib/pricing-plans.ts` (`PRICING_PLANS_V2` 8종, priceKrw 유니크) → `/checkout?plan=<id>` → Toss 위젯 → `success` → 서버 confirm(`toss-payments.ts`) → 웹훅 재검증 → 구독 ACTIVE + 치프 배정.
- **빌링키 자동갱신**: `BillingProfile` + 갱신 cron. 실패 시 D+1/D+3 재시도 → D+7 자동 해지. `autoRenew` 셀프 토글로 "언제든 해지" 지원.
- **선생 정산**: `/admin/settlements` — 월별(KST) 완료 수업 × durationMin × 시급 30,000원. PG 지급대행은 외부 계약 후.
- **알림**: `src/lib/notifications.ts` 타입 다수. `src/lib/run-alert-checks.ts`에 D-5/D-1 만료, D+7 만족도, 매칭 24h 방치, 첫 수업 SLA 7일, 미결제 리드 3일 팔로업, 미답변 질문 24h 등 통합.
- **SMS/알림톡**: `src/lib/sms.ts` — env-gated 알림톡 우선 + SMS 폴백. `SOLAPI_KAKAO_PF_ID` / `SOLAPI_KAKAO_TEMPLATE_*` 미설정 시 SMS로 자동 폴백.
- **Cron**: `vercel.json` 매일 UTC 00:00 `/api/cron/check-alerts`. Hourly는 GitHub Actions로 옮겼다가 PAT scope 문제로 제거됨 — 현재 daily만. 라우트에 `x-vercel-cron` 헤더 우회 지원.

### 2.9 환경변수 (참조: `.env.example`, `scripts/check-env.ts`, `CLAUDE_HANDOFF.md §14`)

로컬 `.env` 실측 필수 키: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. 추가 권장: `ADMIN_SETUP_SECRET`, `ANTHROPIC_API_KEY`, `CHIEF_MANAGER_EMAIL`, `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY`, `TOSS_SECRET_KEY`, `SOLAPI_*`, `SOLAPI_KAKAO_*`, `ENABLE_AUTO_HOMEWORK_DISTRIBUTION`.

### 2.10 폴더 구조 (요약)

```
premium-tutoring/
├─ auth.ts, middleware.ts, next.config.mjs, vercel.json
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/               # 25개 (§2.11)
├─ public/
├─ scripts/                     # check-env, setup-storage, seed-sample
├─ src/
│  ├─ app/                      # 110 API 라우트 + 페이지
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/                      # 도메인 로직 (약 80개, CLAUDE_HANDOFF §16)
│  └─ types/
├─ mobile/                      # Expo 56 React Native 워크스페이스
├─ docs/                        # 문서 (외부·내부·전략·실행)
├─ design handoff/              # 디자인 원본 (HTML 시안, DESIGN_SYSTEM.md)
├─ HANDOFF.md                   # ← 이 문서
└─ CLAUDE_HANDOFF.md            # 세션 로그·이연 스펙 원본
```

### 2.11 마이그레이션 목록 (실측, 총 25개)

```
20260514190000_supabase_init
20260516000000_baseline_missing_tables
20260517000000_add_indexes
20260518081500_add_teacher_documents
20260520120000_visit_consultation_times
20260520180000_teacher_gender
20260521120000_student_gender
20260521130000_cms_tables
20260527120000_faq_reviews_surface_flags
20260625143525_mobile_app_models
20260630120000_analytics_events
20260702140000_payment_completion_idempotency
20260702160000_student_guardian_phone
20260702210000_study_task_source
20260702220000_homework_templates
20260703014634_soft_delete_and_match_reason
20260703031301_phase2_core_loop
20260703071300_phase3_retention
20260703092239_leftover_batch
20260703120000_teacher_student_match_status
20260703140210_consultation_history
20260703141527_status_enums
20260703143003_audit_log
20260703152558_qna_unification
20260703164930_billing_key
```

`CLAUDE_HANDOFF.md §9`의 9개 리스트는 **구버전 표기**.

---

<a id="part-3"></a>
## Part 3 — 2026-07-04 현재 상태 스냅샷

### 3.1 이번 사이클(2026-07-02 ~ 07-04) 최근 30 커밋으로 파악한 완료 항목

git log 실측 요약. 상세 세션 로그는 `CLAUDE_HANDOFF.md §25.1a~h`.

| 영역 | 완료 내용 | 대표 커밋 |
|---|---|---|
| 디자인 개선 | 공개 페이지 스크롤 리빌·홈 신뢰 배지·지역 안내 | `7cfc553`, `706ef07`, `5a7cf17`, `dfa6b86` |
| 문서 체계 | 외부(사업계획서 PSST·재무) + 내부(TECH·API·법률·계약 초안) + 문서 지도 신설 | `40a6f65`, `33519d6`, `4695b6a`, `5669cd6`, `30ed748` |
| 보안 수정 | 선생 서류 업로드 세션 소유권 검증 · `requireAdmin` 축소 · 스토리지 서버 경유 · qna 미답변 알림 통합 | `a83c392`, `17e3619` |
| 결제 v2 | 시간 기반 v2 요금제(8종) · 요금 페이지·홈 티저 반영 · 모바일 정합 | `9f578ac`, `603824c` 등, `3bbddd7` |
| 빌링·정산 | Toss 빌링키 자동갱신·dunning·셀프 해지 (Q2=A) · 시급 3만원 월별 정산 리포트 (Q3) | `831979b`, `c986a90` |
| QnA 통합 | `QuestionMessage` 단일 저장소, `Question` DEPRECATED | `92b19a4` |
| 상담 이력화 | `ConsultationBooking.studentId` @unique 해제, `consultation-current.ts` 헬퍼 | `4a0875b` |
| Prisma enum | UserRole/ConsultationStatus/LessonStatus/SubscriptionStatus/MatchStatus/PaymentStatus 전환 | `f819b2d` |
| 감사·지표 | AuditLog, 매니저 성과 지표(전환율·수락률·중앙값·케어 30일) | `4490285`, `e51e9e2` |
| 부팅·데이터 | 치프 매니저 계정 시드, cron 카운터 스프레드 버그 픽스 | `5f6568b` |
| 미성년 동의 | ConsultationSignupForm에 보호자 동의 수집 + `Student.guardianConsentAt` | (Phase 3 잔여 배치) |
| 페이지 정정 | `/login` 역할 탭 제거, 법률 목차, 강사 목록 role 필터·[sample] 제외 | `a3fa1eb`, `0eefa8c` |

**로컬 `main`은 `origin/main`보다 29 커밋 앞선다** (`git rev-list --count origin/main..HEAD`). 오너 승인 후 push하면 프로덕션 배포.

### 3.2 상세 세션별 기록 (원본)

`CLAUDE_HANDOFF.md §25.1a~h`에 시간대별 완료·검증·주의사항 기록 있음. 이 파일은 **원본을 그대로 보존**하며 요약본을 여기 두지 않는다.

### 3.3 미해결·보류 항목 (수집 원본: `CLAUDE_HANDOFF.md §22, §26`, `docs/PRODUCT_DESIGN_TRACKER.md`, `docs/BUSINESS_REVIEW.md`)

| 카테고리 | 항목 | 상태 · 참조 |
|---|---|---|
| 콘텐츠 | 인물 사진 6종 × 5장 | 보류 (`docs/PHOTO_GENERATION_PROMPT.md`) |
| CMS | SiteContent/Testimonial/FaqItem 시딩 | 오너 승인 대기 (§0.3) |
| 법률 | terms/privacy/refund `[기재 예정]` **8곳** (실측 grep 결과) — 대표자명·사업자등록번호·통신판매업신고·주소·시행일 등 | 사업자 등록 후 (Q4) |
| 법률 | 3종 초안의 변호사 검토 반영 | Q1, 오너 진행 중 |
| 계약 | `TUITION_CONTRACT_DRAFT`, `TUTOR_ENGAGEMENT_CONTRACT_DRAFT` 변호사·노무 검토 | `docs/internal/contracts/` |
| 인프라 | 커스텀 도메인 | 미확보 |
| 계측 | GA4 이벤트 계측 부재 | 파일럿 이전 필요 |
| 인증 | 비밀번호 재설정 플로우 부재 | 파일럿 이전 필요 |
| 콘텐츠 정책 | 리뷰 별점 정책 미정 | `docs/PRODUCT_DESIGN_TRACKER.md` |
| 보안 | Supabase Storage RLS 정책 재점검 (서버 경유 전환 후 anon INSERT 제거) | `docs/BUSINESS_REVIEW.md` BR-14 잔여 |
| 결제 | Toss 대시보드 웹훅 URL 등록 · 현금영수증 자동발급 설정 | 오너 액션 |
| 알림 | Hourly cron 복원(GitHub PAT workflow scope) 또는 Vercel Pro cron 전환 | `CLAUDE_HANDOFF.md §26.2` |
| 요금 | 번들 할인(#17) 할인율 결정 | Q1 미결 |
| 정산 | PG 지급대행 연동, 선생 등급·인센티브(#3) | 외부 계약 후 |
| 모바일 | 스토어 제출 (계정 삭제 UI 완료) | 오너 결정 |
| UX | `Lesson.cancelledBy`/`StudyPlan.source`/`ManagerCareLog.type`/`SatisfactionCheckin.trigger` enum 2차 전환 | 소소한 부채 |
| 정보 | 이력 UX에서 매니저 상담 목록 이력 표시 개선 (현재 최신/open 위주) | 소소한 부채 |

---

<a id="part-4"></a>
## Part 4 — 다음 작업 백로그 (우선순위)

> 각 항목: **선행조건 / 참조 문서 / 예상 난이도(S·M·L)**. 오너 결정 필요 항목은 `Q#`로 표기.

### 4.1 P0 — 파일럿 오픈 전 반드시

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P0-1 | Toss 대시보드에 웹훅 URL 등록 `https://tutormatch-web.vercel.app/api/webhooks/toss` | 오너 액션 | `CLAUDE_HANDOFF.md §25.2` | S |
| P0-2 | 사업자 등록 → terms/privacy/refund `[기재 예정]` **8곳** 채우기 + 푸터 CMS `company_*` 키 반영 | Q4 | `CLAUDE_HANDOFF.md §25.1b`, `docs/internal/LEGAL_DOCS_STATUS.md` | S |
| P0-3 | 법률 문서 3종 변호사 검토 결과 반영 | Q1 | `docs/internal/LEGAL_ADVISORY_MEMO.md` | M |
| P0-4 | 29 커밋 배포 승인 → `git push origin main` | 오너 결정 | (n/a) | S |
| P0-5 | 프로덕션 스모크: 가입(보호자 동의)→상담→매칭(matchReason)→수락→첫 수업→숙제 자동 분배→수업 자동 완료→월간 리포트 관통. 결제는 Toss 테스트 키로 confirm+웹훅 경로 확인 | P0-4 | `CLAUDE_HANDOFF.md §26.3 #4` | M |
| P0-6 | Supabase 대시보드에서 `question-images` 등 버킷의 anon INSERT 정책 제거 | 스토리지 서버 경유 완료(§25.1f) | `CLAUDE_HANDOFF.md §26.3` | S |
| P0-7 | 비밀번호 재설정 플로우 (SMS OTP 또는 매니저 리셋 링크) | (설계 결정) | `docs/PRODUCT_DESIGN_TRACKER.md` | M |

### 4.2 P1 — 파일럿 중 데이터·전환

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P1-1 | GA4 이벤트 계측 (`AnalyticsEvent` DB 이벤트와 이중 계측 or 대체) | — | `src/lib` 이벤트 로직 | M |
| P1-2 | 카카오 비즈니스 채널 개설 → (a) 알림톡 템플릿 심사 후 env 설정 (b) 카카오 로그인 KakaoProvider (c) 채널 플로팅 버튼 | Q4 (사업자) | `CLAUDE_HANDOFF.md §26.2 #1` | M |
| P1-3 | Hourly 알림 복원: GitHub PAT `workflow` scope 부여 또는 Vercel Pro cron 전환 | 오너 결정 | `CLAUDE_HANDOFF.md §26.2 #2` | S |
| P1-4 | 번들 할인(#17) 할인율 결정 후 `pricing-plans.ts` 규칙 + `planIdFromAmount` 갱신, 웹훅 금액 검증과 정합 | Q1 | `CLAUDE_HANDOFF.md §26.1` | M |
| P1-5 | 리뷰 별점 정책 확정 후 Testimonial UI 반영 | 정책 결정 | `docs/PRODUCT_DESIGN_TRACKER.md` | S |
| P1-6 | 커스텀 도메인 연결 | 도메인 확보 | — | S |

### 4.3 P2 — 확장·성숙

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P2-1 | 모바일 앱 스토어 제출 (계정 삭제 UI 완료, journey MATCH_PENDING_ACCEPT 반영 완료) | 오너 결정 | `CLAUDE_HANDOFF.md §23 Phase 4` | L |
| P2-2 | 선생 정산 PG 지급대행 연동 | 외부 계약 | `CLAUDE_HANDOFF.md §26.1 Q3` | M |
| P2-3 | 선생 등급·인센티브(#3) — Teacher 활동 통계, 계약서 등급 조항 | Q3 | `CLAUDE_HANDOFF.md §24.3 #3` | M |
| P2-4 | 웹/앱 채널 역할(#29) — 학부모 앱 여부 결정 | 오너 결정 | `CLAUDE_HANDOFF.md §24.3 #29` | 결정 |
| P2-5 | 소소한 enum 2차 전환 (`Lesson.cancelledBy` 등) | — | `CLAUDE_HANDOFF.md §26.3` | S |
| P2-6 | 매니저 상담 목록 이력 UX 개선 | — | `CLAUDE_HANDOFF.md §26.3` | S |
| P2-7 | `Question` DEPRECATED 테이블 실제 제거(검증 후) | 관측 기간 후 | `CLAUDE_HANDOFF.md §25.1f` | S |

### 4.4 오너 미결 질문 승계

`CLAUDE_HANDOFF.md §23`의 Q1(변호사 진행중), Q2(✅ A안 확정 완료), Q3(✅ 시급 3만 확정, PG 지급대행 잔여), Q4(사업자 정보 미확보 — 상호만 "콘코드"), Q5(✅ 해소), Q6(서비스 지역 명시 여부 미결).

---

<a id="part-5"></a>
## Part 5 — 문서 지도 · 세션 로그

### 5.1 문서 지도 (원본: `docs/README.md`)

| 계층 | 문서 | 위치 |
|---|---|---|
| 마스터 진입점 | 이 파일 (`HANDOFF.md`) | 루트 |
| 세션 로그·이연 스펙 원본 | `CLAUDE_HANDOFF.md` (§25~§26) | 루트 |
| 하네스 원본 | `CLAUDE.md`, `AGENTS.md` | 루트 |
| 문서 지도 | `docs/README.md` | `docs/` |
| 기술 개요 | `docs/internal/TECH_OVERVIEW.md` | `docs/internal/` |
| API 레퍼런스 | `docs/internal/API_REFERENCE.md` (110 라우트) | `docs/internal/` |
| 법률 현황 | `docs/internal/LEGAL_DOCS_STATUS.md` | `docs/internal/` |
| 계약 초안 | `docs/internal/contracts/*.md` | `docs/internal/contracts/` |
| 법률 자문 메모 | `docs/internal/LEGAL_ADVISORY_MEMO.md` (AI 임시) | `docs/internal/` |
| 사업계획서 (PSST) | `docs/external/BUSINESS_PLAN_PSST.md` | `docs/external/` |
| 재무계획 | `docs/external/FINANCIAL_PLAN.md` | `docs/external/` |
| 사업·마케팅·리스크 | `docs/BUSINESS_REVIEW.md` | `docs/` |
| 제품·디자인 트래커 | `docs/PRODUCT_DESIGN_TRACKER.md` | `docs/` |
| 프로젝트 목표 | `docs/project-goals.md` | `docs/` |
| 구현 계획 (활성) | `docs/IMPLEMENTATION_PLAN_2026-07.md` | `docs/` |
| 세션별 구현 기록 (활성) | `docs/IMPLEMENTATION_SESSIONS_REVISED.md` | `docs/` |
| 매니저 운영 가이드 | `docs/MANAGER_GUIDELINES.md` | `docs/` |
| 사진 프롬프트 | `docs/PHOTO_GENERATION_PROMPT.md` (작업 보류) | `docs/` |
| 디자인 시스템 원본 | `design handoff/DESIGN_SYSTEM.md` (+ HTML 시안, `tokens-reference.css`) | `design handoff/` |

**루트 정리 권고(미실행)**: `concord_bizplan.docx`, `concord_bizplan.docx.bak`, `concord_bizplan.rtf`, `Concord_사업계획서_2026.docx`는 구버전 산출물. `Concord_사업계획서_2026.md`가 원본이며 PSST 버전(`docs/external/BUSINESS_PLAN_PSST.md`)이 이를 계승. 오너 확인 후 삭제·아카이브 이동.

### 5.2 세션 로그

> 세션 종료 시 이 절에 **append**한다. 형식은 `CLAUDE_HANDOFF.md §25.1x`를 승계 — 헤더 `### 세션 로그 · YYYY-MM-DD (제목)` + 완료 항목 · 검증 · 미해결.

### 세션 로그 · 2026-07-04 (핸드오프 재정비)

- ✅ **`HANDOFF.md` 신설** (루트) — Part 0(AI 운영 하네스) · Part 1(온보딩) · Part 2(시스템 지도, 원본 참조) · Part 3(스냅샷) · Part 4(백로그) · Part 5(문서 지도 + 세션 로그 자리) 구조로 작성.
- ✅ **`CLAUDE_HANDOFF.md` 최상단 5줄 안내 블록만 추가** — 기존 §0~§26 내용은 일절 수정하지 않았음.
- ✅ **CLAUDE_HANDOFF 대비 갱신된 사실 (구버전 표기 병기)**:
  - API 라우트 수: 58 → **110** (`docs/internal/API_REFERENCE.md` 실측, `src/app/api/**/route.ts` 파일 카운트 일치).
  - 마이그레이션: 9개 → **25개** 실측 리스트로 대체 (`prisma/migrations/` 실측).
  - 요금제: v1(회당/과목) → **v2(시간제 월정액 8종)**. `PRICING_PLANS_V2` 진실의 원천, v1은 `planIdFromAmount` 역매핑에서만 존재.
  - 결제 검증: "orderId만" → **Toss confirm 서버 검증 + 웹훅 재검증**.
  - 매칭 상태: 즉시 active → **`matchStatus: PENDING_STUDENT_ACCEPT` → 학생 수락 시 ACTIVE**, `matchReason` 필드.
  - 상담: 학생 1건 → **이력 다행**(`consultation-current.ts` 헬퍼).
  - QnA: `Question` + `QuestionMessage` 이원화 → **`QuestionMessage` 단일 저장소**. `Question`은 DEPRECATED로 존치.
  - CHIEF_MANAGER: Prisma 주석 누락 → **`UserRole` enum에 정식 반영**.
  - Storage: 브라우저 anon 업로드 → **서버 라우트 경유** (`/api/student/question-images` 등).
  - Cron: hourly GitHub Actions → **daily만** (hourly는 PAT scope 문제로 제거, 라우트는 `x-vercel-cron` 지원).
  - 정산·빌링·계정삭제·감사로그·환불·일시정지·만족도·케어로그·상담 리포트 전부 **구현 완료** — 원본 §18의 "❌ 미구현"·§22의 "부분" 서술은 구버전 표기로 남기고 이 문서에서 재분류.
- ✅ **실측한 사실**: 로컬 `main`이 `origin/main`보다 **29 커밋 앞섬**. 법률 페이지 `[기재 예정]` **8곳** (terms/privacy/refund 각 파일에서 grep). 프로젝트 총 마이그레이션 25개, API 라우트 110개.
- ✅ **검증**: 새 문서 2건(신규 + 5줄 프리앰블). 코드 변경 없음이므로 `tsc/lint` 실행 대상 없음. `git status` 클린 유지.
- ⚠️ 미해결(다음 세션): [Part 4 · 백로그](#part-4) 참조. 특히 P0-1~P0-7이 파일럿 오픈 전 필수.

---

**끝.** 이 문서를 갱신했다면 [세션 로그](#part-5)에 엔트리를 append하고, 커밋은 오너 요청이 있을 때만 만든다.
