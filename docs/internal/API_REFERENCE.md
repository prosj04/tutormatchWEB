# Concord Private Tutoring — API Reference

> 대상: 백엔드·프론트 통합 담당자  
> 기준: `src/app/api/**/route.ts` 실측 (2026-07-04, 총 **110개** 라우트)  
> 원칙: 정확성 > 완전성. 각 라우트의 `require*()` 헬퍼·`session.user.role` 분기 코드로 권한 결정. 확인 못 한 것은 `[미확인]`.

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
- ⚠️ = 부트스트랩·복구·디버그 성격 (프로덕션 노출 주의).
- 스키마는 핵심 필드만. 응답은 성공 응답 요약.
- `src/app/api/dev/` 디렉토리 **존재하지 않음** — 명시적 개발 전용 라우트 그룹 없음.

## 그룹별 개수

| 그룹 | 라우트 파일 수 |
|---|---|
| account | 1 |
| admin | 30 |
| auth | 1 |
| billing | 2 |
| chief-manager | 1 |
| consultation | 3 |
| cron | 2 |
| events | 1 |
| manager | 13 |
| matches | 1 |
| mobile | 20 |
| notifications | 3 |
| payments | 1 |
| plans | 4 |
| questions | 3 |
| register | 3 |
| student | 3 |
| teacher | 13 |
| webhooks | 1 |
| **합계** | **110** |

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
| `/api/manager/teacher-approval` | GET/POST | ADMIN 또는 CHIEF_MANAGER | `{ teacherId, approve: boolean }` | `{ ok }` | `requireAdmin` 후 role 재확인. `PUBLIC_TEACHERS_CACHE_TAG` 재검증 |

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

## 19. mobile — 20개

권한: `requireMobileStudent` (`role=STUDENT`, HMAC-JWT Bearer). 예외 표기.

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

---

## 부록. 특이 사항 (보안·설계 관점)

1. **`/api/register/teacher/documents`가 세션 없이 `teacherId`만으로 업로드 허용** — 다른 강사 문서 위·변조 위험. 실측 후 재확인 필요.
2. **`/api/webhooks/toss` 서명 미검증** — Toss 서명 헤더가 있는 경우 활용하지 않고 서버 재조회에만 의존. 위조 방지에는 충분하나 처리 지연·재플레이 관점 `[미확인]`.
3. **`requireAdmin`이 `CHIEF_MANAGER`를 통과** — Chief는 admin API를 대부분 호출 가능. 미들웨어는 `/admin` UI를 열지 않아 UI/API 접근 정책이 비대칭.
4. **`/api/manager/teacher-approval`과 `/api/chief-manager/teacher-approval`이 동일 로직 중복** — 유지보수 리스크.
5. **모바일 tutors 계열이 role 검사 없이 토큰만 확인** — 만료 안 된 어떤 mobile Bearer로도 조회 가능. 공개 정보이므로 정책상 문제 여부 `[미확인]`.
6. **`admin/setup`·`admin/recover`는 non-production에서 secret 없이 통과** — 로컬 개발 편의성. 배포 전 `NODE_ENV` 확인 필수.
7. **Toss 환불 실제 호출 여부 `[미확인]`** — `/api/admin/payments/[id]/refund`가 `PaymentCompletion` 상태만 바꾸는지, Toss `/cancel`을 호출하는지 실측 안 함.
