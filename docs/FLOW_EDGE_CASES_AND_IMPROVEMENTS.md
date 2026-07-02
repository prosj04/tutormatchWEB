# 플로우 Walk-through 엣지케이스 & 구조적 개선안

> 작성: 2026-07-02 · 방법: 실제 라우트·lib 코드 실측 walk-through (추측 아님 — 모든 항목에 파일:라인 근거)
> 선행 문서: `docs/IMPLEMENTATION_PLAN_2026-07.md` — 이 문서의 지시는 그 계획의 P1(§3.2) 범위를 구체화·정정한다.

## ⚠️ 계획 문서 대비 현행화 노트 (먼저 읽을 것)

작업 트리 코드는 핸드오프(§22.2)보다 이미 앞서 있다:

- `POST /api/manager/matches`는 이미 **`isActive: false`로 매칭을 생성**하고 학생에게 "앱에서 수락" 알림을 보낸다 (`src/app/api/manager/matches/route.ts:92-94`).
- **모바일 수락 API가 이미 존재**: `POST /api/mobile/matches` (`src/app/api/mobile/matches/route.ts:55`), 앱 수락 버튼도 구현됨 (`mobile/app/consult/match.tsx:129`).

따라서 계획 문서의 B1·B6·B7(수락)은 절반 완료 상태다. **그러나 거절·취소·재배정이 전부 없어서, 절반 구현이 아래 데드락들을 만들었다.** 이 문서의 지시가 우선한다.

---

# Part 1 — 시나리오 Walk-through 엣지케이스

## EC-1. 학생이 배정된 선생님을 거절하면? → 거절 수단이 없고, 매니저도 되돌릴 수 없다 (데드락)

**시나리오**: 매니저가 대면 상담에서 선생님 A를 배정 → 학생이 앱에서 A의 프로필을 보고 마음에 안 듦 → ?

**현재 코드 동작**:
- 앱 `consult/match.tsx`에는 **"이 선생님 수락하기" 버튼만 있다**. 거절 버튼·API가 없다 (`src/app/api/mobile/matches/route.ts` POST는 수락만).
- 학생이 수락 안 하고 방치하면 `TeacherStudent`는 `isActive: false`로 영구 잔류.
- 매니저가 선생님 B로 바꾸려 해도 `POST /api/manager/matches`가 **`findFirst({ where: { studentId } })`로 pending 행까지 잡아 409** `"이미 배정된 선생님이 있는 학생입니다"`를 낸다 (`src/app/api/manager/matches/route.ts:73-81`).
- 매니저 포털에는 매칭 삭제/취소 API가 없다 (Admin `/api/admin/matches`에만 CRUD 존재).

**결과**: 학생이 첫 제안을 수락하지 않으면 그 학생은 **영원히 재매칭 불가**. Admin이 DB를 만져야 풀린다.

**지시**:
1. `POST /api/mobile/matches`에 `action: "decline"` + `reason?` 지원 추가 (기존 body 하위호환: action 없으면 accept). 거절 시 계획 문서 §2.1의 `matchStatus: "DECLINED"` 기록, 매니저에게 `MATCH_DECLINED` 알림.
2. `DELETE /api/manager/matches/[id]` 신규 — 본인 담당(`ManagerStudent`) 학생의 `isActive: false`(미수락) 매칭만 삭제 가능. active 매칭은 Admin 전용 유지.
3. `POST /api/manager/matches`의 중복 체크를 `where: { studentId, isActive: true }` + `matchStatus: "PENDING_STUDENT_ACCEPT"`로 좁히고, DECLINED 행은 `@@unique([teacherId, studentId])` 충돌 방지를 위해 upsert로 재활성화.
4. 앱 `consult/match.tsx`에 "다른 선생님 요청하기"(거절) 보조 버튼 추가.

## EC-2. 2과목 결제 학생은 두 번째 선생님을 배정받을 수 없다

**시나리오**: 학생이 `/checkout?sessions=8&subjects=2`로 **2과목 요금(월 144만원)을 결제** → 매니저가 수학 선생님 배정 → 영어 선생님 배정 시도 → **409**.

**현재 코드 동작**: EC-1과 같은 체크(`manager/matches/route.ts:73-81`)가 과목 무관하게 학생당 매칭 1개만 허용. 요금제는 2과목을 팔지만(`pricing-plans.ts` `4-2`/`8-2`) 매칭 계층은 1선생님만 지원.

**지시**: 중복 체크를 (studentId, 과목 겹침) 기준으로 변경 — 신규 매칭 subjects와 기존 active/pending 매칭 subjects의 교집합이 있을 때만 409. `Subscription.plan`의 과목 수(`*-2`)를 초과하는 3번째 매칭은 경고만 (하드 블록은 하지 않음 — 매니저 재량 보존, CLAUDE.md 북극성 5번).

## EC-3. 웹으로만 가입한 학생은 수락 자체가 불가능하다

**시나리오**: 학부모가 PC 웹으로 가입·결제 → 상담 완료 → 매니저가 선생님 배정 → 웹 알림: *"앱에서 선생님 정보를 확인하고 수락해 주세요"* (`manager/matches/route.ts:123`) → **앱이 없다**.

**현재 코드 동작**: 수락 API는 `requireMobileStudent`(모바일 JWT) 전용 (`src/app/api/mobile/matches/route.ts:9`). 웹에는 수락 UI·API 모두 없음. 웹 `/dashboard`는 `isActive: true` 매칭을 요구하므로 이 학생은 **`/dashboard/consultation`의 "매칭 진행 중" 화면에 영구 고착**된다.

**지시**:
1. 수락/거절 로직을 `src/lib/match-response.ts`로 추출 (계획 문서 B7과 동일 방향).
2. 웹용 `POST /api/student/match-response` 신규 (`requireStudent` 가드, body `{ matchId, action, reason? }`).
3. `ConsultationBookingPage`(웹 상담 화면)에 pending 매칭 존재 시 선생님 카드 + 수락/거절 버튼 렌더링. 데이터는 `GET /api/consultation/my-booking` 응답에 `pendingMatch` 필드를 추가해 내려줌.

## EC-4. 제안 시점에 선생님은 "학생이 배정되었다"는 알림을 받지만, 포털에서 그 학생이 안 보인다

**시나리오**: 매니저가 배정 → 선생님에게 `NEW_STUDENT_ASSIGNED` "새로운 학생이 배정되었습니다" 즉시 발송 (`manager/matches/route.ts:111-118`) → 선생님이 포털 '담당 학생' 진입 → **학생 없음**.

**현재 코드 동작**: `GET /api/teacher/students`는 `isActive: true`만 조회 (`src/app/api/teacher/students/route.ts:12`). 수락 전 학생은 비노출. 수락 시점에 **같은 타입의 알림이 한 번 더** 발송된다 (`mobile/matches/route.ts:87-93` — "학생이 배정 선생님을 수락했습니다").

**지시**:
1. 제안 시점 선생님 알림을 신규 타입 `MATCH_PROPOSED_TEACHER`("매칭 제안됨 — 학생 수락 대기 중")로 교체, 수락 시점 알림만 `NEW_STUDENT_ASSIGNED` 유지.
2. `GET /api/teacher/students` 응답에 pending 학생을 `status: "PENDING"` 구분자와 함께 포함 (이름·과목만, 플랜·질문 접근은 여전히 `requireTeacherStudentMatch`가 차단 — 수정 불필요, `src/lib/teacher-student-match.ts:9-16`이 이미 `isActive: true`만 통과).
3. `TeacherStudentsManager.tsx`에 "수락 대기" 뱃지 섹션 추가.

## EC-5. 결제했는데 Chief 매니저가 없으면? → 503 이후 영구 재시도 불가 버그

**시나리오**: Chief 미설정 상태에서 학생 결제 → `/api/payments/complete` 503 → 운영자가 Chief 설정 → 학생(또는 success 페이지)이 재시도 → **500. 영원히 실패.**

**현재 코드 동작** (`src/lib/student-payment.ts`):
1. 최초 호출: `PaymentCompletion(orderId, status: "PROCESSING")` 생성(:94) → `assignChiefManagerToStudent()`가 `NO_DEFAULT_MANAGER` throw → catch에서 `status: "FAILED"` 마킹(:152-156) → 503.
2. 재시도: `existingCompletion.status === "FAILED"`는 **분기 처리가 없어**(:78-90은 COMPLETED/PROCESSING만) 코드가 `create`(:94)로 진행 → `orderId` `@unique` 위반 **P2002** → catch → rethrow → **500**.

돈은 토스에서 빠져나갔는데(위젯 결제 완료) 구독·배정은 없고, 같은 orderId로는 복구가 불가능하다.

**지시**:
1. `completeStudentPayment()`에 FAILED 분기 추가: `existingCompletion?.status === "FAILED"`이면 `update`로 `status: "PROCESSING"` 재전환 후 기존 플로우 계속 (create 대신).
2. `GET /api/admin/payments/incomplete` 신규 — `PaymentCompletion.status in ("FAILED","PROCESSING")` 목록 + `POST /api/admin/payments/[orderId]/retry` (requireAdmin). Admin 대시보드에 미완료 결제 카운트 표시.
3. success 페이지(`SuccessPaymentComplete.tsx`)에서 503/500 시 orderId를 localStorage에 보관하고 `/dashboard/consultation` 진입 시 자동 재시도 1회.

## EC-6. 학생이 수락도 안 했는데 "수업 시작일"이 이미 박혀 있고, 아무도 감시하지 않는다

**시나리오**: 매니저가 7/2에 배정(기본 `startDate = today`, `manager/matches/route.ts:48-49`) → 학생이 앱을 안 열어 1주 방치 → 7/9가 되어도 시스템은 아무 것도 하지 않는다.

**현재 코드 동작**: Cron(`run-alert-checks.ts`)은 미답변 질문·주간 진도·WAITING 상담만 검사. **pending 매칭·수락 후 첫수업 미설정은 검사 항목에 없음**. 학생이 앱 푸시 1회(`TEACHER_ASSIGNED`)를 놓치면 후속 신호 제로.

**지시** (`src/lib/run-alert-checks.ts`에 체크 2개 추가):
1. `checkStalePendingMatches()`: `TeacherStudent(isActive: false, createdAt < now-24h)` → 학생에게 푸시 재알림(`MATCH_ACCEPT_REMINDER`) + 담당 매니저에게 알림. 48h 경과 시 매니저에게 "재매칭 검토" 알림. 24h 중복 방지는 기존 미답변 질문 패턴 재사용.
2. `checkFirstLessonNotSet()`: `isActive: true`인데 해당 (teacherId, studentId)의 `Lesson`이 0건이고 수락(`respondedAt`) 후 48h 경과 → 선생님 + 매니저 알림.
3. `startDate`는 제안 시점에 넣지 말 것 — `manager/matches` POST에서 `startDate` 기본값을 빈 의미로 두거나(제안일 기록은 `createdAt`이 이미 있음) 첫수업 API가 갱신하는 현행 동작(`first-lesson/route.ts:108-114`)에 위임.

## EC-7. 수업이 시작된 뒤 first-lesson API를 다시 호출하면 과거 수업 기록이 덮어써진다

**시나리오**: 첫 수업(7/5) 완료 → 2주 후 선생님이 "다음 수업 일정을 바꾸려고" 첫수업 설정 화면을 다시 사용 → **7/5의 수업 레코드가 새 날짜로 UPDATE**되어 이력이 사라진다.

**현재 코드 동작**: `first-lesson/route.ts:78-85`가 `findFirst({ status: { not: "CANCELLED" } }, orderBy: { startAt: "asc" })` — **가장 이른 수업**(이미 지난 수업 포함)을 잡아 update한다. 또한 `Lesson.status`를 `COMPLETED`로 바꾸는 코드가 어디에도 없어 모든 수업이 영원히 `SCHEDULED`다.

**지시**:
1. 계획 문서 §2.4 `lessonType: "FIRST"` 적용 후, first-lesson API는 `lessonType: "FIRST"` && `startAt > now` 인 수업만 update, 과거 FIRST 수업이 있으면 409 `"첫 수업이 이미 진행되었습니다"` 반환.
2. Cron에 `closePastLessons()` 추가: `status: "SCHEDULED"` && `startAt + durationMin < now-12h` → `COMPLETED` 일괄 전환.

## EC-8. 이미 담당 매니저와 상담을 끝낸 학생이 결제하면 담당이 Chief로 강제 교체된다

**시나리오**: 상담 신청 → 매니저 M 배정 → 방문 상담 `COMPLETED` → 매칭 대기 중 학생이 그제서야 결제 → `assignChiefManagerToStudent()`가 **booking을 무조건 `managerId: chief, status: "ASSIGNED"`로 UPDATE** (`src/lib/student-enrollment.ts:146-157`).

**결과**: ① 상담을 진행한 M이 학생을 잃음 (`ManagerStudent`에 M 링크는 남지만 booking 주인은 chief), ② 상담 상태가 `COMPLETED → ASSIGNED`로 **역행**해 학생 화면이 "선생님 매칭 진행"에서 "매니저 배정 완료"로 되돌아감, ③ Chief는 이미 상담이 끝난 학생에게 "담당 학생 배정" 알림을 받고 중복 상담을 준비하게 됨.

**지시**: `assignChiefManagerToStudent()` 수정 — `existing.managerId`가 있으면 **기존 매니저·상태 유지** (booking은 건드리지 않고 `ManagerStudent` upsert와 알림만 기존 매니저에게). `existing.status === "COMPLETED"`도 역행 금지. Chief 교체는 `managerId == null`(WAITING)일 때만.

## EC-9. `CHIEF_MANAGER_EMAIL` 오타 시 임의의 매니저에게 소리 없이 배정된다

**시나리오**: env에 `chief@concrod.local`(오타) 설정 → 결제 학생 유입 → `getChiefManager()`가 email 매치 실패 → CHIEF_MANAGER 역할 검색 → 이름 "Chief" 검색 → **`getDefaultManager()` = 가장 먼저 등록된 매니저** (`src/lib/chief-manager.ts:34-49`, `default-manager.ts:17-21`). 유료 학생 전원이 잘못된 매니저에게 조용히 배정되고, 아무 로그·경고가 없다.

**지시**: `getChiefManager()`에서 `CHIEF_MANAGER_EMAIL`이 설정됐는데 email 매치가 실패하면 `console.error("[chief-manager] CHIEF_MANAGER_EMAIL set but no matching approved manager: " + chiefEmail)` 로깅 + Admin에게 1일 1회 `OPS_CONFIG_WARNING` 알림 (Cron에서 검사). 폴백 자체는 유지 (서비스 중단보다 낫다).

## EC-10. 상담 `COMPLETED` 학생은 매칭이 안 된 채로 재상담을 신청할 수 없다

**시나리오**: 상담 완료 → 매니저가 적합한 선생님을 못 찾음 → 3주 경과 → 학생이 "다시 상담하고 싶다" → `createConsultationRequest()`가 `ALREADY_COMPLETED` throw (`src/lib/student-enrollment.ts:28-30`). `ConsultationBooking.studentId`가 `@unique`라 새 레코드도 불가.

**지시** (스키마 변경 없는 최소 수정): `COMPLETED`이고 **active 매칭이 0건**이면 기존 booking을 WAITING으로 리셋 허용 (CANCELLED 재신청과 동일 경로, `managerNote`에 이전 이력 append). active 매칭이 있으면 현행대로 거부. 근본 해결(1:N 이력화)은 계획 문서 P3-10 유지.

## 검토했으나 문제 없음 (참고)

- **수락 중복 탭/동시성**: `mobile/matches` POST가 `isActive` 확인 후 update라 두 번 눌러도 멱등. 문제 없음.
- **결제 시 방문시간 유실**: `assignChiefManagerToStudent`는 `visitPreferredTimes`를 보존한다 (`student-enrollment.ts:152`). 문제 없음.
- **미승인 선생님 매칭**: `manager/matches`가 `approved: true` 필터로 차단. 문제 없음.
- **토큰 지갑 미생성**: `getTokenWallet()`이 upsert로 lazy 생성 + 구독 플랜 반영 (`mobile-token-wallet.ts:33-37`). 문제 없음.

---

# Part 2 — 기존 기능 구조적 개선

## IMP-1. 숙제 자동 분배가 학생이 직접 짠 플랜을 통째로 삭제한다 — append 방식으로 전환

**사용자 행동 패턴**: 학생 대시보드의 핵심 기능이 "내가 태스크를 추가·완료·DnD 정렬"이다. 학생이 일주일치 자기 계획을 짜 놓았는데, 선생님이 숙제 분배를 실행하면 —

**현재 구조**: `homework-distribution/route.ts:155-163`이 기존 플랜에 `tasks: { deleteMany: {}, create: […] }` — 해당 날짜의 **모든 태스크(학생 본인 것 + 완료 기록 `isDone`/`doneAt` 포함)를 삭제**하고 숙제로 교체한다. 학생 입장에서는 내 계획과 완료 이력이 소리 없이 증발한다. 신뢰를 깨는 동작이고, 주간 완료율 모니터링(`manager-stats.ts`) 수치도 왜곡된다.

**지시**:
1. `deleteMany: {}` 제거 → 기존 태스크 뒤에 append: `create: dayTasks.map((title, i) => ({ title, order: maxExistingOrder + 1 + i }))`. 기존 플랜의 `order` 최댓값은 트랜잭션 전 조회에 `tasks: { select: { order: true } }` 추가로 확보.
2. 재분배(같은 주 다시 실행) 시 중복 방지: `StudyTask`에 `origin: "TEACHER" | "STUDENT"` 컬럼 추가(기본 `"STUDENT"`, 계획 문서 §2.3과 같은 마이그레이션에 포함), 분배 태스크는 `origin: "TEACHER"`로 생성하고 재분배 시 `deleteMany: { origin: "TEACHER", isDone: false }`만 삭제 — **완료한 숙제와 학생 태스크는 보존**.
3. 학생 대시보드 `TaskList`에서 `origin: "TEACHER"` 태스크에 "선생님" 뱃지 표시.

## IMP-2. 알림이 "1회성 인앱 벨"에 갇혀 있다 — 단계 전환마다 상태 기반 CTA로 전환

**사용자 행동 패턴**: 학생·학부모는 앱을 매일 열지 않는다. 수락 요청·첫수업 확정 같은 **행동이 필요한 이벤트**가 알림 벨 1회로 끝나면, 놓친 사용자는 EC-6처럼 플로우가 멈춘다. 반면 홈 화면은 매 접속 시 보게 된다.

**현재 구조**: 행동 요구 이벤트(수락 대기, 첫수업 미확정)가 `Notification` 레코드로만 존재. 앱 홈(`/api/mobile/home`)과 웹 대시보드는 journey stage 카피만 보여줄 뿐 **"지금 할 일" CTA가 없다**.

**지시**:
1. `GET /api/mobile/home`·`GET /api/mobile/me/journey` 응답에 `actionRequired` 필드 추가: 서버가 `{ type: "ACCEPT_MATCH" | "CONFIRM_FIRST_LESSON" | null, matchId?, lessonId? }`를 계산해 내려줌 (pending 매칭 존재 → ACCEPT_MATCH 등).
2. 앱 홈 상단에 `actionRequired` 배너 컴포넌트 (탭 시 `consult/match` 등으로 딥링크). 웹 `/dashboard/consultation`에도 동일 배너.
3. 이 구조로 EC-6의 Cron 리마인더는 "놓친 푸시 재발송"이 아니라 보조 수단이 된다 — 상태가 화면에 항상 떠 있으므로.

## IMP-3. 매니저 매칭 화면이 "생성"만 있고 "추적"이 없다 — 매칭 파이프라인 뷰

**사용자 행동 패턴**: 매니저의 실제 업무는 배정 후 "학생이 수락했나? 첫 수업은 잡혔나?"를 챙기는 것인데, 현재 매니저 포털 매칭 화면(`ManagerMatchingPage`)은 매칭 생성 폼 + 목록뿐이다. pending/수락/첫수업 여부를 보려면 학생마다 개별 확인해야 하고, EC-1의 방치 매칭은 눈에 띄지도 않는다.

**지시**:
1. `getManagerMatchingData()`(`src/lib/manager-portal-data.ts`)에 매칭별 파생 상태 추가: `PENDING_ACCEPT`(isActive=false) / `FIRST_LESSON_PENDING`(active, Lesson 0건) / `ACTIVE`(Lesson 1건+) + `createdAt` 기준 경과 시간.
2. `ManagerMatchingPage`를 3열 파이프라인(수락 대기 / 첫수업 대기 / 수업 중)으로 재구성, 24h+ 경과 항목에 경고 뱃지, 수락 대기 카드에 EC-1의 취소 버튼 배치.
3. 같은 데이터를 Admin `/admin/matches`에도 재사용.

## IMP-4. 미답변 감시가 웹 `Question`만 본다 — 앱 QnA(QuestionMessage)는 방치된다

**사용자 행동 패턴**: 앱 학생의 질문 동선은 QnA 채팅(`QuestionMessage`)이다. 선생님이 24h 안 보면 웹 질문은 Cron이 선생님·매니저를 찌르지만(`run-alert-checks.ts` 1번 체크), **앱 채팅 질문은 아무도 모른 채 썩는다**. 유료 사용자의 핵심 가치("선생님이 확인해 준다")가 앱에서만 깨진다.

**지시**: `run-alert-checks.ts`에 `checkUnansweredQnaMessages()` 추가 — 학생별·튜터별 마지막 메시지가 `sender: "me"`이고 24h 경과한 스레드 조회(`QuestionMessage` groupBy studentId+teacherId, 마지막 메시지 판정) → 해당 선생님 + 담당 매니저에게 `QUESTION_UNANSWERED` 알림 (기존 타입 재사용, relatedId에 studentId). 24h 중복 방지 로직은 기존 체크 1과 동일 패턴.

## IMP-5. 결제 → 배정까지가 클라이언트 fetch 1회에 매달려 있다 — 서버 주도 완결로 전환

**사용자 행동 패턴**: 결제 직후 사용자는 모바일 사파리에서 탭을 닫거나, success 페이지 로딩 중 이탈한다. 지금은 success 페이지의 `POST /api/payments/complete` fetch가 실패하면 **돈만 나가고 아무 일도 일어나지 않는다** (웹훅 없음, EC-5와 결합 시 복구도 불가).

**지시** (계획 문서 P0 E1–E3에 통합 실행):
1. E1 서버 confirm 구현 시 **Toss 웹훅 수신 라우트를 함께 추가**: `POST /api/payments/webhook` — 토스 `PAYMENT_STATUS_CHANGED`(DONE) 수신 → `orderId`로 `completeStudentPayment()` 호출 (멱등이므로 success 페이지와 중복 호출 안전). 서명 검증은 웹훅 시크릿 헤더.
2. `orderId`에 studentId를 인코딩 (`concord-{studentId}-{ts}` 형식, checkout에서 생성) — 웹훅은 세션이 없으므로 orderId만으로 학생 특정이 가능해야 한다. `payments/complete`는 세션 studentId와 orderId 내 studentId 일치 검증 추가.
3. 이로써 success 페이지 fetch는 UX용 즉시 피드백, 웹훅은 신뢰 경로가 된다.

## IMP-6. 상담 "방문 희망 시간"이 다음 7일 고정이라 배정 지연 시 전부 무효가 된다

**사용자 행동 패턴**: 학생은 신청 직후 방문 시간을 입력한다(`visit-consultation.ts` — 다음 7일 슬롯). 매니저 배정이 며칠 늦어지면(현재 WAITING 알림은 Cron 특성상 최대 24h 지연, 실제 배정은 더 늦을 수 있음) 매니저가 볼 때는 **이미 지난 날짜의 희망 시간**을 보고 전화하게 된다.

**지시**:
1. `GET /api/manager/consultations/*` DTO에서 `visitPreferredTimes` 파싱 시 과거 날짜 슬롯을 `expired: true`로 구분해 내려주고, 매니저 UI에서 취소선 + "재요청" 버튼 표시.
2. "재요청" → 학생에게 `VISIT_TIMES_REFRESH_REQUESTED` 알림 + 앱/웹 상담 화면에서 재입력 유도 (IMP-2의 `actionRequired: "UPDATE_VISIT_TIMES"` 재사용).
3. 매니저 배정 시점(`consultations/[id]/assign`)에 희망 시간이 전부 과거면 자동으로 위 재요청 발동.

---

## 우선순위 매핑 (계획 문서 P0–P3에 편입)

| 등급 | 항목 |
|------|------|
| **P0 (돈·데드락)** | EC-5 (FAILED 재시도 버그 — 수정 몇 줄), IMP-5 (웹훅, E1–E3와 함께), EC-1·EC-3 (수락 플로우 완성 — 거절·매니저 취소·웹 수락) |
| **P1** | EC-2 (다과목), EC-4 (알림·포털 정합), EC-6 (SLA 크론), EC-8 (매니저 강탈), IMP-1 (숙제 append — 마이그레이션에 `StudyTask.origin` 포함), IMP-2 (actionRequired), IMP-3 (파이프라인 뷰) |
| **P2** | EC-7 (수업 라이프사이클), EC-9 (Chief 오설정 경고), EC-10 (재상담), IMP-4 (QnA 크론), IMP-6 (방문시간 만료) |

**세션 단위 실행 제안**: ① EC-5 단독(작고 위험 낮음) → ② 계획 문서 §2 마이그레이션에 `StudyTask.origin` 추가해 1회로 통합 → ③ EC-1+EC-3+EC-4 (매칭 라이프사이클 일괄) → ④ EC-6+EC-7 크론 확장 → ⑤ IMP-1 → ⑥ IMP-2+IMP-3.
