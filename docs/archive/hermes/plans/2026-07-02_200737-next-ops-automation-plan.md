# 운영 자동화 및 남은 구현 작업 계획

> **For Hermes:** Use Claude Code only. Do not use Codex CLI. Implement task-by-task, verify, commit, then continue.

**Goal:** 현재 완료된 결제/매칭/첫수업/부모 연락처/월간 리포트 기반 위에, 남은 운영 자동화와 학습 그래프 데이터 흐름을 안전하게 완성한다.

**Architecture:** 이미 `src/lib/run-alert-checks.ts`와 `/api/cron/check-alerts`가 있으므로 새 스케줄러를 만들지 않고 기존 alert check 구조에 작은 체크들을 추가한다. `StudySession`은 추정치가 아니라 완료된 `Lesson`에서만 생성해 학습 그래프 신뢰도를 유지한다.

**Tech Stack:** Next.js App Router, Prisma, PostgreSQL/Supabase, Expo mobile API, Vercel Cron style API, TypeScript.

---

## 0. 현재 상태

### 커밋/검증 상태

작업 트리:
- clean

방금 확인한 검증:
- `npm run lint` 통과
- `npx tsc --noEmit` 통과
- `npm run build` 통과
- `prisma migrate deploy`: pending migration 없음

최근 핵심 커밋:
- `36b26dd feat(reports): generate deterministic monthly reports`
- `7b32c28 feat(consultation): capture parent contact for managers`
- `857dda8 fix(payments): harden Session-2 payment — Toss server confirm, mobile 501`
- `d0d3c5e feat(ops): 결제 완료 공통화·멱등성, 선생님 승인 페이지, 폰트 변수 수정`
- `04897d7 feat(teacher): 주간 숙제 자동 분배 및 지난 주 템플릿 재사용`
- `6517989 feat(teacher): 첫 수업 일정 설정 및 FIRST_LESSON_PENDING 단계 추가`
- `345c9b7 feat(matching): 학생이 선생님 배정을 직접 수락해야 활성화되도록 변경`

### 완료된 세션

- Session 1: 법률 문서/작은 고지/부모 연락처 일부 완료
- Session 2: Toss 서버 confirm, 결제 검증, 모바일 fake 결제 차단 완료
- Session 3: 학생 수락 only 매칭 플로우 완료
- Session 4: 첫 수업 설정 및 journey 정합성 완료
- Session 5: 부모님 연락처 매니저 전달 완료
- Session 6 일부: 월간 리포트 deterministic 생성 완료

### 남은 핵심

1. Session 6 잔여: 학습 그래프용 `StudySession` 쓰기 경로
2. Session 7: 운영 자동화 1차
   - 수락 대기 리마인더
   - 수락 후 첫 수업 미설정 리마인더
   - 수업 전 리마인더
   - 미답변 QnA 감시 확장
   - 구독 만료 리마인더
3. Session 8: 숙제 템플릿/append 분배 최종 점검

---

## 1. 다음 실행 순서

## Task 1 — `run-alert-checks` 구조 감사 및 중복 방지 패턴 확인

**Objective:** 기존 알림 중복 방지 방식과 notification type 구조를 파악한다.

**Files:**
- Read: `src/lib/run-alert-checks.ts`
- Read: `src/lib/notifications.ts`
- Read: `src/lib/notification-category.ts`
- Read: `src/app/api/cron/check-alerts/route.ts`
- Read: `prisma/schema.prisma`

**Implementation note:**
- 변경 없이 감사만 한다.
- 중복 방지는 기존 `Notification`의 `type`, `relatedId`, `createdAt` 조회 패턴을 재사용한다.
- 새 테이블은 만들지 않는다.

**Verification:**
- 변경 없음.
- 다음 task 전에 `git status --short`가 clean인지 확인.

---

## Task 2 — 지난 수업 완료 전환 + `StudySession` 생성

**Objective:** `Lesson.status = SCHEDULED`인 과거 수업을 `COMPLETED`로 전환하고, 해당 수업의 실제 `durationMin`만 `StudySession`에 반영한다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Possibly modify: `src/lib/notifications.ts` only if existing type이 부족할 때
- Prisma models used: `Lesson`, `StudySession`

**Required behavior:**
1. `Lesson.status === "SCHEDULED"`
2. `Lesson.startAt + durationMin`이 현재보다 충분히 과거일 때만 완료 처리
   - 권장 buffer: 12시간
3. 완료 처리와 동시에 같은 학생/날짜에 `StudySession`을 생성 또는 업데이트
4. 임의 과제 시간 추정 금지
5. `StudySession.minutes = lesson.durationMin`
6. 같은 lesson을 여러 번 처리해도 중복 분이 쌓이지 않게 해야 함

**Design decision needed by implementer:**
- `StudySession` 스키마에 lesson/source 식별자가 없으면 완전한 idempotency가 어렵다.
- 우선 선택지:
  - A안: `StudySession`에 `source String?`, `sourceId String?` 추가 + unique 도입
  - B안: 날짜별 lesson duration 합계를 재계산해 해당 날짜 `StudySession`을 set 방식으로 upsert
- 추천: 마이그레이션을 늘리지 않으려면 B안. 단 기존 수동 study session이 있다면 덮어쓰기 위험 확인 필요.

**Verification:**
- `npx prisma validate`
- `npm run lint`
- `npx tsc --noEmit`
- 가능하면 `npm run build`

**Commit:**
- `feat(alerts): close past lessons into study sessions`

---

## Task 3 — 수락 대기 매칭 리마인더

**Objective:** 학생이 배정 선생님을 수락하지 않고 방치하는 경우 학생/매니저에게 인앱/푸시 알림을 보낸다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Modify: `src/lib/notifications.ts` if notification type 추가 필요

**Required behavior:**
1. pending match 조건 확인
   - 현재 구현의 실제 필드 확인 필요: `TeacherStudent.isActive === false`, `matchStatus`가 있으면 `PENDING_STUDENT_ACCEPT`
2. 생성 후 24시간 이상 지난 pending match 대상
3. 학생에게 `MATCH_ACCEPT_REMINDER` 또는 기존 타입 재사용
4. 담당 매니저에게도 필요 시 알림
5. `relatedId = match.id` 또는 `studentId:matchId`로 중복 방지

**Constraints:**
- 학생 거절/재배정 CTA 만들지 말 것.
- 알림 문구도 “수락해 주세요”만.

**Verification:**
- lint/typecheck/build

**Commit:**
- `feat(alerts): remind pending match acceptance`

---

## Task 4 — 첫 수업 미설정 리마인더

**Objective:** 학생이 수락했는데 선생님이 첫 수업을 설정하지 않은 경우 선생님/매니저에게 알림을 보낸다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Modify: `src/lib/notifications.ts` if type 추가 필요

**Required behavior:**
1. active teacher-student match 존재
2. `Lesson`이 없거나 `lessonType = FIRST`가 없음
3. 수락 시점 `respondedAt` 기준 48시간 이상 경과
4. 선생님에게 첫 수업 설정 요청
5. 매니저에게 follow-up 알림
6. 중복 방지

**Verification:**
- lint/typecheck/build

**Commit:**
- `feat(alerts): remind first lesson scheduling`

---

## Task 5 — 수업 전 리마인더

**Objective:** 예정 수업 24시간 전/1시간 전 학생과 선생님에게 알림을 보낸다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Modify: `src/lib/notifications.ts` if type 추가 필요
- Possibly modify: `vercel.json` if cron 주기가 하루 1회면 시간 단위로 상향 필요

**Required behavior:**
1. `Lesson.status === "SCHEDULED"`
2. `startAt`이 24h±30m 또는 1h±30m 범위
3. 학생/선생님에게 알림
4. `relatedId = lesson.id:24h` / `lesson.id:1h` 식으로 중복 방지

**Risk:**
- 현재 cron이 하루 1회라면 1시간 전 리마인더가 의미 없음.
- 이 경우 `vercel.json` cron 주기 확인 후, 시간별 실행으로 바꿀지 결정.
- 시간별 전환 시 기존 일일 체크가 과발송되지 않는지 확인 필요.

**Verification:**
- lint/typecheck/build

**Commit:**
- `feat(alerts): add lesson reminders`

---

## Task 6 — 구독 만료 리마인더

**Objective:** 구독 만료 전 학생에게 연장 안내를 보낸다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Possibly modify: `src/lib/notifications.ts`

**Required behavior:**
1. active subscription `periodEnd` 기준 D-5, D-1
2. 학생에게 알림
3. 결제 링크는 기존 `/pricing` 또는 `/checkout` 흐름 재사용
4. 자동결제/빌링키는 구현하지 않음

**Verification:**
- lint/typecheck/build

**Commit:**
- `feat(alerts): remind subscription expiry`

---

## Task 7 — 미답변 QnA 감시 확장

**Objective:** 기존 `Question` 기반 미답변 감시가 모바일 채팅형 `QuestionMessage` 흐름도 감시하도록 확장한다.

**Files:**
- Modify: `src/lib/run-alert-checks.ts`
- Possibly modify: `src/lib/notifications.ts`

**Required behavior:**
1. 학생-선생님 스레드별 마지막 메시지를 확인
2. 마지막 메시지가 학생 발화이고 24시간 이상 경과
3. 선생님과 담당 매니저에게 알림
4. 기존 `QUESTION_UNANSWERED` 타입 재사용 가능하면 재사용
5. 중복 방지

**Verification:**
- lint/typecheck/build

**Commit:**
- `feat(alerts): monitor unanswered qna messages`

---

## Task 8 — Session 8 숙제 템플릿/append 분배 점검

**Objective:** 이미 구현된 숙제 자동 분배가 기존 학생 계획을 덮어쓰지 않는지 최종 확인하고, 부족한 경우 보완한다.

**Files:**
- Read/modify: `src/app/api/teacher/students/[id]/homework-distribution/route.ts`
- Read/modify: `src/components/teacher-portal/TeacherStudentPlanTab.tsx`
- Prisma models: `StudyPlan`, `StudyTask`, possible `HomeworkTemplate`

**Required behavior:**
1. 기존 학생 태스크 삭제 금지
2. 완료한 태스크 삭제 금지
3. 선생님이 준 숙제와 학생 태스크 구분 가능
4. 템플릿 재사용 가능 여부 확인

**Verification:**
- lint/typecheck/build
- 가능하면 ad-hoc route-level verification

**Commit:**
- 필요 시 `fix(homework): preserve student tasks during distribution`

---

## 2. 실행 정책

- Codex CLI 사용 금지.
- Claude Code만 사용.
- 한 번에 한 task만 위임.
- Claude Code가 `max_turns`로 끊기면 즉시 `git status`, `git diff`, `git log` 확인 후 partial change 정리.
- 각 task 후 반드시:
  1. `git status --short`
  2. `npm run lint`
  3. `npx tsc --noEmit`
  4. 가능하면 `npm run build`
  5. Conventional Commit
- 푸시는 하지 않음.

---

## 3. 다음에 바로 실행할 첫 작업

다음 실행은 Task 1 + Task 2를 한 세션으로 묶지 말고 분리한다.

가장 먼저:

```text
Audit run-alert-checks and notification idempotency patterns only. Do not edit.
```

그 다음:

```text
Implement closePastLessons + StudySession real-data write path only.
```

이 순서가 중요한 이유:
- 학습 그래프가 항상 0인 문제는 `StudySession` 쓰기 경로 부재가 원인이다.
- 그러나 수업 완료 전환 없이 `StudySession`만 만들면 데이터 신뢰가 깨진다.
- 따라서 “과거 수업 완료 전환 → 완료 수업 기반 StudySession 생성”을 먼저 해결해야 한다.
