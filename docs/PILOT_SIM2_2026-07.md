# 대규모 파일럿 운영 시뮬레이션 결과 2차 (2026-07-05)

> **방법**: opus 에이전트 7팀을 도메인별로 병렬 투입해 dev 서버(localhost:3000, **프로덕션 Supabase DB 연결**)를 검증. 이번 라운드는 샌드박스 정책이 프로덕션 DB write(로그인·가입 POST)를 대부분 차단해, 각 팀이 **정밀 소스 정적 분석(파일:라인 근거)** 을 주 수단으로, 읽기전용/무청구 라이브 프로브(미인증 401 확인, 위조 웹훅, 크론 헤더)를 보조로 사용. 7팀 동시 실행 자체가 connection_limit=1 동시부하 시나리오를 겸함.
> 도메인: A 학생 퍼널 · B 강사 라이프사이클/숙제분배 · C 매니저·치프 운영 · D 결제·환불·정산 · E 학부모·알림·리포트 · F 보안·권한·IDOR · G 엣지·모바일·성능.
> 표기: **P0** = 파일럿 개시 전 필수 · **P1** = 파일럿 중 빠르게 · **P2** = 이후/개선. 1차(PILOT_SIM_2026-07.md)에서 이미 수정된 항목은 제외.

---

## 0. 핵심 요약 — 여러 팀이 교차 확인한 최우선 결함

1. **크론 인증 우회 (P0)** — E·D·F 3팀 독립 발견 + 직접 코드 확인. `x-vercel-cron` 헤더만 있으면(값 무관) 누구나 `/api/cron/*` 실행. 실 DB write·SMS·**빌링키 자동결제(dunning)** 까지 외부 트리거. 라이브로 HTTP 200 + 실제 수업 1건 COMPLETED 전환 실증.
2. **매칭 무결성 붕괴 (P0)** — A·C·F 교차. `manager/matches` POST가 담당관계·상담완료·결제 미검증, 학생 수락(accept)이 `matchStatus` 미검증 → 취소된 매칭 되살리기·타 담당 학생 매칭 가능.
3. **미승인 강사 전체 API 접근 (P1)** — `requireTeacher`가 `approved` 미확인. 라이브 실증(미승인 강사 GET/POST 200).
4. **제품 핵심 자동화(숙제 자동분배, step 8)가 데드코드 (P1)** — env 플래그 미설정 + `isDefault` 지정 경로 부재로 실제로 동작 안 함.

---

## 1. P0 — 파일럿 개시 전 필수

| # | 문제 | 근거 | 제안 |
|---|---|---|---|
| P0-A | **크론 인증 우회.** `isVercelCron = header("x-vercel-cron") !== null` — 헤더 존재만으로 통과. 이 크론이 `runAlertChecks`(수업 자동완료·상태전이)·리포트 생성·`chargeBillingKey`(실 정기결제)·SMS를 구동. 외부인이 결제/독촉 파이프라인 임의 실행 가능 | `cron/check-alerts/route.ts:14-19`, `cron/generate-monthly-reports/route.ts:16-21`. 라이브: `-H "x-vercel-cron: 1"` → 200, `lessonsAutoCompleted:1`(실 DB 변경) | `x-vercel-cron` 단독 신뢰 제거, `Authorization: Bearer CRON_SECRET`만 허용. Vercel 크론도 Authorization 헤더로 시크릿 전달하도록 설정 |
| P0-B | **매칭 수락에 상태 검증 없음.** accept 라우트가 `matchStatus` 미확인, studentId 일치만 검사. CANCELLED/거절된 매칭도 `isActive:false`면 다시 ACTIVE 전환. 게다가 상담 페이지 pendingMatch 쿼리가 `OR:[PENDING_STUDENT_ACCEPT, isActive:false]`라 **취소된 강사가 "수락해 주세요" 카드로 재노출** → 학생이 되살림 | `teacher-student-match.ts:29-57`(where절 matchStatus 없음), `matches/[matchId]/accept/route.ts:15`, `dashboard/consultation/page.tsx:46-49`, `student-journey.ts:145-147` | accept 시 `matchStatus==="PENDING_STUDENT_ACCEPT"` 강제(아니면 409). pendingMatch 쿼리에서 `isActive:false` 제거 |
| P0-C | **manager/matches POST 미검증 매칭(IDOR + 상담완료·결제 무관).** 요청 매니저가 그 학생 담당인지, COMPLETED 상담이 있는지, 결제/구독이 있는지 전혀 확인 안 함. UI 목록은 COMPLETED만 노출하나 API는 임의 studentId 매칭 허용 → 남의 담당 학생에 아무 강사나 배정 | `manager/matches/route.ts:17-128`(managerOwnsStudent/status/subscription 체크 부재), 대조 `care-logs/route.ts:8-19`, `subscriptions/[id]/pause/route.ts:82-94` | POST에 `managerOwnsStudent` + COMPLETED 상담 존재 + 활성 구독 검증 추가 |

## 2. P1 — 파일럿 중 빠르게

| # | 문제 | 근거 | 제안 |
|---|---|---|---|
| P1-A | **미승인 강사(approved:false)가 강사 API 전부 접근.** `requireTeacher`가 role만 확인, `approved` 미검사. auth 레이어에도 게이트 없음 | 라이브: 미승인 강사 로그인→`GET /api/teacher/students`=200, 템플릿 POST=201. `teacher-auth.ts:13-27` | `requireTeacher`에 `if(!teacher.approved) return 403` |
| P1-B | **숙제 자동분배(step 8)가 사실상 데드코드.** `autoApplyFirstLessonHomeworkTemplate`가 `ENABLE_AUTO_HOMEWORK_DISTRIBUTION==="true"`일 때만 동작하는데 어떤 env에도 미설정. `isDefault:true` 템플릿만 적용하나 코드 전체에서 `isDefault`를 true로 쓰는 경로 없음(POST/PATCH 미수용) | `homework-distribution.ts:80,83`; env grep 0건; `grep isDefault:true` 읽기 1건뿐 | env 플래그 활성화 + 템플릿 기본지정 API/UI. 제품 노스스타 핵심 자동화가 켜지지 않음 |
| P1-C | **환불이 실제 Toss 취소를 호출 안 함.** admin 환불은 DB status만 COMPLETED→REFUNDED, 구독 CANCELLED로만 변경. `toss-payments.ts`에 cancel API 자체가 없음 → 돈이 실제로 반환 안 됨. 부분환불·환불액·환불시각 필드 없음 | `admin/payments/[id]/refund/route.ts:28-53`, `toss-payments.ts`(cancel 부재) | Toss `/payments/{key}/cancel` 연동, 환불액/부분환불 컬럼 추가 |
| P1-D | **모바일 강사목록이 [sample]·매니저 계정 노출.** `/api/mobile/tutors`가 `approved:true`만 필터 → 데모 계정·매니저(subjects="상담,매칭")가 학생 강사목록에 leak. 웹은 정상 제외 | 실응답 8명 중 3명 sample/매니저. `mobile/tutors/route.ts:15-42` vs `public-teachers-cache.ts:74-78` | 모바일 route에도 `user:{role:"TEACHER"}` + `[sample]` 제외 동일 적용 |
| P1-E | **평 MANAGER가 강사 승인/삭제(하드삭제) 가능.** `manager/teacher-approval`이 `requireManagerOrAbove`. 거절 시 `user.delete()`로 계정 하드삭제(복구불가). 동일 기능의 `chief-manager/teacher-approval`(치프 전용)과 중복 | `manager/teacher-approval/route.ts:13,41,72` vs `chief-manager/teacher-approval/route.ts` | 승인/삭제는 치프 전용으로 통일, 중복 라우트 제거, 거절은 soft-flag 고려 |
| P1-F | **CHIEF_MANAGER 생성 경로 부재.** admin role API의 `ALLOWED_ROLES=[TEACHER, MANAGER]`만 허용, CHIEF_MANAGER 지정 시 400. 노스스타 "결제=치프 자동배정" 전제가 코드상 성립하려면 DB 수동편집 필요 | `admin/teachers/[id]/role/route.ts:9,37-43` | role API에 CHIEF_MANAGER 추가 또는 별도 승격 엔드포인트 |
| P1-G | **학부모 도달 경로 전무 + 월간 리포트 미전달.** `guardianPhone`은 매니저 화면 표시용으로만 소비, `dispatchSms`는 student/teacher phone만 조회. `generateReportForStudent`는 MonthlyReport upsert만 하고 학생·학부모 알림/발송 단계 없음 | `grep guardianPhone` 소비처 UI 2곳뿐; `notifications.ts:107-123`; `generate-monthly-report.ts:128` | 리포트 생성 후 학생 알림 + (동의 시) guardianPhone 알림톡. 노스스타 step 8 미충족 |
| P1-H | **Toss 웹훅 서명 검증 전무.** 위조 body가 200 반환(라이브). 완화책은 `fetchTossPayment` 재조회뿐 → 위조 결제 *생성*은 불가하나(Toss가 실제 DONE 확인), 유효 orderId 재트리거·방어심층 결함 | `webhooks/toss/route.ts` 전체, `grep signature/hmac` 0건 | Toss 웹훅 시크릿으로 `X-Toss-Signature` HMAC 검증 추가 |
| P1-I | **AI 질답 과약속.** pricing 플랜 feature에 "AI 질답 이용/횟수 2배" 광고하나 prod에 `ANTHROPIC_API_KEY` 미설정 → placeholder "곧 활성화 예정" 반환 | `ai-answer.ts:6-12`, `pricing-plans.ts:203-214` | 키 설정 또는 문구를 "선생님 질답"으로 정정 |
| P1-J | **학생 셀프 상담취소 부재.** 취소는 `manager/consultations/[id]/cancel`만. 학생 UI에 취소 버튼 없음 → 노스스타 "취소→재신청" 불가, 오신청 시 매니저 개입 필요 | consultation API에 student cancel 없음(request/my-booking/visit-times만) | 학생용 취소 엔드포인트 + UI 버튼 |

## 3. P2 — 이후 / 개선

| # | 문제 | 근거 |
|---|---|---|
| P2-1 | **guardianConsent 서버 미강제** — 폼이 항상 `true` 하드코딩 전송, 서버도 미동의 미차단. consent=false로도 201 | `ConsultationSignupForm.tsx:102`, `register/student/route.ts:103,120` |
| P2-2 | **정산이 환불/취소 구독과 무연동** — REFUNDED여도 강사 payout에서 미차감 → 과지급 위험 | `settlement.ts:56-68` |
| P2-3 | **report/visit-confirmed가 상담 상태 무관** — managerId만 확인, 취소된 상담에도 리포트/방문일 설정 가능 | `report/route.ts:50-56`, `visit-confirmed/route.ts:19-22` |
| P2-4 | **첫 수업 과거 날짜 허용** — 형식만 검증, 미래 여부 미확인 | `first-lesson/route.ts:58-65` |
| P2-5 | **days=7 분배가 주말 미제외** — 연속 7캘린더데이 배분(토/일 포함), 노스스타 "주말 제외" 의도와 상충 | `homework-distribution.ts:79-83,102` |
| P2-6 | **grade/name 화이트리스트·길이 상한 없음** — API 직접호출 시 임의 학년/초장문/이모지 저장·알림 노출(region만 slice(0,30)) | `register/student/route.ts:47-49,113` |
| P2-7 | **소프트삭제가 상담 booking 미정리** — WAITING/ASSIGNED booking 잔존 → 매니저 인박스에 유령 상담 | `account-deletion.ts:44-59` |
| P2-8 | **모바일 JWT 취소 불가** — 서명·만료만 검증, deletedAt/role 재조회 없음 → 소프트삭제·강등 후 access 7일 유효(웹 세션엔 가드 있음) | `mobile-auth.ts:78-114` vs `auth.ts:98-102` |
| P2-9 | **파일 업로드 MIME 신뢰·크기 무제한** — `register/teacher/documents`·`cms/upload-image`가 클라 file.type만 확인, size·매직바이트 미검증 | `register/teacher/documents/route.ts:42`, `admin/cms/upload-image/route.ts:23` |
| P2-10 | **가격 역할인** — `high-w1h2` priceKrw 430,000 > listPriceKrw 400,000. UI 취소선 정가가 실가보다 낮게 노출될 수 있음 | `pricing-plans.ts:80` |
| P2-11 | **ADMIN이 매니저 운영 엔드포인트 배제** — `requireManager`가 MANAGER/CHIEF만 통과, ADMIN 403. 권한경계 비일관 | `manager-auth.ts:13` |
| P2-12 | **Alimtalk/카카오 템플릿 인프라 데드코드** — `sendSms`가 항상 2-인자 호출, templateCode 매핑 전부 미사용 | `sms.ts:22-107`, 호출부 2곳 |
| P2-13 | **에러 원문 클라이언트 노출** — Supabase/DB `error.message` 그대로 500 응답(내부 경로·버킷 힌트) | `student/question-images/route.ts:64`, `admin/cms/upload-image/route.ts:65` |
| P2-14 | **모바일 등록 bcrypt saltRounds 10** (웹 12) — 강도 불일치 | `mobile/auth/register/route.ts:116` |
| P2-15 | **엔드포인트 404/200·검증 불일치** — 없는 tutor 상세 404지만 `/slots`는 200 빈배열; reports `?month=abc`는 400 아닌 무음 폴백; 모바일 로그인이 全 role 토큰 발급 | `tutors/[id]/slots/route.ts:15-29`, `reports/route.ts:27`, `mobile/auth/login/route.ts:72-86` |
| P2-16 | **저만족도·만족도 미응답 후속 부재** — ≤3점 알림 매니저에게만, 미응답 리마인더 없음 | `run-alert-checks.ts:1417-1436` |
| P2-17 | **구독 auto-resume 미구현** — pausedUntil 설정하나 자동재개 크론 없음 | `subscriptions/[id]/pause/route.ts:156` |
| P2-18 | **신규 대기상담·강사배정 알림 부재** — waiting 폴링만, 배정 강사는 수락 전까지 무통지 → 30명 유입 시 배정 지연 | `waiting/route.ts`, `manager/matches/route.ts:119-126` |
| P2-19 | **알림 body 사용자입력 무이스케이프** — `${student.name}`·reason 직결. 렌더가 React 텍스트면 안전하나 HTML 경로 있으면 저장형 XSS 잠재 | `student/teacher-change-request/route.ts:92-94` |
| P2-20 | **강사 가입 필수항목 과다** — bio·education·experience 미입력 시 400 | `register/teacher/route.ts:39-47` |
| P2-21 | **수업취소 보충생성 무음 실패** — makeupAt 정확슬롯 충돌 시 보충 미생성·사유 미고지 | `lessons/[id]/cancel/route.ts:68-88` |

## 4. 인프라 (P2, 1차에서도 지적 — 재확인)

- **connection_limit=1 풀 병목**: 첫 히트에서 tutors/qna/satisfaction/matches 간헐 500, 한국어 subject 필터 400 → 재시도 전부 200. 코드 아닌 인프라. dashboard/journey가 `Promise.all` 7쿼리를 단일 커넥션에 직렬화(`dashboard/page.tsx:62-92`). → prod pooler connection_limit 상향 또는 Prisma Accelerate, 병렬쿼리 수 축소. (`.env`에 `connection_limit=1&pgbouncer=true` 확인)

## 5. 잘 방어된 것 (회귀 방지 기준선)

- **결제 멱등성·금액 서버신뢰**: orderId 기준 `PaymentCompletion` 상태머신(재완료 무해, REFUNDED 재완료 차단), 완료는 `planIdFromAmount(Toss검증금액)`으로 클라 plan 불신. 정기결제는 서버 `v2Plan.priceKrw` 사용. 이중환불 조건부 updateMany 원자방어.
- **결제→치프 자동배정(step 3)** 정상 연결: `completeStudentPayment`→`assignChiefManagerToStudent`. 갱신결제는 새 상담 미생성.
- **동시 배정 경합 안전**: `assign`이 `updateMany where{managerId:null,status:WAITING}` + `count===0→409` 원자처리(TOCTOU 없음). 매칭 중복도 `findFirst existing→409`.
- **IDOR 대부분 견고**: plans/tasks·homework-templates·notifications·satisfaction·qna·care-logs·consultation report/complete가 리소스 스코프 또는 `requireTeacherStudentMatch`/`managerOwnsStudent` 소유권 검증. (예외가 P0-C·P1-E)
- **소프트삭제 재로그인 차단**(auth authorize `deletedAt`), **미인증 401 일관**, **극단입력 내성**(5000자·이모지·SQL-ish 전부 200 빈결과, Prisma 파라미터 바인딩, raw SQL 0건), **mass-assignment 방어**(role/isActive/approved 미노출).
- **분배 총량 보존 견고**: 모든 n(0~100)·days(4/7)에서 합계=n, 앞쪽 가중, 태스크≥활성일수면 각일 최소 1개(수치검증 통과). *단 자동적용 트리거가 꺼져 있음 → P1-B.*
- **콘텐츠 정합**: "첫 수업 100% 환불 보장" ↔ refund 상세정책 일관.

## 6. 정리 필요 (프로덕션 DB 부작용)

이번 라운드는 write가 대부분 차단됐으나 일부 라이브 프로브로 실제 변경 발생:
- **pilot2-guardian-test** (010-0000-1590, guardianPhone 010-0000-1591, guardianConsent=false) — E팀 생성. 삭제 요망.
- **pilot2- 강사 4명** (010-0000-1201~1204) — B팀 생성. 생성 템플릿은 DELETE로 정리 완료, 계정은 잔존. 삭제 요망.
- **⚠️ SCHEDULED 수업 1건이 COMPLETED로 오전환** — E팀의 `check-alerts` 라이브 트리거 부작용(`lessonsAutoCompleted:1`). 어떤 수업인지 확인 후 되돌릴 필요.
- 1차 라운드 `pilot-` 계정들(김서연/박준호/이정희아들/테스트C/매니저최/강사노아/검증지역)도 미정리 상태 — 함께 정리 권장.

---

## 7. 수정·검증 라운드 (2026-07-05, opus 반복 검증 후 반영)

> **방법**: 위 P0/P1/P2를 소스에서 직접 수정 → opus 서브에이전트에 diff를 브리핑해 재검증하는 fix→verify 사이클을 4회 반복해 회귀 없음까지 수렴. 프로덕션 DB write는 여전히 차단이라 마이그레이션은 "준비만", 커밋은 사용자 지시 대기.

### 7.1 P0 — 전부 수정 완료

| # | 수정 내용 | 파일 |
|---|---|---|
| P0-A | 크론 인증을 `authorizeCron`(Bearer `CRON_SECRET`)로 통일, `x-vercel-cron` 단독 신뢰 제거 | `lib/cron-auth.ts`, `cron/*/route.ts` |
| P0-B | accept 시 `matchStatus==="PENDING_STUDENT_ACCEPT"` 강제(아니면 실패), pendingMatch 쿼리에서 `isActive:false` 제거 → 취소 매칭 재노출 차단 | `teacher-student-match.ts`, `mobile/matches/route.ts`, 상담 페이지 쿼리 |
| P0-C | `manager/matches` POST/`admin/matches` POST를 upsert+상태검증으로 재작성. CANCELLED 되살리기 시 재배정 알림, ACTIVE 중복 배정 방지 | `manager/matches/route.ts`, `admin/matches/route.ts`, `manager-portal-data.ts` |

### 7.2 P1 — 수정 완료

- **P1-A 미승인 강사 API 접근**: `requireTeacher`를 `requireTeacherAllowPending`(신원만)과 `requireTeacher`(승인 게이트, TEACHER role일 때 `approved` 필수 403)로 분리. 온보딩 필수 라우트(profile/documents/photo)는 pending 허용, 나머지는 승인 필수. MANAGER/CHIEF는 게이트 우회. (`teacher-auth.ts`)
- **P1-D 모바일 강사목록 leak**: `/api/mobile/tutors`·상세·slots에 `user:{role:"TEACHER"}`+`[sample]` 제외 적용, slots는 미승인/데모 teacherId 조회 차단. (`mobile/tutors/*`)
- **P1-E 매니저 강사 하드삭제**: 승인 유지(매니저도 승인)하되, 거절 경로를 `user.delete()` → `softDeleteUser`로 변경. pending 목록 쿼리에 `user:{deletedAt:null}` 추가로 소프트삭제 강사 재노출 차단. (`manager|chief-manager/teacher-approval`)
- **P1-F CHIEF_MANAGER 생성 경로**: role API `ALLOWED_ROLES`에 CHIEF_MANAGER 추가. (`admin/teachers/[id]/role`)
- **유령 수업 정리(3경로)**: 매칭 비활성/삭제·계정 소프트삭제 시 미래 SCHEDULED 수업을 CANCELLED로 정리. 소프트삭제 강사↔학생 매칭 대칭 정리. (`admin/matches/[id]`, `account-deletion.ts`)
- **QnA IDOR**: `mobile/qna` POST를 배정(active)된 강사에게만 허용(403 가드). (`mobile/qna/[tutorId]`)

### 7.3 P1-B 숙제 자동분배 — 활성화 + 문서화 (선생님 선택 방식)

- 노스스타 step 8은 **선생님이 수업을 마치고 숙제를 낼 때 선택**하는 흐름이 맞다는 결정에 따라, 항상 활성인 수동 분배 경로(플랜 탭 "숙제 자동 분배": tasks + 4/7일 + repeatWeeks 1~12 + 템플릿 저장/재사용)를 **기본(primary) 경로**로 확정. env 플래그 불필요.
- 부가 기능인 첫 수업일 자동적용(`autoApplyFirstLessonHomeworkTemplate`)은 선생님 흐름을 방해하지 않도록 **기본 꺼짐(opt-in)** 으로 유지하고 `.env.example`에 `ENABLE_AUTO_HOMEWORK_DISTRIBUTION="false"`로 문서화. (`.env.example`, `homework-distribution.ts`, `TeacherStudentPlanTab.tsx`)

### 7.4 P2 — 이번 라운드 수정 항목

- **P2 여정단계 조기 ACTIVE 전환**: `firstLessonCount`가 미래 예약 수업을 세어 첫 수업 시작 전에 ACTIVE로 표기 → `startAt <= now`로 제한(웹/앱 동일). (`student-journey.ts`, `mobile/me/route.ts`)
- **P2 관리자 화면 익명화된 탈퇴 계정 노출**: 강사 목록·metrics(매니저 성과)·stats(집계/최근가입/매니저부하)에서 `user.deletedAt`/`student.deletedAt` 제외. 특히 탈퇴 강사가 `approved:false`로 pending 카운트를 부풀리던 문제 해결. (`admin/teachers`, `admin/metrics`, `admin/stats`)
- **P2 teacher-change-request**: 이미 `matchStatus!=="ACTIVE"`를 명시적 409로 처리 중임을 확인 — 추가 수정 불필요.

### 7.5 SatisfactionCheckin 유니크 제약 — 마이그레이션 준비만

- 스키마에 `@@unique([studentId, trigger])` 추가, 마이그레이션 SQL 작성(`20260705120000_satisfaction_checkin_unique`, 기존 중복 선정리 후 UNIQUE INDEX). **프로덕션 미적용(사용자 지시 대기)**.
- 크론 생성부는 P2002를 잡아 건너뛰도록 하드닝해, 제약 적용 후 동시 실행에도 안전. (`run-alert-checks.ts`)

### 7.6 검증 결과

- `tsc --noEmit` 0, `next lint` 0 warnings/errors, `prisma validate` 통과. 4회 fix→verify에서 신규 P0/P1 미발생, 회귀 없음.

## 8. 4라운드 재검증 (2026-07-05, opus 5팀 교차 검증)

3라운드 수정을 기준으로 opus 5팀(인증·계정, 상담·매칭, 결제·환불, 매니저·승인, 숙제·수업·모바일)이 **읽기 전용 정적 분석**으로 재검증. 3라운드 수정 전부 유지·회귀 없음을 확인했고, 신규 P2 3건을 반영했다.

### 8.1 신규 수정 항목 (전부 P2)

- **admin/students 탈퇴 학생 노출**: 3라운드에서 teachers/metrics/stats에는 `deletedAt` 제외를 넣었으나 `admin/students` 목록 쿼리에 누락 → 익명화된 "탈퇴회원"이 관리자 학생 목록과 `unmatchedFor` 매칭 후보 피커에 노출. `where.AND`에 `{ deletedAt: null }` 추가. (`admin/students/route.ts`)
- **숙제 분배 앞쪽 가중 위반**: `distributeTasks`의 가중치+나머지 로직이 `Math.max(1, …)` 바닥값과 충돌해 뒷날이 앞날보다 많아지는 케이스 발생(예: 4일/6과제 → `[2,1,1,2]`, 7일/17과제 → 마지막날 > 6일차). "앞쪽이 살짝 더 많은" 제품 규칙(CLAUDE.md §8) 위반. 균등 분배 후 나머지를 앞쪽부터 얹는 방식으로 재작성해 **보존·최소1·단조비증가**를 보장(브루트포스 n∈[0,200], days∈{4,7} 전수 통과). (`homework-distribution.ts`)
- **갱신 결제 FAILED 업서트 경합**: 실패 분기의 `paymentCompletion.upsert`가 `update`에서 무조건 `FAILED`로 덮어써, 동시 실행이 먼저 `COMPLETED`한 주문을 FAILED로 되돌려 다음 버킷에서 재청구할 위험. 환불 라우트와 동일한 조건부 업데이트 패턴으로 교체 — `updateMany where status notIn [COMPLETED, REFUNDED]`, 미존재 시에만 create. (`run-alert-checks.ts`)

### 8.2 확인 후 미수정 (설계상 정상/비이슈)

- **mobile/me 여정단계 crash 가능성**: `CONSULTATION_STATUS_TO_STAGE`는 `Record<ConsultationBookingStatus, …>`로 enum 전수 매핑이 타입 강제 → 런타임 undefined 진입 불가. 방어 코드 추가 시 `student-journey.ts`와 불일치·불필요 → 미적용.
- **mobile 회원가입 status 라벨**: 가입시점 attach 반환값으로 미영속·불변식 무관한 표기 차이 → 코스메틱, 미수정.
- **admin/matches DELETE의 ManagerStudent 잔존 링크**: 매칭 불변식 무해, 기존 동작 → 미변경.

### 8.3 검증 결과

- `tsc --noEmit` 0, `next lint` 0, `prisma validate` 통과. `distributeTasks` 불변식 브루트포스 전수 통과. 5라운드 교차검증에서 신규 P0/P1 미발생, 3라운드 수정 전부 유지.
