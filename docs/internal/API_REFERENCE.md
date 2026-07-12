# Concord Private Tutoring — API Reference

> 대상: 백엔드·프론트 통합 담당자  
> 기준: `src/app/api/**/route.ts` 실측 (최초 2026-07-04 / **재실측 2026-07-12**, 총 **166개** 라우트)  
> 원칙: 정확성 > 완전성. 각 라우트의 `require*()` 헬퍼·`session.user.role` 분기 코드로 권한 결정. 확인 못 한 것은 `[미확인]`.
>
> **2026-07-12 갱신 요약:** 07-05~07-12에 56개 라우트 추가(110→166). 주요 증가분 — PARENT 역할 계열(웹 `/api/parent/*` 8, 모바일 `/api/mobile/parent/*` 8), 강사 모바일 API `/api/mobile/teacher/*` 15, 매니저 모바일 API `/api/mobile/manager/*` 15, 웹 매니저 추가(`parent-link`·`password-reset`·`questions`), 공개 상담 리드 `/api/consultation-leads`, 비밀번호 변경·리셋(`/api/account/password`·`/api/mobile/me/password`·`manager/password-reset`), 학부모 연결 코드(`student/parent-link-code`·`mobile/me/parent-link-code`), `student/profile`. 신규 헬퍼: `requireParent`(웹 NextAuth PARENT) / `requireMobileParent`·`requireMobileManager`·`requireMobileTeacher`·`requireMobileTeacherAllowPending`(모바일 Bearer JWT) / `requireManagerOrAbove`. 제거된 라우트 없음.

## 범례

- 권한 표기:
  - `STUDENT`, `TEACHER`, `MANAGER`, `CHIEF_MANAGER`, `ADMIN` — NextAuth 세션 role.
  - `STUDENT (mobile)` — `requireMobileStudent()` (Bearer HMAC-JWT).
  - `Public` — 세션 무관.
  - `CRON_SECRET` — `Authorization: Bearer ${CRON_SECRET}` 또는 `x-vercel-cron` 헤더.
- 헬퍼 통과 역할 확장 (재기재):
  - `requireAdmin` → `ADMIN` **또는** `CHIEF_MANAGER`.
  - `requireTeacher` → `TEACHER` / `MANAGER` / `CHIEF_MANAGER`.
  - `requireManager` → `MANAGER` / `CHIEF_MANAGER`.
  - `requireManagerOrAbove` → `MANAGER` / `CHIEF_MANAGER` / `ADMIN` (07-12 신규).
  - `requireParent` → NextAuth `role=PARENT` (웹, 07-12 신규).
  - `requireMobileParent` → `role=PARENT` (모바일 Bearer JWT, 07-12 신규).
  - `requireMobileManager` → `role=MANAGER` / `CHIEF_MANAGER` (모바일 Bearer JWT, 07-12 신규).
  - `requireMobileTeacher` → `role=TEACHER`(승인 완료)/`MANAGER`/`CHIEF_MANAGER` (모바일 Bearer JWT, 07-12 신규).
  - `requireMobileTeacherAllowPending` → 위와 동일하되 미승인(`approved=false`) 강사도 통과 (프로필·홈 접근용, 07-12 신규).
- ⚠️ = 부트스트랩·복구·디버그 성격 (프로덕션 노출 주의).
- 스키마는 핵심 필드만. 응답은 성공 응답 요약.
- `src/app/api/dev/` 디렉토리 **존재하지 않음** — 명시적 개발 전용 라우트 그룹 없음.

## 그룹별 개수

> 2026-07-12 실측 기준 개수. 괄호 안은 07-04 대비 증감.

| 그룹 | 라우트 파일 수 |
|---|---|
| account | 2 (+1) |
| admin | 30 |
| auth | 1 |
| billing | 2 |
| chief-manager | 1 |
| consultation | 3 |
| consultation-leads | 1 (신규) |
| cron | 2 |
| events | 1 |
| manager | 16 (+3) |
| matches | 1 |
| mobile | 63 (+43) |
| notifications | 3 |
| parent | 8 (신규) |
| payments | 1 |
| plans | 4 |
| question-images | 1 (07-04 표에서 누락됐던 기존 라우트) |
| questions | 3 |
| register | 3 |
| student | 5 (+2) |
| teacher | 14 (+1) |
| webhooks | 1 |
| **합계** | **166** |

> 참고: 07-04 문서의 합계 110은 `question-images` 1개가 표에서 누락된 값(실측 111)이었을 가능성. 07-12 재실측은 `find src/app/api -name route.ts` 기준 166개.

---

## 1. auth

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth 프로토콜 (`identifier`, `password`) | NextAuth JWT 세션 쿠키 | `handlers` re-export |

## 2. register (공개 가입)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/register/student` | POST | Public | `name, grade, subjects[], phone, password, gender, guardianPhone?, guardianConsent?, instantEnroll?` | `{ ok, userId, instant? }` | 합성 이메일 생성. `instantEnroll=true` → Chief 즉시 배정 |
| `/api/register/teacher` | POST | Public | `name, phone, subjects[], bio, education, experience, password, gender, careerEntries?` | `{ ok, userId }` | 신규 강사 `approved: false` |
| `/api/register/teacher/documents` | POST | Public (multipart) | `file`, `type: "resume"\|"document"`, `teacherId` | `{ url }` | Supabase Storage 업로드. 세션 검증 없음 — `teacherId`만 신뢰 [보안 검토 필요] |

## 3. account

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/account/delete` | POST | 로그인 유저 전체 | — | `{ ok }` | 소프트 삭제, `AuditLog` 기록 |
| `/api/account/password` | POST | 로그인 유저 전체 (NextAuth `session.user.id`) | `{ currentPassword, newPassword }` | `{ ok }` | 07-12 신규. `changeOwnPassword()`. 실패 시 헬퍼가 status 반환 |

## 4. consultation (학생 상담)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/consultation/request` | POST | STUDENT | `{ note? }` | `{ booking }` | `createConsultationRequest` |
| `/api/consultation/my-booking` | GET | STUDENT | — | `{ booking }` (최신 1건 DTO) | — |
| `/api/consultation/visit-times` | PATCH | STUDENT | `{ visitPreferredTimes }` | `{ ok }` | 방문 상담 시간대 저장 |

## 5. matches (학생 수락)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/matches/[matchId]/accept` | POST | STUDENT | — | `{ match }` | `acceptTeacherStudentMatch()` — 매칭 활성화 |

## 6. plans (학생 학습 계획)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/plans` | GET | STUDENT | `?date=YYYY-MM-DD` | `{ plan }` | 날짜별 조회 |
| `/api/plans` | POST | STUDENT | `{ date, tasks[] }` | `{ plan }` | 생성 |
| `/api/plans/copy` | POST | STUDENT | `{ sourceDate, targetDate }` | `{ plan }` | 다른 날짜 복사 |
| `/api/plans/[planId]/tasks` | POST | STUDENT | `{ title, order? }` | `{ task }` | 개별 task 추가 |
| `/api/plans/tasks/[taskId]` | PATCH/DELETE | STUDENT | `{ isDone?, title? }` | `{ task }` / `{ ok }` | 소유권 검사 |

## 7. questions (학생 QnA)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/questions` | GET | STUDENT | `?date=YYYY-MM-DD` | `{ questions }` | `QuestionMessage` 루트 목록 |
| `/api/questions` | POST | STUDENT | `{ content, imageUrl?, date? }` | `{ question }` | 학생 질문 등록 |
| `/api/questions/[id]` | PATCH | STUDENT | `{ isResolved: boolean }` | `{ question }` | 해결 표시 |
| `/api/questions/[id]/ai-answer` | POST | STUDENT | — | `{ answer }` | Claude로 자동 답변, `TokenWallet` 차감 |

## 8. student (기타 학생 액션)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/student/question-images` | POST | STUDENT (multipart) | `file` | `{ url }` | Supabase Storage |
| `/api/student/teacher-change-request` | POST | STUDENT | `{ reason? }` | `{ ok }` | 관리자 알림 생성 |
| `/api/student/satisfaction-checkins/[id]/respond` | POST | STUDENT | `{ score: 1-5, comment? }` | `{ checkin }` | 소유 학생만 |
| `/api/student/parent-link-code` | GET/POST | STUDENT (`requireStudent`) | — | GET `{ code, expiresAt }`(없으면 null) / POST `{ code, expiresAt }` 201 | 07-12 신규. 학부모 연결용 `ParentLinkCode` 발급·조회 |
| `/api/student/profile` | PATCH | STUDENT (`requireStudent`) | `{ grade?, gender?, region?, subjects?[], guardianPhone? }` | `{ ok }` | 07-12 신규. 가입 후 선택 정보 보강. 유효한 필드만 부분 저장 |

## 9. teacher

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/teacher/profile` | GET/PATCH | TEACHER (헬퍼상 MANAGER/CHIEF도) | `{ intro?, career?, education?, certificates? }` | `{ profile }` | 프로필 수정 시 `PUBLIC_TEACHERS_CACHE_TAG` 재검증 |
| `/api/teacher/profile/photo` | POST | TEACHER | `file` multipart | `{ url }` | Supabase Storage |
| `/api/teacher/profile/documents` | POST | TEACHER | `file`, `type` | `{ url }` | Supabase Storage |
| `/api/teacher/homework-templates` | GET/POST | TEACHER | `{ title, subject?, tasks, defaultDays?, isDefault? }` | `{ templates }` / `{ template }` | 본인 소유 목록 |
| `/api/teacher/homework-templates/[templateId]` | PATCH/DELETE | TEACHER | `{ title?, tasks?, ... }` | `{ template }` / `{ ok }` | — |
| `/api/teacher/lessons` | GET | TEACHER | `?studentId=&status=&upcoming=1` | `{ lessons }` | 담당 학생의 수업 |
| `/api/teacher/lessons/[id]/cancel` | PATCH | TEACHER | — | `{ lesson }` | 7일 뒤 자동 보충 수업 생성 |
| `/api/teacher/plans/[planId]/comment` | PATCH | TEACHER | `{ comment }` | `{ plan }` | `requireTeacherStudentMatch` |
| `/api/teacher/questions/[id]/answer` | PATCH | TEACHER | `{ answer }` | `{ question }` | 매칭 검증 후 답변 |
| `/api/teacher/students` | GET | TEACHER | — | `{ students }` | 담당 학생 목록 |
| `/api/teacher/students/[id]/plans` | GET/POST | TEACHER | `?date=` / `{ date, tasks }` | `{ plan }` | 강사 관점 학습 플랜 |
| `/api/teacher/students/[id]/questions` | GET | TEACHER | `?date=` | `{ questions }` | 담당 학생 질문 |
| `/api/teacher/students/[id]/first-lesson` | POST | TEACHER | `{ date, time, durationMin?, subject? }` | `{ lesson }` | 첫 수업 설정 + 자동 숙제 템플릿 적용 |
| `/api/teacher/students/[id]/homework-distribution` | POST | TEACHER | `{ startDate, days, tasks[], repeatWeeks? }` | `{ plans }` | 주간 숙제 자동 분배 |

## 10. manager

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/manager/consultations/waiting` | GET | MANAGER/CHIEF | — | `{ bookings }` | `WAITING` + `managerId=null` |
| `/api/manager/consultations/mine` | GET | MANAGER/CHIEF | — | `{ bookings }` | 자신에게 배정된 booking |
| `/api/manager/consultations/[id]/assign` | PATCH | MANAGER/CHIEF | — | `{ ok }` | self-assign (`WAITING`→`ASSIGNED`) |
| `/api/manager/consultations/[id]/cancel` | PATCH | MANAGER/CHIEF | — | `{ ok }` | 매니저가 취소 |
| `/api/manager/consultations/[id]/complete` | PATCH | MANAGER/CHIEF | `{ managerNote?, status? }` | `{ booking }` | 상담 완료 처리 |
| `/api/manager/consultations/[id]/report` | GET/POST/PATCH | MANAGER/CHIEF | `{ goals, subjectLevels?, recommendedPlan?, note? }` | `{ report }` | `ConsultationReport` CRUD |
| `/api/manager/consultations/[id]/visit-confirmed` | PATCH | MANAGER/CHIEF | `{ visitConfirmedAt: string \| null }` | `{ booking }` | 방문 상담 일시 확정 |
| `/api/manager/matches` | GET | MANAGER/CHIEF | — | `{ students, teachers }` | 매칭 대상·후보 |
| `/api/manager/matches` | POST | MANAGER/CHIEF | `{ teacherId, studentId, subjects, startDate, matchReason? }` | `{ match }` | `TeacherStudent` 생성 (`PENDING_STUDENT_ACCEPT`) |
| `/api/manager/monitoring` | GET | MANAGER/CHIEF | — | 자기 담당 학생 모니터링 스냅샷 | — |
| `/api/manager/monitoring/stats` | GET | MANAGER/CHIEF | `?studentId=` | 학생 상세 통계 | — |
| `/api/manager/care-logs` | POST/GET | MANAGER/CHIEF | `{ studentId, type, note, visibleToStudent? }` | `{ log }` / `{ logs }` | `managerOwnsStudent` 검사 (CHIEF는 항상 통과) |
| `/api/manager/subscriptions/[id]/pause` | POST | MANAGER/CHIEF | `{ action: "PAUSE"\|"RESUME", until?, reason? }` | `{ subscription }` | 담당 학생 or CHIEF만. `AuditLog` 기록 |
| `/api/manager/teacher-approval` | GET/POST | **MANAGER/CHIEF/ADMIN** (`requireManagerOrAbove`) | `{ teacherId, approve: boolean }` | `{ pendingTeachers }` / `{ ok }` | 07-12 가드 변경: 기존 `requireAdmin`→`requireManagerOrAbove`(매니저도 승인 가능). 미승인 `role=TEACHER`만 처리, 거절 시 `softDeleteUser`. `PUBLIC_TEACHERS_CACHE_TAG` 재검증 |
| `/api/manager/parent-link` | POST | MANAGER/CHIEF (`requireManager`) | `{ studentId, parentId? , parentPhone? }` | `{ ok, alreadyLinked }` 201 | 07-12 신규. 매니저 수동 학부모↔학생 연결. `parentId` 우선, 없으면 전화번호 조회 |
| `/api/manager/password-reset` | POST | MANAGER/CHIEF (`requireManager`) | `{ identifier, newPassword }` | `{ ok, target: { role, name } }` | 07-12 신규. 대면 재설정용 — 학생·학부모 계정만(`findResettableUser`). `AuditLog(PASSWORD_RESET)` 기록 |
| `/api/manager/questions` | GET/POST | **MANAGER/CHIEF/ADMIN** (`requireManagerOrAbove`) | POST `{ questionId, answer }` | GET `{ questions }` / POST `{ ok }` | 07-12 신규. 담당 강사 없는 학생 질문 인박스·매니저 대리 답변. `TEACHER_ANSWERED` 알림 |

## 11. chief-manager

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/chief-manager/teacher-approval` | GET/POST | ADMIN 또는 CHIEF_MANAGER | `{ teacherId, approve }` | `{ ok }` | `manager/teacher-approval`와 동일 코드 (중복 라우트) |

## 12. notifications

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/notifications` | GET | 로그인 유저 전체 | `?unreadOnly=1` | `{ notifications }` | `requireNotificationUser` (role 미검사) |
| `/api/notifications/[id]/read` | PATCH | 로그인 유저 전체 | — | `{ ok }` | 본인 소유만 |
| `/api/notifications/read-all` | PATCH | 로그인 유저 전체 | — | `{ ok }` | — |

## 13. payments

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/payments/complete` | POST | STUDENT | `{ orderId, paymentKey, amount, cashReceipt? }` | `{ ok, plan, subscription }` | 서버 Toss confirm → `completeStudentPayment()` (멱등) |

## 14. billing (자동결제 빌링키)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/billing/register-success` | GET | STUDENT (redirect target) | `?authKey=&customerKey=` | 302 → `/payments?billing=registered\|failed` | `customerKey === "student-{studentId}"` 검증 후 `issueBillingKey` |
| `/api/billing/autorenew` | POST | STUDENT | `{ enabled: boolean }` | `{ profile }` | billingKey는 유지, autoRenew 플래그만 토글 |

## 15. webhooks

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/webhooks/toss` | POST | Public (서명 미검증) | Toss `PAYMENT_STATUS_CHANGED` payload | `200` | 본문 신뢰 X — `paymentKey`로 `fetchTossPayment` 후 처리. 인식 못한 이벤트도 200 |

## 16. events (분석)

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/events` | POST | Public / 세션 유저 / 모바일 유저 | `{ name, payload?, platform?: "web"\|"mobile" }` | `204` | 웹은 NextAuth 세션, 모바일은 Bearer JWT → `userId` 부착. 비로그인도 저장 |

## 17. cron

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/cron/check-alerts` | GET | `CRON_SECRET` | — | `{ checked, ... }` | Vercel Cron 매일 00:00 UTC. `x-vercel-cron` 또는 `Authorization: Bearer $CRON_SECRET` |
| `/api/cron/generate-monthly-reports` | GET | `CRON_SECRET` | `?month=YYYY-MM` (선택) | `{ month, ... }` | 매월 1일 01:00 UTC. `getPreviousMonth()` 기본 |

## 18. admin — 30개

권한: 별도 표기 없으면 모두 `ADMIN` 또는 `CHIEF_MANAGER` (`requireAdmin`). 표는 압축.

### 18.1 부트스트랩·복구 ⚠️

| 경로 | 메서드 | 권한 | 비고 |
|---|---|---|---|
| `/api/admin/setup` ⚠️ | POST | Public + `ADMIN_SETUP_SECRET` | 최초 관리자 1명 생성. 이후는 항상 403. dev에서 secret 없이 허용 |
| `/api/admin/recover` ⚠️ | POST | Public + `ADMIN_SETUP_SECRET` | 관리자 비밀번호 재설정. dev에서 secret 없이 허용 |
| `/api/admin/db-check` ⚠️ | GET | requireAdmin | DB 연결 확인 |
| `/api/admin/cms/init` ⚠️ | POST | requireAdmin | CMS 시딩 |

### 18.2 데이터 조회

| 경로 | 메서드 | 요청 | 응답 |
|---|---|---|---|
| `/api/admin/stats` | GET | — | 대시보드 카운트 |
| `/api/admin/metrics` | GET | `?days=` | 지표 시계열 |
| `/api/admin/funnel` | GET | `?days=` (7–90, 기본 30) | 퍼널 스냅샷 |
| `/api/admin/audit-logs` | GET | 페이지네이션 | `AuditLog` 목록 |
| `/api/admin/settlements` | GET | 페이지네이션 | 정산 목록 |
| `/api/admin/check-alerts` | POST | — | 알림 배치 수동 실행 |
| `/api/admin/data/plans` | GET | `?page&limit&q&from&to` | `StudyPlan` 목록 |
| `/api/admin/data/questions` | GET | `?page&limit&q&from&to` | `QuestionMessage` 목록 |

### 18.3 학생·강사·매칭 CRUD

| 경로 | 메서드 | 비고 |
|---|---|---|
| `/api/admin/students` | GET | 페이지네이션 목록 |
| `/api/admin/students/[id]` | GET/PATCH/DELETE | AuditLog 기록 (변경·삭제 시) |
| `/api/admin/teachers` | GET | 페이지네이션 목록 |
| `/api/admin/teachers/[id]` | GET/PATCH/DELETE | — |
| `/api/admin/teachers/[id]/role` | PATCH | 역할 변경 (AuditLog) |
| `/api/admin/teachers/[id]/photo` | POST | Supabase Storage |
| `/api/admin/teachers/[id]/documents` | GET/POST | 이력·인증 서류 |
| `/api/admin/matches` | GET/POST | 매칭 CRUD |
| `/api/admin/matches/[id]` | PATCH/DELETE | — |

### 18.4 결제·환불

| 경로 | 메서드 | 비고 |
|---|---|---|
| `/api/admin/payments` | GET | 페이지네이션 결제 이력 |
| `/api/admin/payments/[id]/refund` | POST | 환불 처리, AuditLog 기록. Toss 환불 API 호출 여부 `[미확인]` |

### 18.5 CMS

| 경로 | 메서드 | 비고 |
|---|---|---|
| `/api/admin/cms` | GET/POST/PATCH/DELETE | `SiteContent` 종합 |
| `/api/admin/cms/content` | GET/PATCH | `SiteContent` 개별 |
| `/api/admin/cms/testimonials` | GET/POST | 후기 |
| `/api/admin/cms/testimonials/[id]` | PATCH/DELETE | — |
| `/api/admin/cms/faq` | GET/POST | FAQ |
| `/api/admin/cms/faq/[id]` | PATCH/DELETE | — |
| `/api/admin/cms/upload-image` | POST | Supabase Storage |

CMS 변경 라우트는 `revalidatePublicCms(...)`로 캐시 태그 재검증.

## 19. mobile — 63개 (07-12: 20→63)

권한: 학생 데이터는 `requireMobileStudent` (`role=STUDENT`, HMAC-JWT Bearer). 07-12에 학부모/강사/매니저 모바일 계열이 대거 추가돼 각각 `requireMobileParent`·`requireMobileTeacher(AllowPending)`·`requireMobileManager` 헬퍼를 사용한다. 예외 표기.

### 19.1 인증

| 경로 | 메서드 | 권한 | 요청 | 응답 |
|---|---|---|---|---|
| `/api/mobile/auth/login` | POST | Public | `{ identifier, password }` | `{ accessToken, refreshToken, expiresIn, user }` |
| `/api/mobile/auth/refresh` | POST | Public | `{ refreshToken }` | 새 토큰 페어 |
| `/api/mobile/auth/register` | POST | Public | 학생 가입 페이로드 + 상담 페이로드 | 새 유저 + 토큰 |

### 19.2 학생 데이터 (STUDENT mobile)

| 경로 | 메서드 | 요청/응답 |
|---|---|---|
| `/api/mobile/home` | GET | 홈 위젯 |
| `/api/mobile/me` | GET/PATCH | 프로필 |
| `/api/mobile/me/journey` | GET | 온보딩 스테이지 |
| `/api/mobile/me/tokens` | GET | `TokenWallet` |
| `/api/mobile/learning/weekly` | GET | 주간 학습 시간 |
| `/api/mobile/lessons` | GET | 예약 수업 |
| `/api/mobile/reports` | GET | 월간 리포트 |
| `/api/mobile/matches` | GET/POST | 매칭 조회·수락 |
| `/api/mobile/consultation` | POST | 상담 신청 |
| `/api/mobile/qna` | GET/POST | 통합 QnA |
| `/api/mobile/qna/[tutorId]` | GET/POST | 강사별 스레드 |
| `/api/mobile/notifications` | GET/PATCH | 목록·읽음 |
| `/api/mobile/satisfaction-checkins` | GET | 미응답 체크인 |
| `/api/mobile/satisfaction-checkins/[id]/respond` | POST | 응답 등록 |
| `/api/mobile/me/parent-link-code` | GET/POST | 07-12 신규. 학부모 연결 코드 조회·발급(웹 `student/parent-link-code` 대응) |
| `/api/mobile/me/password` | POST | 07-12 신규. `getMobileUser`(role 무관)로 본인 비번 변경 `{ currentPassword, newPassword }` → `{ ok }` |

### 19.3 공개 조회 (모바일 토큰만 사용, role 미검사)

| 경로 | 메서드 | 권한 | 비고 |
|---|---|---|---|
| `/api/mobile/tutors` | GET | 모바일 유저 (역할 무관, `getMobileUser`) | 공개 강사 목록 |
| `/api/mobile/tutors/[id]` | GET | 모바일 유저 | 강사 상세 |
| `/api/mobile/tutors/[id]/slots` | GET | 모바일 유저 | `TutorAvailability` |
| `/api/mobile/pricing-plans` | GET | (헬퍼 사용 여부 [미확인] — 응답만 확인) | 요금제 |
| `/api/mobile/push/register` | POST | 모바일 유저 | `PushDevice` 등록 |

### 19.4 미구현

| 경로 | 메서드 | 응답 | 비고 |
|---|---|---|---|
| `/api/mobile/payments/complete` | POST | `501 USE_WEB_CHECKOUT` | 명시적 미구현. 웹 체크아웃 사용 유도 |

### 19.5 mobile parent — 8개 (07-12 신규)

권한: 별도 표기 없으면 `requireMobileParent` (`role=PARENT`, Bearer JWT). 자녀 접근은 `parentChildOrNull(parent.id, studentId)` 소유 검사. 웹 `/api/parent/*`와 1:1 대응.

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/mobile/parent/register` | POST | Public | `{ name, email, password, phone }` | `{ accessToken, refreshToken, ... }` 201 | `createParentAccount` 후 즉시 토큰 발급 |
| `/api/mobile/parent/link` | POST | PARENT | `{ code, via?: "CODE"\|"QR" }` | `{ ok, studentId, alreadyLinked, child }` | 코드/QR로 자녀 연결. INVALID_CODE=404, EXPIRED/USED=409 |
| `/api/mobile/parent/link/[studentId]` | DELETE | PARENT | — | `{ ok }` | 자녀 연결 해제. 미소유 404 |
| `/api/mobile/parent/children` | GET | PARENT | — | `{ children }` | 연결 자녀 목록·요약 |
| `/api/mobile/parent/children/[studentId]/reports` | GET | PARENT | — | `{ reports }` | 자녀 월간 리포트(읽기). 미소유 403 |
| `/api/mobile/parent/children/[studentId]/consultation` | POST | PARENT | `{ note? }` | `{ ok, status, alreadyOpen }` | 자녀 상담 신청. 미소유 403 |
| `/api/mobile/parent/payments` | GET | PARENT | — | `{ children }` | 자녀별 결제·청구 이력 그룹 |
| `/api/mobile/parent/profile` | GET/PATCH | PARENT | PATCH `{ name?, phone? }` | GET `{ name, phone, email }` / PATCH `{ ok }` | 이름·전화 수정 |

### 19.6 mobile teacher — 15개 (07-12 신규)

권한: 데이터 계열 `requireMobileTeacher`(승인 강사), 프로필·홈 계열 `requireMobileTeacherAllowPending`(미승인 강사 포함). 담당 학생 접근은 `requireTeacherStudentMatch(teacher.id, studentId)` 검사. 웹 `/api/teacher/*`와 1:1 대응.

| 경로 | 메서드 | 권한 | 요청/응답 | 비고 |
|---|---|---|---|---|
| `/api/mobile/teacher/home` | GET | AllowPending | `{ approved, name, todayLessonCount, upcomingLessons }` | 대시보드 요약 |
| `/api/mobile/teacher/profile` | GET/PATCH | AllowPending | `{ teacher, profile }` / `{ intro?, career?, education?, certificates?, photoUrl? }` | `PUBLIC_TEACHERS_CACHE_TAG` 재검증 |
| `/api/mobile/teacher/profile/photo` | POST | AllowPending (multipart) | `file` → `{ photoUrl }` | Supabase Storage |
| `/api/mobile/teacher/profile/documents` | GET/POST/DELETE | AllowPending | POST multipart(`file`,`type`) / DELETE `{ url, type }` | 서명 URL 반환 |
| `/api/mobile/teacher/homework-templates` | GET/POST | Teacher | POST `{ title/name, subject?, defaultDays/days: 4\|7, tasks }` → `{ template }` | 본인 소유 목록 |
| `/api/mobile/teacher/homework-templates/[templateId]` | PATCH/DELETE | Teacher | 부분 수정 / 삭제 204 | 소유 검사 |
| `/api/mobile/teacher/lessons` | GET | Teacher | `?studentId=&status=&upcoming=1` → `{ lessons }` | 담당 수업 |
| `/api/mobile/teacher/lessons/[id]/cancel` | PATCH | Teacher | `{ lesson, makeup, makeupCreated, makeupSkippedReason }` | 7일 뒤 보충 자동 생성(중복·과거면 skip 사유 반환) |
| `/api/mobile/teacher/plans/[planId]/comment` | PATCH | Teacher | `{ comment }` → `{ plan }` | 매칭 검증. 코멘트 시 `TEACHER_COMMENT` 알림 |
| `/api/mobile/teacher/questions/[id]/answer` | PATCH | Teacher | `{ teacherAnswer }` → `{ question }` | 최초 답변/재편집 지원. `TEACHER_ANSWERED` 알림 |
| `/api/mobile/teacher/students` | GET | Teacher | `{ students }` (firstLessonAt 포함) | 담당 학생 목록 |
| `/api/mobile/teacher/students/[id]/plans` | GET | Teacher | `?date=&month=&templateStart=&templateDays=` → `{ plan\|plans\|dates\|template }` | 강사 관점 플랜 조회 |
| `/api/mobile/teacher/students/[id]/questions` | GET | Teacher | `?date=` → `{ questions }` | 담당 학생 질문 |
| `/api/mobile/teacher/students/[id]/first-lesson` | PATCH/POST | Teacher | `{ date, time, durationMin?, joinUrl? }` → `{ lesson, startDate }` | 첫 수업 설정+자동 숙제 템플릿. v2 플랜 hoursPerLesson 반영. POST는 PATCH로 위임 |
| `/api/mobile/teacher/students/[id]/homework-distribution` | POST | Teacher | `{ startDate, days: 4\|7, tasks[], repeatWeeks?(1-12) }` → `{ plans, dates }` 201 | 주간 숙제 자동 분배(기존 플랜에는 append) |

### 19.7 mobile manager — 15개 (07-12 신규)

권한: 모두 `requireMobileManager` (`role=MANAGER`/`CHIEF_MANAGER`, Bearer JWT). 담당 검사는 `booking.managerId===teacher.id` 또는 CHIEF 우회. 웹 `/api/manager/*`와 1:1 대응.

| 경로 | 메서드 | 요청 | 응답 | 비고 |
|---|---|---|---|---|
| `/api/mobile/manager/consultations/waiting` | GET | — | `{ bookings }` | `WAITING`+`managerId=null` |
| `/api/mobile/manager/consultations/mine` | GET | — | `{ bookings }` | 자기 배정 booking |
| `/api/mobile/manager/consultations/[id]/assign` | PATCH | — | `{ booking }` | self-assign(`WAITING`→`ASSIGNED`), 경합 시 409 |
| `/api/mobile/manager/consultations/[id]/cancel` | PATCH | — | `{ booking }` | 배정 해제(`ASSIGNED`→`WAITING`) |
| `/api/mobile/manager/consultations/[id]/complete` | PATCH | `{ managerNote }` | `{ booking }` | 선생 배정 존재해야 완료 가능 |
| `/api/mobile/manager/consultations/[id]/report` | GET/PUT | `{ goals, subjectLevels?, recommendedPlan?, note? }` | `{ report }` | `ConsultationReport` upsert (웹은 POST/PATCH, 모바일은 **PUT**) |
| `/api/mobile/manager/consultations/[id]/visit-confirmed` | PATCH | `{ visitConfirmedAt: string\|null }` | `{ visitConfirmedAt }` | 방문 일시 확정·해제 |
| `/api/mobile/manager/care-logs` | POST/GET | POST `{ studentId, type, note, visibleToStudent? }` / GET `?studentId=` | `{ log }` 201 / `{ logs }` | `managerOwnsStudent` 검사(CHIEF 우회) |
| `/api/mobile/manager/matches` | GET/POST | POST `{ teacherId, studentId, subjects, startDate?, matchReason?, reassign? }` | `{ students, teachers }` / `{ ok }` 201 | `PENDING_STUDENT_ACCEPT` 생성. ASSIGNED/COMPLETED 상담 필요(CHIEF 우회) |
| `/api/mobile/manager/monitoring` | GET | — | 담당 학생 모니터링 스냅샷 | — |
| `/api/mobile/manager/monitoring/stats` | GET | `?studentId=` | 학생 상세 통계 | 미소유 404 |
| `/api/mobile/manager/parent-link` | POST | `{ studentId, parentId?, parentPhone? }` | `{ ok, alreadyLinked }` 201 | 수동 학부모 연결 |
| `/api/mobile/manager/password-reset` | POST | `{ identifier, newPassword }` | `{ ok, target }` | 학생·학부모 재설정. `AuditLog` |
| `/api/mobile/manager/subscriptions/[id]/pause` | POST | `{ action: "PAUSE"\|"RESUME", until?, reason? }` | `{ subscription }` | PAUSE 최대 35일. 담당 or CHIEF. `AuditLog` |
| `/api/mobile/manager/teacher-approval` | GET/POST | POST `{ teacherId, approve: boolean }` | `{ pendingTeachers }` / `{ ok }` | 미승인 `role=TEACHER`만. 거절=`softDeleteUser`. 캐시 재검증 |

---

## 20. consultation-leads (공개 상담 리드) — 신규

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/consultation-leads` | POST | **Public** | `{ phone, grade, subjects[], name?, gender?, region?, preferredTime?, marketingOptIn?, source?, privacyAgreed(필수 true) }` | `{ lead: { id } }` 201 | 07-12 신규. IP당 5회/10분 인메모리 레이트리밋. 전화·학년·과목 유효성 검사. `consultationSubmitted` 분석 이벤트 |
| `/api/consultation-leads` | GET | ADMIN/CHIEF (`requireAdmin`) | `?page&limit&status` | `{ leads, total, page, limit }` | 리드 목록(페이지네이션) |
| `/api/consultation-leads` | PATCH | ADMIN/CHIEF (`requireAdmin`) | `{ id, status?, note? }` | `{ lead }` | 상태·메모 갱신 |

## 21. parent (웹 학부모 포털) — 신규

권한: 별도 표기 없으면 `requireParent` (NextAuth `role=PARENT`). 자녀 접근은 `parentOwnsStudent(parent.id, studentId)`. 모바일 `/api/mobile/parent/*`와 1:1 대응.

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/parent/register` | POST | **Public** | `{ name, email, password, phone }` | `{ ok }` 201 | `createParentAccount`. 로그인은 NextAuth로 별도. `parentRegistered` 이벤트 |
| `/api/parent/link` | POST | PARENT | `{ code, via?: "CODE"\|"QR" }` | `{ ok, studentId, alreadyLinked }` | 코드/QR 자녀 연결. INVALID_CODE=404, EXPIRED/USED=409 |
| `/api/parent/link/[studentId]` | DELETE | PARENT | — | `{ ok }` | 연결 해제. 미소유 404 |
| `/api/parent/children` | GET | PARENT | — | `{ children }` | 연결 자녀 목록·요약 |
| `/api/parent/children/[studentId]/reports` | GET | PARENT | — | `{ reports }` | 자녀 리포트(읽기). 미소유 403 |
| `/api/parent/children/[studentId]/consultation` | POST | PARENT | `{ note? }` | `{ ok, status, alreadyOpen }` | 자녀 상담 신청. 미소유 403 |
| `/api/parent/payments` | GET | PARENT | — | `{ children }` | 자녀별 결제·청구 이력 |
| `/api/parent/profile` | GET/PATCH | PARENT | PATCH `{ name?, phone? }` | GET `{ name, phone }` / PATCH `{ ok }` | 이름·전화 수정 |

## 22. question-images (질문 이미지 프록시) — 07-04 표 누락분

| 경로 | 메서드 | 권한 | 요청 | 응답 | 비고 |
|---|---|---|---|---|---|
| `/api/question-images/[...path]` | GET | 로그인 유저(role별 접근 검사) | 경로 `[studentId]/...` | 이미지 바이너리 (private, max-age=3600) | 07-04 표에서 누락됐던 기존 라우트. ADMIN/CHIEF/MANAGER는 전체 허용, STUDENT는 본인, TEACHER는 담당(`teacherStudent`/`managerStudent`) 소유만. 경로 순회 방어 |

---

## 부록. 특이 사항 (보안·설계 관점)

1. **`/api/register/teacher/documents`가 세션 없이 `teacherId`만으로 업로드 허용** — 다른 강사 문서 위·변조 위험. 실측 후 재확인 필요.
2. **`/api/webhooks/toss` 서명 미검증** — Toss 서명 헤더가 있는 경우 활용하지 않고 서버 재조회에만 의존. 위조 방지에는 충분하나 처리 지연·재플레이 관점 `[미확인]`.
3. **`requireAdmin`이 `CHIEF_MANAGER`를 통과** — Chief는 admin API를 대부분 호출 가능. 미들웨어는 `/admin` UI를 열지 않아 UI/API 접근 정책이 비대칭.
4. **`/api/manager/teacher-approval`과 `/api/chief-manager/teacher-approval`이 동일 로직 중복** — 유지보수 리스크.
5. **모바일 tutors 계열이 role 검사 없이 토큰만 확인** — 만료 안 된 어떤 mobile Bearer로도 조회 가능. 공개 정보이므로 정책상 문제 여부 `[미확인]`.
6. **`admin/setup`·`admin/recover`는 non-production에서 secret 없이 통과** — 로컬 개발 편의성. 배포 전 `NODE_ENV` 확인 필수.
7. **Toss 환불 실제 호출 여부 `[미확인]`** — `/api/admin/payments/[id]/refund`가 `PaymentCompletion` 상태만 바꾸는지, Toss `/cancel`을 호출하는지 실측 안 함.
8. **(07-12) `/api/consultation-leads` POST 레이트리밋이 인메모리 Map** — 서버리스 인스턴스별로 분리돼 다중 인스턴스·재시작 시 우회 가능. 공개 엔드포인트이므로 분산 스토어 기반으로 승격 검토.
9. **(07-12) `/api/manager/password-reset`·`/api/mobile/manager/password-reset`** — 매니저가 임의 학생·학부모 비밀번호를 재설정(`findResettableUser`). 강사·매니저·어드민 대상은 아니지만 대면 전제이므로 남용 방지·감사 로그 의존. `AuditLog` 기록됨.
10. **(07-12) `teacher-approval` 가드 완화** — 웹·모바일 모두 `requireManagerOrAbove`로 매니저가 강사 승인/거절(거절=`softDeleteUser`) 가능. 미승인 `role=TEACHER`에만 한정하는 방어 코드 존재.
11. **(07-12) 모바일 report 라우트 메서드 불일치** — `/api/mobile/manager/consultations/[id]/report`는 **PUT**, 웹 동일 기능은 **POST/PATCH**. 클라이언트 공유 코드 작성 시 주의.
