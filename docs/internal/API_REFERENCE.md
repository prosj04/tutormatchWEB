# Concord — API Reference (전수조사)

> 기준일: **2026-09-30** · 작업 위치: `premium-tutoring-redesign` 워크트리 (읽기 전용 조사)
> 실측: `src/app/api/**/route.ts` = **162개**, `src/app/**/page.tsx` = **55개**
> 방법: 162개 라우트 파일 전수 파싱(메서드·가드 헬퍼·prisma 연산·lib 임포트·쿼리/바디 필드) + `src/**`·`mobile/**` 의 `/api/...` 문자열 전수 grep + 페이지→컴포넌트 임포트 그래프(`next/dynamic` 포함) 추적.
> 원칙: 정확성 > 완전성. 확인하지 못한 것은 `[미확인]`. 기계 판독용 동일 데이터는 `/tmp/redesign/api-inventory.json`.
>
> 이전 판(2026-07-13, 173개) 대비 **-11**. 아래 [§7 이력](#7-이력)에 제거·추가 내역과 07-12·07-13 증분 요약을 보존.

## 범례

- **가드** 열은 라우트 파일에서 실제 호출되는 헬퍼명을 그대로 적는다. 헬퍼가 통과시키는 역할은 아래 표 참조.
- **부작용**: `DB쓰기`(모델.연산) / `알림`(Notification 생성 + Expo 푸시 + 조건부 SOLAPI 알림톡·SMS) / `감사`(AuditLog) / `분석`(AnalyticsEvent) / `결제`(Toss API) / `스토리지`(Supabase) / `캐시`(revalidateTag). lib 경유 부작용까지 전이 추적했다.
- **웹 호출처**: `src/` 기준 상대 경로. 모바일 전용 라우트는 `mobile/` 기준 경로를 적는다.
- ⚠️ = 부트스트랩·디버그·무인증 쓰기 등 주의 대상. 전체 목록은 [§6 위험·주의](#6-위험주의).
- 웹은 NextAuth 쿠키 세션, 모바일(`/api/mobile/*`)은 `Authorization: Bearer <HMAC-SHA256 JWT>`(`MOBILE_JWT_SECRET`, 미설정 시 `AUTH_SECRET` 폴백). 두 체계는 별개다.
- `src/app/api/dev/` 없음 — 명시적 개발 전용 라우트 그룹은 존재하지 않는다.

## 가드 헬퍼 (정의 실측)

| 헬퍼 | 정의 파일 | 통과 역할 | 추가 검증 |
|---|---|---|---|
| `requireRole(roles)` | `lib/require-role.ts` | 인자로 받은 역할 | 세션 없음 401 / 역할 불일치 403 |
| `requireRoleRevalidated(roles)` | `lib/require-role.ts` | 동일 | + `User` 재조회로 `deletedAt`·`role` 즉시 반영 |
| `requireAdmin` | `lib/admin-auth.ts` | `ADMIN` | revalidated |
| `requireChiefManagerOrAdmin` | `lib/admin-auth.ts` | `ADMIN`·`CHIEF_MANAGER` | revalidated |
| `requireManagerOrAbove` | `lib/admin-auth.ts` | `ADMIN`·`CHIEF_MANAGER`·`MANAGER` | revalidated |
| `requireManager` | `lib/manager-auth.ts` | `ADMIN`·`MANAGER`·`CHIEF_MANAGER` | `Teacher` 레코드 필수(없으면 404) + revalidate |
| `requireTeacherAllowPending` | `lib/teacher-auth.ts` | `TEACHER`·`MANAGER`·`CHIEF_MANAGER` | `Teacher` 레코드 필수, 승인 여부 무관 |
| `requireTeacher` | `lib/teacher-auth.ts` | 동일 | `TEACHER`는 `approved=true`만 (403) |
| `requireStudent` | `lib/student-auth.ts` | `STUDENT` | `Student` 레코드 필수 + deletedAt/role 재검증 |
| `requireParent` | `lib/parent-page-auth.ts` | `PARENT` | `Parent` 레코드 필수 + deletedAt/role 재검증 |
| `requireParentPage` | `lib/parent-page-auth.ts` | `PARENT` | 페이지용 — 실패 시 `/login` 리다이렉트 |
| `requireNotificationUser` | `lib/notification-auth.ts` | 로그인 유저 전체 | 역할 제한 없음(자기 알림만 다룸) |
| `requireMobileUser` | `lib/mobile-auth.ts` | 모바일 전체 역할 | Bearer access 토큰 + `tokenVersion` + deletedAt |
| `requireMobileStudent` | `lib/mobile-auth.ts` | `STUDENT`(모바일) | `Student` 레코드 필수 |
| `requireMobileParent` | `lib/mobile-auth.ts` | `PARENT`(모바일) | `Parent` 레코드 필수 |
| `requireMobileTeacherAllowPending` | `lib/mobile-auth.ts` | `TEACHER`·`MANAGER`·`CHIEF_MANAGER`(모바일) | `Teacher` 레코드 필수 |
| `requireMobileTeacher` | `lib/mobile-auth.ts` | 동일 | `TEACHER`는 `approved=true`만 |
| `requireMobileManager` | `lib/mobile-auth.ts` | `MANAGER`·`CHIEF_MANAGER`·`ADMIN`(모바일) | `Teacher` 레코드 필수 |
| `requireTeacherStudentMatch(t,s)` | `lib/teacher-student-match.ts` | — | 활성 `TeacherStudent` 없으면 403 (역할 가드와 조합) |
| `authorizeCron` | `lib/cron-auth.ts` | — | `Authorization: Bearer <CRON_SECRET>` 일치만. `x-vercel-cron` 헤더는 불신. `CRON_SECRET` 미설정 시 500 |
| `getMobileUser` | `lib/mobile-auth.ts` | — | 서명·만료·`tokenVersion`·`deletedAt` 검증 후 payload 반환(역할 무제한) |

`auth()` 직접 호출 + 인라인 `session.user.role` 비교를 쓰는 라우트가 9개 있다(가드 열에 `auth() role=...`로 표기): `account/delete`, `account/password`, `billing/autorenew`, `billing/register-success`, `payments/complete`, `register/teacher`(PATCH), `register/teacher/documents`, `question-images/[...path]`, `events`.

## 1. 그룹별 개수

| 그룹 | 라우트 수 | 비고 |
|---|---|---|
| mobile | 61 | auth 4 · me 5 · student 계열 14 · parent 8 · teacher 17 · manager 13 |
| admin | 29 | cms 7 · teachers 5 · data 2 · matches 2 · payments 2 · students 2 · 단독 9 |
| teacher (웹) | 17 | |
| manager (웹) | 15 | |
| parent (웹) | 5 | |
| plans | 4 | 학생 학습 플래너 |
| student | 4 | |
| consultation | 3 | 학생 상담 |
| notifications | 3 | |
| questions | 3 | 학생 Q&A |
| register | 3 | |
| account | 2 | |
| auth | 2 | |
| billing | 2 | |
| cron | 2 | |
| chief-manager | 1 | |
| consultation-leads | 1 | 공개 리드 |
| events | 1 | |
| matches | 1 | |
| payments | 1 | |
| question-images | 1 | |
| webhooks | 1 | |
| **합계** | **162** | |

## 2. 그룹별 라우트

### 2.1 account — 2

| 경로 | 메서드 | 가드 | 요약 (입력 → 응답) | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/account/delete` | POST | `auth()` 로그인 유저(역할 무관) | 본인 계정 탈퇴(소프트삭제). → `{ ok }` | DB쓰기 `user·student·teacher·parent·parentStudent·teacherStudent·lesson·subscription·consultationBooking` (`softDeleteUser`), 감사 `ACCOUNT_DELETE` | `app/dashboard/account/AccountClient.tsx`, `app/parent/account/AccountForms.tsx`, `components/account/AccountDeleteSection.tsx` |
| `/api/account/password` | POST | `auth()` 로그인 유저(역할 무관) | `{ currentPassword, newPassword }` → `{ ok }`. `changeOwnPassword` 위임(실패 시 헬퍼가 status 결정) | DB쓰기 `user.update`(비밀번호 + tokenVersion) | `app/dashboard/account/AccountClient.tsx`, `app/parent/account/AccountForms.tsx` |

### 2.2 admin — 29

권한: 별도 표기 없으면 `requireChiefManagerOrAdmin`(=`ADMIN`·`CHIEF_MANAGER`). 역할 변경만 `requireAdmin`.

| 경로 | 메서드 | 가드 | 요약 (입력 → 응답) | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/admin/audit-logs` | GET | `requireChiefManagerOrAdmin` | `?page&take&targetType` → 감사 로그 목록 + 대상(user/student/teacher) 이름 조인 | 없음(읽기) | `components/admin/AdminAuditLogsPage.tsx` |
| `/api/admin/check-alerts` | POST | `requireChiefManagerOrAdmin` | 알림 점검 배치 수동 실행(`runAlertChecks`) → 점검 결과 카운트 | DB쓰기 `notification·satisfactionCheckin·subscription·paymentCompletion·teacherStudent·consultationBooking`, 알림, 결제(자동청구 Toss 호출 포함) | `components/admin/AdminDashboard.tsx` |
| `/api/admin/cms/content` | GET·PATCH | `requireChiefManagerOrAdmin` | GET 사이트 콘텐츠 전체 / PATCH `{ section, key, value }` upsert | DB쓰기 `siteContent.upsert`, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/faq` | GET·POST | `requireChiefManagerOrAdmin` | FAQ 목록 / `{ question, answer }` 생성(order 자동) | DB쓰기 `faqItem.create`, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/faq/[id]` | PATCH·DELETE | `requireChiefManagerOrAdmin` | `{ question?, answer?, order?, isActive?, showOnHome?, showOnFaqPage? }` 수정 / 삭제 | DB쓰기 `faqItem.update·delete`, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/init` ⚠️ | POST | `requireChiefManagerOrAdmin` | `?force=` CMS 기본 콘텐츠 시딩(`cms-seed`) | DB쓰기 `siteContent·faqItem·testimonial` 대량 create/update/delete, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/testimonials` | GET·POST | `requireChiefManagerOrAdmin` | 후기 목록 / `{ quote, author, title?, imageUrl? }` 생성 | DB쓰기 `testimonial.create`, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/testimonials/[id]` | PATCH·DELETE | `requireChiefManagerOrAdmin` | 후기 수정(`quote·author·category·gradeFrom/To·imageUrl·order·isActive·showOnHome·showOnReviewsPage`) / 삭제 | DB쓰기 `testimonial.update·delete`, 캐시 | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/cms/upload-image` | POST | `requireChiefManagerOrAdmin` | multipart `file` → CMS 이미지 업로드 후 공개 URL | 스토리지 Supabase | `components/admin/AdminCmsPage.tsx` |
| `/api/admin/data/plans` | GET | `requireChiefManagerOrAdmin` | `?q&from&to` 학습 플랜 원시 데이터 조회(페이지네이션) | 없음(읽기) | `components/admin/AdminDataPage.tsx` |
| `/api/admin/data/questions` | GET | `requireChiefManagerOrAdmin` | `?q&from&to&resolved` 질문 원시 데이터 조회 | 없음(읽기) | `components/admin/AdminDataPage.tsx` |
| `/api/admin/db-check` ⚠️ | GET | `requireChiefManagerOrAdmin` | DB 연결·환경(`DATABASE_URL`·`DIRECT_URL`·`NEXT_PUBLIC_SUPABASE_URL`·`VERCEL`·`VERCEL_ENV` 존재 여부) 진단 + 학생 수/샘플 | 없음(읽기) | **없음** (디버그 전용) |
| `/api/admin/funnel` | GET | `requireChiefManagerOrAdmin` | `?days=` 퍼널 집계(`analytics-funnel`) | 없음(읽기) | `components/admin/AdminFunnelPage.tsx` |
| `/api/admin/matches` | GET·POST | `requireChiefManagerOrAdmin` | 매칭 목록 / `{ studentId, teacherId, subjects, startDate? }` 매칭 생성·재활성 | DB쓰기 `teacherStudent.create·update`, 알림, 분석 | `components/admin/AdminMatchesPage.tsx` |
| `/api/admin/matches/[id]` | PATCH·DELETE | `requireChiefManagerOrAdmin` | `{ subjects?, startDate?, isActive? }` 수정 / 매칭 삭제(+예정 수업 정리) | DB쓰기 `teacherStudent.update·delete`, `lesson.updateMany` | `components/admin/AdminMatchesPage.tsx` |
| `/api/admin/metrics` | GET | `requireChiefManagerOrAdmin` | 운영 지표 집계(상담·수업·매칭·결제·케어로그 기반, 417줄) | 없음(읽기) | `components/admin/AdminMetricsPage.tsx` |
| `/api/admin/payments` | GET | `requireChiefManagerOrAdmin` | `?status=` 결제 이력 목록 | 없음(읽기) | `components/admin/AdminPaymentsPage.tsx` |
| `/api/admin/payments/[id]/refund` | POST | `requireChiefManagerOrAdmin` | `{ reason }` 환불 처리 → 상태 `REFUNDED` + 서비스 중단 | DB쓰기 `paymentCompletion.updateMany`, `subscription·billingProfile.update`(`stopServiceAfterRefund`), 결제 Toss cancel, 감사 | `components/admin/AdminPaymentsPage.tsx` |
| `/api/admin/recover` ⚠️ | POST | Public + `ADMIN_SETUP_SECRET`(프로덕션) + IP 5회/10분 | `{ email, newPassword, secretKey }` → ADMIN 비밀번호 재설정. ADMIN 0명이면 404 | DB쓰기 `user.update`(+tokenVersion) | `app/login/LoginForm.tsx` |
| `/api/admin/settlements` | GET | `requireChiefManagerOrAdmin` | `?year&month`(기본 전월 KST) 강사 월별 정산 리포트 | 없음(읽기) | `components/admin/AdminSettlementsPage.tsx` |
| `/api/admin/setup` ⚠️ | POST | Public + `ADMIN_SETUP_SECRET`(프로덕션). ADMIN/CHIEF 1명 이상이면 항상 403 | `{ email, password, secretKey }` → 최초 ADMIN 생성 201 | DB쓰기 `user.create` | `app/login/LoginForm.tsx` |
| `/api/admin/stats` | GET | `requireChiefManagerOrAdmin` | 대시보드 통계(학생·강사·매칭·상담·질문 카운트) | 없음(읽기) | `components/admin/AdminDashboard.tsx` |
| `/api/admin/students` | GET | `requireChiefManagerOrAdmin` | `?q&grade&subject&unmatchedFor` 학생 목록 + 매칭 상태 | 없음(읽기) | `components/admin/AdminStudentsPage.tsx`, `components/admin/AdminMatchesPage.tsx` |
| `/api/admin/students/[id]` | PATCH·DELETE | `requireChiefManagerOrAdmin` | `{ name?, grade?, phone?, subjects? }` 수정 / 계정 소프트삭제 | DB쓰기 `student.update`, `softDeleteUser` 전체, 감사 | `components/admin/AdminStudentsPage.tsx` |
| `/api/admin/teachers` | GET | `requireChiefManagerOrAdmin` | `?q&status` 강사 목록(페이지네이션) | 없음(읽기) | `components/admin/AdminTeachersPage.tsx`, `components/admin/AdminMatchesPage.tsx`, `components/admin/CmsPublicTeachersPanel.tsx` |
| `/api/admin/teachers/[id]` | PATCH·DELETE | `requireChiefManagerOrAdmin` | `{ approved?, name?, subjects?, bio?, education?, experience?, gender?, hourlyRateKrw? }` 수정 / 소프트삭제 | DB쓰기 `teacher.update`, `softDeleteUser`, 캐시(공개 강사) | `components/admin/AdminTeachersPage.tsx`, `components/admin/CmsPublicTeachersPanel.tsx` |
| `/api/admin/teachers/[id]/documents` | GET·DELETE | `requireChiefManagerOrAdmin` | 강사 서류 서명 URL 목록 / `{ type, url }` 삭제 | DB쓰기 `teacherProfile.upsert`, 스토리지 Supabase | `components/admin/AdminTeachersPage.tsx`, `app/chief-manager/teacher-approval/page.tsx` |
| `/api/admin/teachers/[id]/photo` | POST | `requireChiefManagerOrAdmin` | multipart `file` → 강사 프로필 사진 교체 | DB쓰기 `teacherProfile.upsert`, 스토리지, 캐시 | `components/admin/AdminTeachersPage.tsx`, `components/admin/CmsPublicTeachersPanel.tsx` |
| `/api/admin/teachers/[id]/role` | PATCH | **`requireAdmin`** (ADMIN 전용) | `{ role }` → `User.role` 변경 | DB쓰기 `user.update`, 감사, 캐시 | `components/admin/AdminTeachersPage.tsx` |

### 2.3 auth — 2

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET·POST | NextAuth handlers (Public) | `@/auth` 의 `handlers` 재수출. Credentials 로그인·세션·CSRF | 로그인 레이트리밋 스토어(인메모리) | `app/login/LoginForm.tsx`(`signIn`), `components/providers/AppSessionProvider.tsx` |
| `/api/auth/login-status` | POST | Public | `{ identifier }` → `{ locked }`. 브루트포스 잠금 여부만. 계정 존재 여부 비노출, 항상 200 | 없음 | `app/login/LoginForm.tsx` |

### 2.4 billing — 2

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/billing/autorenew` | POST | `auth()` role=STUDENT | `{ enabled: boolean }` → `{ ok, autoRenew }`. billingKey는 유지 | DB쓰기 `billingProfile.update` | `components/payments/BillingManageSection.tsx` |
| `/api/billing/register-success` | GET | `auth()` role=STUDENT | Toss 빌링 인증 리다이렉트 도착점. `?authKey&customerKey`(`student-{id}` 규약, 세션 학생과 일치 필수) → `issueBillingKey` 교환 후 `/payments?billing=…` 리다이렉트 | DB쓰기 `billingProfile.upsert`, 결제 Toss billing issue | `components/payments/BillingManageSection.tsx`(successUrl) |

### 2.5 chief-manager — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/chief-manager/teacher-approval` | GET·POST | `requireChiefManagerOrAdmin` | 승인 대기 강사 목록 / `{ teacherId, approve, reason? }` 승인·반려. 반려 시 `softDeleteUser` | DB쓰기 `teacher.update`(+소프트삭제), 캐시, 감사·알림톡(`teacher-rejection`) | `app/chief-manager/teacher-approval/page.tsx` |

### 2.6 consultation (학생) — 3

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/consultation/my-booking` | GET | `requireStudent` | 내 상담 예약 현황(`consultation-booking-dto`) | 없음(읽기) | `components/dashboard/ConsultationBookingPage.tsx` |
| `/api/consultation/request` | POST | `requireStudent` | `{ note? }` 상담 신청 → `enrollStudent` 위임 | DB쓰기 `consultationBooking.create·update`, `managerStudent.upsert`, 알림, 분석 | `components/dashboard/ConsultationBookingPage.tsx` |
| `/api/consultation/visit-times` | PATCH | `requireStudent` | `{ visitPreferredTimes }` 방문 희망 시간 저장 | DB쓰기 `consultationBooking.update`, 알림(매니저) | `components/dashboard/ConsultationBookingPage.tsx` |

### 2.7 consultation-leads — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/consultation-leads` | POST | **Public** (IP 5회/10분 인메모리) ⚠️ | `{ phone, grade, subjects[], preferredTime, region, privacyAgreed:true, name?, gender?, marketingOptIn?, source? }` → `{ lead:{id} }` 201. 필수값 화이트리스트 검증 | DB쓰기 `consultationLead.create`, 분석, 외부 웹훅(`CONSULT_ALERT_WEBHOOK_URL`, best-effort) | `components/consultation/ConsultRequestForm.tsx` |
| `/api/consultation-leads` | GET·PATCH | `requireAdmin` | GET `?page&limit&status` 목록 / PATCH `{ id, status?, note? }` | DB쓰기 `consultationLead.update` | `components/admin/AdminLeadsPage.tsx` |

### 2.8 cron — 2

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/cron/check-alerts` | GET | `authorizeCron` | 일일 점검 배치(`runAlertChecks`) — 알림·체크인·구독 만료·자동청구 | DB쓰기 다수(`notification·satisfactionCheckin·subscription·paymentCompletion·teacherStudent·consultationBooking`), 알림, 결제(빌링키 정기결제), SMS | **Vercel Cron** `vercel.json` `0 0 * * *` (코드 호출처 없음) |
| `/api/cron/generate-monthly-reports` | GET | `authorizeCron` | `?month=YYYY-MM` 월간 학부모 리포트 생성(AI 폴백 포함) | DB쓰기 `monthlyReport.upsert`, 알림, 외부 Anthropic(실패 시 템플릿 폴백) | **Vercel Cron** `0 1 1 * *` (코드 호출처 없음) |

### 2.9 events — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/events` ⚠️ | POST | **Public** (IP 30회/분, 페이로드 10KB 제한). 세션·Bearer가 있으면 userId만 첨부 | `{ name, payload?, platform? }` → 204 | DB쓰기 `analyticsEvent.create` | `lib/analytics-client.ts`(웹 전역), `mobile/lib/analytics.ts` |

### 2.10 manager (웹) — 15

권한: 별도 표기 없으면 `requireManager`(`ADMIN`·`MANAGER`·`CHIEF_MANAGER` + `Teacher` 레코드). 학생 소유 검증은 `ConsultationBooking.managerId` 일치 또는 CHIEF 우회.

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/manager/care-logs` | GET·POST | `requireManager` | GET `?studentId=` 케어로그 목록 / POST `{ studentId, type: CONSULT\|INTERVENTION\|CHECK, note, visibleToStudent? }` 201 | DB쓰기 `managerCareLog.create` | `components/teacher-portal/ManagerMonitoringPage.tsx` |
| `/api/manager/consultations/[id]/assign` | PATCH | `requireManager` | 상담을 본인에게 배정(미배정건 선점, `updateMany`로 경합 방지) | DB쓰기 `consultationBooking.updateMany`, 알림 | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/[id]/cancel` | PATCH | `requireManager` | 상담 취소 | DB쓰기 `consultationBooking.update`, 알림 | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/[id]/complete` | PATCH | `requireManager` | `{ managerNote?, nextStep? }` 상담 완료 처리(매칭 존재 여부 확인) | DB쓰기 `consultationBooking.update` | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/[id]/report` | GET·**PUT** | `requireManager` | 상담 리포트 조회 / 저장(upsert) | DB쓰기 `consultationReport.upsert` | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/[id]/visit-confirmed` | PATCH | `requireManager` | `{ visitConfirmedAt: ISO\|null }` 방문 일시 확정·해제 | DB쓰기 `consultationBooking.update`, 알림 | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/mine` | GET | `requireManager` | 내 담당 상담 목록(`manager-portal-data`) | 없음(읽기) | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/consultations/waiting` | GET | `requireManager` | 미배정 대기 상담 목록 | 없음(읽기) | `components/teacher-portal/ManagerConsultationsPage.tsx` |
| `/api/manager/matches` | GET·POST | `requireManager` | GET 매칭 후보(학생·강사) / POST `{ teacherId, studentId, subjects, startDate?, matchReason?, reassign? }` → `PENDING_STUDENT_ACCEPT` 생성. `reassign=true`면 기존 매칭 취소 후 재배정 | DB쓰기 `teacherStudent.upsert·update`, `managerStudent.upsert`, 알림 | `components/teacher-portal/ManagerMatchingPage.tsx`, `components/teacher-portal/ManagerApprovalPage.tsx` |
| `/api/manager/monitoring/stats` | GET | `requireManager` | `?studentId=` 학생 상세 모니터링 통계. 미소유 404 | 없음(읽기) | `components/teacher-portal/ManagerMonitoringPage.tsx` |
| `/api/manager/parent-link` | POST | `requireManager` | `{ studentId, parentId? \| parentPhone? }` 수동 학부모↔학생 연결 201 | DB쓰기 `parentStudent.create`, `parentLinkCode.*` | `components/teacher-portal/ManagerApprovalPage.tsx` |
| `/api/manager/password-reset` | POST | `requireManager` | `{ identifier, newPassword }` — 학생·학부모 계정만 대면 재설정 | DB쓰기 `user.update`, 감사 `PASSWORD_RESET` | `components/teacher-portal/ManagerApprovalPage.tsx` |
| `/api/manager/questions` | GET·POST | **`requireManagerOrAbove`** | 담당 강사 없는 학생 질문 인박스 / `{ questionId, answer }` 매니저 대리 답변 | DB쓰기 `questionMessage.create`, 알림 `TEACHER_ANSWERED` | `components/teacher-portal/ManagerUnassignedQuestions.tsx` |
| `/api/manager/subscriptions/[id]/pause` | POST | `requireManager` | `{ action: PAUSE\|RESUME, until?, reason? }` 구독 일시정지·재개 | DB쓰기 `subscription.update`, 감사 | `components/teacher-portal/ManagerMonitoringPage.tsx` |
| `/api/manager/teacher-approval` | GET·POST | **`requireManagerOrAbove`** | 승인 대기 강사 목록 / `{ teacherId, approve, reason? }` 승인·반려(반려=소프트삭제) | DB쓰기 `teacher.update`+`softDeleteUser`, 캐시, 감사·알림톡 | `components/teacher-portal/ManagerApprovalPage.tsx` |

### 2.11 matches — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/matches/[matchId]/accept` | POST | `requireStudent` | 학생이 배정 선생님 수락(`acceptTeacherStudentMatch` 공용). `PENDING_STUDENT_ACCEPT`→`ACTIVE` 원자적 전환, 이미 ACTIVE면 중복 알림 없음 | DB쓰기 `teacherStudent.updateMany`, 알림(강사), 분석 | `components/dashboard/ConsultationBookingPage.tsx` |

### 2.12 notifications — 3

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/notifications` | GET | `requireNotificationUser`(로그인 전체) | `?summary=` 내 알림 목록 또는 요약(미읽음 카운트) | 없음(읽기) | `components/notifications/NotificationBell.tsx` |
| `/api/notifications/[id]/read` | PATCH | `requireNotificationUser` | 개별 읽음 처리(본인 것만) | DB쓰기 `notification.update` | `components/notifications/NotificationBell.tsx`, `components/notifications/NotificationsPageClient.tsx` |
| `/api/notifications/read-all` | PATCH | `requireNotificationUser` | 전체 읽음 처리 | DB쓰기 `notification.updateMany` | `components/notifications/NotificationBell.tsx`, `components/notifications/NotificationsPageClient.tsx` |

### 2.13 parent (웹) — 5

권한: `requireParent`. 자녀 접근은 `parentOwnsStudent` / `parent-data` 헬퍼 내 검증. 목록·리포트·결제 조회는 **API가 아니라 서버 컴포넌트에서 `lib/parent-data` 직접 호출**이다(07-13 판의 `/api/parent/children`·`/api/parent/payments`·`/api/parent/register`는 현재 없음).

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/parent/children/[studentId]/consultation` | POST | `requireParent` | `{ note? }` 자녀 상담 신청. 미연결 403 | DB쓰기 `consultationBooking.*`, `managerStudent.upsert`, 알림, 분석 | `app/parent/consultation/ConsultationForm.tsx` |
| `/api/parent/link` | POST | `requireParent` | `{ code, via?: CODE\|QR }` 자녀 연결. 레이트리밋 | DB쓰기 `parentStudent.create`, `parentLinkCode.update`, 분석 | `app/parent/LinkChildForm.tsx` |
| `/api/parent/link/[studentId]` | DELETE | `requireParent` | 자녀 연결 해제. 미소유 404 | DB쓰기 `parentStudent.delete` | `app/parent/LinkChildForm.tsx` |
| `/api/parent/payments/complete` | POST | `requireParent` | `{ studentId, orderId, amount, paymentKey?, cashReceipt? }` 자녀 명의 결제 완료. 연결 검증 후 `completeStudentPayment` 위임(멱등). plan은 서버가 amount로 산출 | DB쓰기 `paymentCompletion·subscription·consultationBooking·managerStudent`, 결제 Toss confirm, 알림 | `components/success/SuccessPaymentComplete.tsx` |
| `/api/parent/profile` | GET·PATCH | `requireParent` | 프로필 조회 / `{ name?, phone? }` 수정 | DB쓰기 `parent.update` | `app/parent/account/AccountForms.tsx` |

### 2.14 payments — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/payments/complete` | POST | `auth()` role=STUDENT | `{ orderId, paymentKey, amount, cashReceipt? }` → Chief 매니저 즉시 배정 + 구독 활성. plan은 `planIdFromAmount`로 서버 산출(클라이언트 plan 불신). 오류 매핑 503/409/402 | DB쓰기 `paymentCompletion·subscription·consultationBooking·managerStudent`, 결제 Toss confirm, 알림 | `components/success/SuccessPaymentComplete.tsx` |

### 2.15 plans (학생 플래너) — 4

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/plans` | GET·POST | `requireStudent` | GET `?date\|month\|recent\|before` 플랜 조회 / POST `{ date }` 플랜 생성 | DB쓰기 `studyPlan.create` | `components/dashboard/StudentDashboard.tsx` |
| `/api/plans/[planId]/tasks` | POST·PATCH | `requireStudent` | POST `{ title }` 과제 추가 / PATCH `{ taskIds }` 순서 변경 | DB쓰기 `studyTask.create·update` | `components/dashboard/StudentDashboard.tsx` |
| `/api/plans/copy` | POST | `requireStudent` | `{ sourceDate, targetDate }` 플랜 복사(대상 기존 과제 삭제 후 복제) | DB쓰기 `studyPlan.create`, `studyTask.createMany·deleteMany` | `components/dashboard/StudentDashboard.tsx` |
| `/api/plans/tasks/[taskId]` | PATCH·DELETE | `requireStudent` | `{ title?, isDone?, order? }` 수정 / 삭제. 소유 검증 | DB쓰기 `studyTask.update·delete` | `components/dashboard/StudentDashboard.tsx` |

### 2.16 question-images — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/question-images/[...path]` | GET | `auth()` 세션 **또는** Bearer(`getMobileUser`) + role별 소유 검사 | 경로 `[studentId]/...` 질문 첨부 이미지 프록시. ADMIN/CHIEF/MANAGER 전체 허용, STUDENT 본인, TEACHER는 담당(`teacherStudent`/`managerStudent`)만. 경로 순회(`..`) 방어. `private, max-age=3600` | 스토리지 Supabase download | `lib/question-image-upload.ts`(URL 생성), 웹·앱 `<img>` 직접 참조 |

### 2.17 questions (학생 Q&A, 웹) — 3

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/questions` | GET·POST | `requireStudent` | GET `?date=` 질문 목록 / POST `{ content, date?, imageUrl? }` 질문 등록 + AI 초안 즉답 시도 후 담당 강사에게 라우팅 | DB쓰기 `questionMessage.create·update`, 알림(강사), 외부 Anthropic(실패 시 플레이스홀더) | `components/dashboard/QuestionSection.tsx`, `components/questions/QuestionsPageClient.tsx` |
| `/api/questions/[id]` | PATCH | `requireStudent` | `{ isResolved }` 해결 토글 | DB쓰기 `questionMessage.update` | **없음** — 학생 수동 해결 조작을 UI에서 제거함(`components/dashboard/QuestionCard.tsx` 주석) |
| `/api/questions/[id]/ai-answer` | POST | `requireStudent` | AI 초안 재요청(`resolveAiAnswer`). 이미 있으면 재사용 | 외부 Anthropic, DB쓰기 `questionMessage.*` | `components/dashboard/QuestionSection.tsx`, `components/questions/QuestionsPageClient.tsx` |

### 2.18 register — 3

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/register/student` | POST | **Public** (IP 5회/10분) | `{ name, phone, password, grade, subjects[], guardianPhone?, gender?, region?, instantEnroll? }` 학생 가입. 기존 공개 리드가 있으면 상담 note로 이관. `instantEnroll=true`면 대표 매니저 즉시 배정 | DB쓰기 `user.create`, `consultationLead.update`, `consultationBooking.*`, `managerStudent.upsert`, 알림, 분석 | `components/auth/ConsultationSignupForm.tsx`(전역 모달), `components/success/SuccessPaymentComplete.tsx` |
| `/api/register/teacher` | POST·PATCH | POST **Public**(IP 5회/10분) / PATCH `auth()` role=TEACHER | POST 강사 지원 가입(`name, phone, password, subjects, bio, education, experience, gender?, careerEntries?`) / PATCH `{ resumeUrls[], documentUrls[] }` 본인 서류 URL 등록 | DB쓰기 `user.create`, `teacherProfile.upsert` | `app/register/teacher/page.tsx`, `components/teacher-portal/TeacherPortalApplyClient.tsx` |
| `/api/register/teacher/documents` | POST | `auth()` role=TEACHER (본인 Teacher 레코드 조회) | multipart `file`+`type(resume\|document)` 업로드. 10MB 제한 + 매직바이트로 PDF/JPEG/PNG/WebP 검증(선언 MIME과 일치 필수) → `{ path }` | 스토리지 Supabase | `app/register/teacher/page.tsx` |

### 2.19 student — 4

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/student/parent-link-code` | GET·POST | `requireStudent` | 유효 연결 코드 조회 / 신규 발급 201 | DB쓰기 `parentLinkCode.create` | `app/dashboard/account/AccountClient.tsx` |
| `/api/student/profile` | PATCH | `requireStudent` | `{ grade?, gender?, region?, subjects?, guardianPhone? }` 부분 저장 | DB쓰기 `student.update` | `components/auth/ConsultationSignupForm.tsx` |
| `/api/student/question-images` | POST | `requireStudent` | multipart `file` → `{ url }`(인증 필요한 내부 프록시 URL). `uploadQuestionImage` 공용 | 스토리지 Supabase | `lib/question-image-upload.ts`, `lib/supabase-client.ts` |
| `/api/student/satisfaction-checkins/[id]/respond` | POST | `requireStudent` | `{ score: 1-5, comment?(≤500) }`. 본인·미응답 건만. score≤3이면 매니저에게 `SATISFACTION_LOW_SCORE` | DB쓰기 `satisfactionCheckin.update`, 알림 | `components/dashboard/StudentDashboard.tsx` |

### 2.20 teacher (웹) — 17

권한: 운영 라우트는 `requireTeacher`(TEACHER는 승인 필수), 온보딩(프로필·서류·사진)은 `requireTeacherAllowPending`. 학생별 라우트는 `requireTeacherStudentMatch` 추가.

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 웹 호출처 |
|---|---|---|---|---|---|
| `/api/teacher/homework-templates` | GET·POST | `requireTeacher` | 숙제 템플릿 목록 / `{ name\|title, subject?, tasks, days\|defaultDays }` 생성 | DB쓰기 `homeworkTemplate.create` | `components/teacher-portal/TeacherPlanClient.tsx` |
| `/api/teacher/homework-templates/[templateId]` | PATCH·DELETE | `requireTeacher` | 템플릿 수정 / 삭제 | DB쓰기 `homeworkTemplate.update·delete` | **없음** — 웹 UI는 생성·조회만 노출 |
| `/api/teacher/lessons` | GET | `requireTeacher` | `?studentId&status&upcoming=1` 수업 목록 | 없음(읽기) | `components/teacher-portal/TeacherStudentsManager.tsx` |
| `/api/teacher/lessons/[id]/cancel` | PATCH | `requireTeacher` | `{ reason, makeupAt? }` 수업 취소(`cancelledBy=TEACHER`) + 7일 뒤 동시간 보충 수업 자동 생성 | DB쓰기 `lesson.update·create`, 알림 | `components/teacher-portal/TeacherStudentsManager.tsx` |
| `/api/teacher/lessons/[id]/confirm` | PATCH | `requireTeacher` | `{ outcome: COMPLETED }` 또는 `{ outcome: NOT_HELD, fault: STUDENT\|NOT_STUDENT, reason }`. `NOT_HELD`+`NOT_STUDENT`면 원 수업 CANCELLED + 대체 수업 이월 생성 | DB쓰기 `lesson.update·create`, `studySession.create·delete`, 알림 | `components/teacher-portal/TeacherLessonConfirmCard.tsx` |
| `/api/teacher/lessons/pending-confirm` | GET | `requireTeacher` | 종료된 확인 대기 수업 목록 | 없음(읽기) | `components/teacher-portal/TeacherLessonConfirmCard.tsx` |
| `/api/teacher/plans/[planId]/comment` | PATCH | `requireTeacher` + `requireTeacherStudentMatch` | `{ comment }` 플랜 코멘트 | DB쓰기 `studyPlan.update`, 알림(학생) | `components/teacher-portal/TeacherPlanClient.tsx` |
| `/api/teacher/profile` | GET·PATCH | `requireTeacherAllowPending` | 프로필 조회 / `{ intro?, education?, career?, certificates?, photoUrl? }` 저장 | DB쓰기 `teacherProfile.upsert`, 캐시 | `components/teacher-portal/TeacherProfileEditor.tsx` |
| `/api/teacher/profile/documents` | GET·POST·DELETE | `requireTeacherAllowPending` | 서류 목록(서명 URL) / multipart 업로드 / `{ type, url }` 삭제 | DB쓰기 `teacherProfile.upsert`, 스토리지 | `components/teacher-portal/TeacherProfileEditor.tsx` |
| `/api/teacher/profile/photo` | POST | `requireTeacherAllowPending` | multipart `file` 본인 사진 업로드(service-role 클라이언트) | DB쓰기 `teacherProfile.upsert`, 스토리지, 캐시 | `components/teacher-portal/TeacherProfileEditor.tsx` |
| `/api/teacher/questions/[id]/answer` | PATCH | `requireTeacher` + `requireTeacherStudentMatch` | `{ teacherAnswer }` 질문 답변 | DB쓰기 `questionMessage.update`, 알림 `TEACHER_ANSWERED` | `components/teacher-portal/TeacherQuestionsClient.tsx` |
| `/api/teacher/settlements` | GET | `requireTeacher` | `?month=YYYY-MM`(기본 현재 KST 월) 본인 정산. admin과 동일 KST 월경계·`TEACHER_HOURLY_RATE_KRW`·환불 제외. `durationMin=0`은 합계 제외 + `needsReview` | 없음(읽기) | `components/teacher-portal/TeacherSettlementsClient.tsx` |
| `/api/teacher/students` | GET | `requireTeacher` | 담당 학생 목록 + 최근 수업 | 없음(읽기) | `components/teacher-portal/TeacherStudentsManager.tsx` |
| `/api/teacher/students/[id]/first-lesson` | POST·PATCH | `requireTeacher` + `requireTeacherStudentMatch` | `{ date, time, durationMin?, joinUrl? }` 첫 수업 지정·수정. 구독 요금제 기준 회차 생성, `ENABLE_AUTO_HOMEWORK_DISTRIBUTION` 시 숙제 자동 분배 | DB쓰기 `lesson.create·update`, `teacherStudent.update`, `studyPlan.create·update`, 알림 | `components/teacher-portal/TeacherStudentsManager.tsx` |
| `/api/teacher/students/[id]/homework-distribution` | POST | `requireTeacher` + `requireTeacherStudentMatch` | `{ tasks, days, startDate, repeatWeeks? }` 가중치 기반 숙제 분배 | DB쓰기 `studyPlan.create·update` | `components/teacher-portal/TeacherPlanClient.tsx` |
| `/api/teacher/students/[id]/plans` | GET | `requireTeacher` + `requireTeacherStudentMatch` | `?date\|month\|templateStart&templateDays` 학생 플랜 조회 | 없음(읽기) | `components/teacher-portal/TeacherPlanClient.tsx` |
| `/api/teacher/students/[id]/questions` | GET | `requireTeacher` + `requireTeacherStudentMatch` | `?date=` 학생 질문 목록 | 없음(읽기) | `components/teacher-portal/TeacherQuestionsClient.tsx` |

### 2.21 webhooks — 1

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/webhooks/toss` ⚠️ | POST | **Public** — 서명 검증 없음. 대신 `paymentKey`로 Toss API 재조회해 본문을 불신 | `PAYMENT_STATUS_CHANGED` 처리. `DONE`→`completeStudentPayment` 멱등 실행, `CANCELED`→`REFUNDED` 수렴 + 서비스 중단. 인식된 이벤트는 항상 200(Toss 재시도 방지) | DB쓰기 `paymentCompletion.updateMany`, `subscription·billingProfile.update`, 결제 Toss 재조회, 알림 | **Toss Payments (외부)** |

### 2.22 mobile — 61

전부 Bearer HMAC-JWT 인증(`lib/mobile-auth.ts`). 호출처는 `mobile/` 기준 경로. 웹에서 호출하는 모바일 라우트는 **`/api/mobile/qna` 하나**뿐이다(웹 학생 대시보드·질문 페이지가 재사용).

#### 2.22.1 mobile/auth — 4

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/auth/login` | POST | **Public** (로그인 레이트리밋) | `{ identifier, password }` → access(1h)·refresh(30d) 토큰. 전화·이메일 로그인 모두 | 없음(읽기) | `lib/api.ts` |
| `/api/mobile/auth/logout` | POST | `requireMobileUser` | `tokenVersion +1` → 전 기기 토큰 폐기 | DB쓰기 `user.update` | `lib/api.ts` |
| `/api/mobile/auth/refresh` | POST | refresh 토큰 서명 + `tokenVersion` 검증 | `{ refreshToken }` → 신규 토큰 쌍 | 없음(읽기) | `lib/api.ts` |
| `/api/mobile/auth/register` | POST | **Public** (IP 레이트리밋) | `{ name, phone, password, email?, guardianConsent?, consultation? }` 학생 가입 + 토큰 발급. 상담 정보 동봉 시 즉시 상담 생성 | DB쓰기 `user.create`, `student.update`, `consultationBooking.*`, `managerStudent.upsert`, 알림, 분석 | `app/(auth)/signup.tsx` |

#### 2.22.2 mobile/me — 5

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/me` | GET·DELETE | `requireMobileStudent` | GET 프로필+구독+학습단계(Promise.all 1 RTT) / DELETE 계정 소프트삭제 | DELETE: `softDeleteUser` 전체 쓰기, 감사 | `app/(tabs)/my.tsx`, `app/billing.tsx`, `app/checkout/success.tsx`, `lib/student-journey.ts` |
| `/api/mobile/me/journey` | GET | `requireMobileStudent` | 학습 단계 + 상담 상태 스냅샷 | 없음(읽기) | `app/index.tsx`, `app/consult/status.tsx`, `lib/student-journey.ts` |
| `/api/mobile/me/parent-link-code` | GET·POST | `requireMobileStudent` | 유효 코드 조회 / 신규 발급 | DB쓰기 `parentLinkCode.create` | `app/(tabs)/my.tsx` |
| `/api/mobile/me/password` | POST | `getMobileUser`(역할 무관) | `{ currentPassword, newPassword }` | DB쓰기 `user.update` | `app/change-password.tsx`, `app/(parent)/my.tsx`, `app/(teacher)/my.tsx` |
| `/api/mobile/me/tokens` | GET | `requireMobileStudent` | AI 질답 토큰 잔여 | 없음(읽기) | `app/(tabs)/learning.tsx` |

#### 2.22.3 mobile 학생 계열 — 14

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/consultation` | POST | `requireMobileStudent` | `{ grade?, gradeLevel?, subjects?, memo? }` 상담 신청(`enrollStudent`) | DB쓰기 `student.update`, `consultationBooking.*`, `managerStudent.upsert`, 알림, 분석 | `app/consult/index.tsx` |
| `/api/mobile/home` | GET | `requireMobileStudent` | 홈 집계 — 오늘 수업 + 주간 달성률 + 다가오는 일정 + 미읽음 알림 수 | 없음(읽기) | `app/(tabs)/index.tsx` |
| `/api/mobile/learning/weekly` | GET | `requireMobileStudent` | 주간 학습시간 + 이번주 과제 진척 | 없음(읽기) | `app/(tabs)/learning.tsx` |
| `/api/mobile/matches` | GET·POST | `requireMobileStudent` | 배정 선생님 목록 / `{ teacherId }` 수락(`acceptTeacherStudentMatch` 공용) | DB쓰기 `teacherStudent.updateMany`, 알림, 분석 | `app/consult/match.tsx`, `app/checkout/success.tsx` |
| `/api/mobile/notifications` | GET·PATCH | `requireMobileUser`(역할 무관) | 목록 / 읽음 처리(본문 없음·`{}`=전체, `{ ids[] }`=개별) | DB쓰기 `notification.updateMany` | `app/notifications.tsx`, `app/(parent)/index.tsx` |
| `/api/mobile/pricing-plans` | GET | **Public** | v2 요금제 목록 | 없음(읽기) | `app/checkout.tsx`, `app/subscribe.tsx` |
| `/api/mobile/push/register` | POST | `getMobileUser`(역할 무관) | `{ expoPushToken, platform }` 등록 | DB쓰기 `pushDevice.upsert` | `lib/push.ts` |
| `/api/mobile/qna` | GET | `requireMobileStudent` | QnA 탭 진입 — 배정 강사 목록 + 첫 강사와의 대화 + 토큰 잔여. 강사 없으면 `teacher=null` | 없음(읽기) | `app/(tabs)/qna.tsx` · **웹** `lib/qna.ts` 경유 `components/dashboard`·`components/questions` |
| `/api/mobile/qna/[tutorId]` | GET·POST | `requireMobileStudent` | 강사별 대화 조회 / `{ content, imageUrl? }` 전송 + AI 즉답(토큰 1 차감) | DB쓰기 `questionMessage.create`, `tokenWallet.update`, 알림, 외부 Anthropic | `app/(tabs)/qna.tsx` |
| `/api/mobile/question-images` | POST | `requireMobileStudent` | multipart `file` 업로드(웹과 동일 `uploadQuestionImage`) → 내부 프록시 URL | 스토리지 Supabase | `app/(tabs)/qna.tsx` |
| `/api/mobile/questions/[id]/ai-answer` | POST | `requireMobileStudent` | AI 즉답 재요청. **신규 생성 시에만** 토큰 1 차감(재조회 무료) | DB쓰기 `tokenWallet.update`, 외부 Anthropic | `app/(tabs)/qna.tsx` |
| `/api/mobile/reports` | GET | `requireMobileStudent` | `?month=YYYY-MM`(없으면 최신) 월간 리포트 | 없음(읽기) | `app/(tabs)/learning.tsx`, `app/report/[id].tsx` |
| `/api/mobile/satisfaction-checkins` | GET | `requireMobileStudent` | 미응답 체크인 목록 | 없음(읽기) | `app/(tabs)/index.tsx` |
| `/api/mobile/satisfaction-checkins/[id]/respond` | POST | `requireMobileStudent` | `{ score: 1-5, comment?(≤500) }`. score≤3 → 매니저 `SATISFACTION_LOW_SCORE` | DB쓰기 `satisfactionCheckin.update`, 알림 | `app/(tabs)/index.tsx` |

#### 2.22.4 mobile/parent — 8

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/parent/register` | POST | **Public** (IP 레이트리밋) | 학부모 계정 생성 + 토큰 발급(`createParentAccount`) | DB쓰기 `user.create`, 분석 | `app/(auth)/parent-signup.tsx` |
| `/api/mobile/parent/children` | GET | `requireMobileParent` | 연결 자녀 목록·요약(`parent-data`) | 없음(읽기) | `app/(parent)/index.tsx`·`consult.tsx`·`my.tsx`·`payments.tsx`·`reports.tsx` |
| `/api/mobile/parent/children/[studentId]/consultation` | POST | `requireMobileParent` | `{ note? }` 자녀 상담 신청 | DB쓰기 `consultationBooking.*`, 알림, 분석 | `app/(parent)/consult.tsx` |
| `/api/mobile/parent/children/[studentId]/reports` | GET | `requireMobileParent` | 자녀 리포트(읽기). 미소유 403 | 없음(읽기) | `app/(parent)/reports.tsx` |
| `/api/mobile/parent/link` | POST | `requireMobileParent` | `{ code, via? }` 자녀 연결 | DB쓰기 `parentStudent.create`, `parentLinkCode.update`, 분석 | `app/(parent)/link.tsx` |
| `/api/mobile/parent/link/[studentId]` | DELETE | `requireMobileParent` | 연결 해제 | DB쓰기 `parentStudent.delete` | `app/(parent)/my.tsx` |
| `/api/mobile/parent/payments` | GET | `requireMobileParent` | 자녀별 결제·청구 이력 | 없음(읽기) | `app/(parent)/payments.tsx` |
| `/api/mobile/parent/profile` | GET·PATCH·DELETE | `requireMobileParent` | 프로필 조회 / `{ name?, phone? }` 수정 / 계정 소프트삭제 | DB쓰기 `parent.update`, `softDeleteUser`, 감사 | `app/(parent)/my.tsx` |

#### 2.22.5 mobile/teacher — 17

가드: 운영 `requireMobileTeacher`(TEACHER는 승인 필수), 온보딩·홈 `requireMobileTeacherAllowPending`. 학생별은 `requireTeacherStudentMatch` 추가. 웹 `/api/teacher/*`와 1:1 대응([§4](#4-웹모바일-중복-쌍) 참조).

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/teacher/home` | GET | `requireMobileTeacherAllowPending` | 강사 대시보드 요약(승인 대기 강사 포함) + 확인 대기 수업 | 없음(읽기) | `app/(teacher)/index.tsx` |
| `/api/mobile/teacher/homework-templates` | GET·POST | `requireMobileTeacher` | 템플릿 목록 / 생성 | DB쓰기 `homeworkTemplate.create` | `app/(teacher)/templates.tsx`, `app/(teacher)/student/plan.tsx` |
| `/api/mobile/teacher/homework-templates/[templateId]` | PATCH·DELETE | `requireMobileTeacher` | 템플릿 수정 / 삭제 | DB쓰기 `homeworkTemplate.update·delete` | `app/(teacher)/templates.tsx` |
| `/api/mobile/teacher/lessons` | GET | `requireMobileTeacher` | `?studentId&status&upcoming` 수업 목록 | 없음(읽기) | `app/(teacher)/student/[id].tsx` |
| `/api/mobile/teacher/lessons/[id]/cancel` | PATCH | `requireMobileTeacher` | `{ reason, makeupAt? }` 취소 + 7일 뒤 보충 자동 생성 | DB쓰기 `lesson.update·create`, 알림 | `app/(teacher)/student/[id].tsx` |
| `/api/mobile/teacher/lessons/[id]/confirm` | PATCH | `requireMobileTeacher` | 수업 확인(`confirmLesson` 공용) | DB쓰기 `lesson.*`, `studySession.*`, 알림 | `app/(teacher)/index.tsx` |
| `/api/mobile/teacher/plans/[planId]/comment` | PATCH | `requireMobileTeacher` + `requireTeacherStudentMatch` | `{ comment }` 플랜 코멘트 | DB쓰기 `studyPlan.update`, 알림 | `app/(teacher)/student/plan.tsx` |
| `/api/mobile/teacher/profile` | GET·PATCH | `requireMobileTeacherAllowPending` | 프로필 조회·저장 | DB쓰기 `teacherProfile.upsert`, 캐시 | `app/(teacher)/my.tsx` |
| `/api/mobile/teacher/profile/documents` | GET·POST·DELETE | `requireMobileTeacherAllowPending` | 서류 목록(서명 URL) / 업로드 / 삭제 | DB쓰기 `teacherProfile.upsert`, 스토리지 | `app/(teacher)/my.tsx` |
| `/api/mobile/teacher/profile/photo` | POST | `requireMobileTeacherAllowPending` | multipart `file` 사진 업로드 | DB쓰기 `teacherProfile.upsert`, 스토리지, 캐시 | `app/(teacher)/my.tsx` |
| `/api/mobile/teacher/questions/[id]/answer` | PATCH | `requireMobileTeacher` + `requireTeacherStudentMatch` | `{ teacherAnswer }` 답변 | DB쓰기 `questionMessage.update`, 알림 | `app/(teacher)/questions.tsx` |
| `/api/mobile/teacher/settlements` | GET | `requireMobileTeacher` | `?month=` 본인 정산(웹과 동일 규칙) | 없음(읽기) | `app/(teacher)/settlements.tsx` |
| `/api/mobile/teacher/students` | GET | `requireMobileTeacher` | 담당 학생 목록 + 최근 수업 | 없음(읽기) | `app/(teacher)/students.tsx`·`questions.tsx`·`student/[id].tsx` |
| `/api/mobile/teacher/students/[id]/first-lesson` | POST·PATCH | `requireMobileTeacher` + `requireTeacherStudentMatch` | 첫 수업 지정·수정 + 회차 생성(+숙제 자동 분배) | DB쓰기 `lesson.*`, `teacherStudent.update`, `studyPlan.*`, 알림 | `app/(teacher)/student/[id].tsx` |
| `/api/mobile/teacher/students/[id]/homework-distribution` | POST | `requireMobileTeacher` + `requireTeacherStudentMatch` | 가중치 기반 숙제 분배 | DB쓰기 `studyPlan.create·update` | `app/(teacher)/student/plan.tsx` |
| `/api/mobile/teacher/students/[id]/plans` | GET | `requireMobileTeacher` + `requireTeacherStudentMatch` | 학생 플랜 조회 | 없음(읽기) | `app/(teacher)/student/plan.tsx` |
| `/api/mobile/teacher/students/[id]/questions` | GET | `requireMobileTeacher` + `requireTeacherStudentMatch` | `?date=` 학생 질문 목록 | 없음(읽기) | `app/(teacher)/questions.tsx` |

#### 2.22.6 mobile/manager — 13

| 경로 | 메서드 | 가드 | 요약 | 부작용 | 호출처 |
|---|---|---|---|---|---|
| `/api/mobile/manager/care-logs` | GET·POST | `requireMobileManager` | 케어로그 목록 / 생성 | DB쓰기 `managerCareLog.create` | `app/(manager)/monitoring.tsx` |
| `/api/mobile/manager/consultations/[id]/assign` | PATCH | `requireMobileManager` | 상담 본인 배정 | DB쓰기 `consultationBooking.updateMany`, 알림 | `app/(manager)/index.tsx` |
| `/api/mobile/manager/consultations/[id]/cancel` | PATCH | `requireMobileManager` | 상담 취소 | DB쓰기 `consultationBooking.update`, 알림 | `app/(manager)/index.tsx` |
| `/api/mobile/manager/consultations/[id]/complete` | PATCH | `requireMobileManager` | 상담 완료 | DB쓰기 `consultationBooking.update` | `app/(manager)/index.tsx` |
| `/api/mobile/manager/consultations/[id]/report` | GET·**PUT** | `requireMobileManager` | 리포트 조회·저장 | DB쓰기 `consultationReport.upsert` | `app/(manager)/report/[bookingId].tsx` |
| `/api/mobile/manager/consultations/mine` | GET | `requireMobileManager` | 내 담당 상담 | 없음(읽기) | `app/(manager)/index.tsx` |
| `/api/mobile/manager/consultations/waiting` | GET | `requireMobileManager` | 대기 상담 | 없음(읽기) | `app/(manager)/index.tsx` |
| `/api/mobile/manager/matches` | GET·POST | `requireMobileManager` | 매칭 후보 / 매칭 생성·재배정 | DB쓰기 `teacherStudent.upsert·update`, `managerStudent.upsert`, 알림 | `app/(manager)/matching.tsx`, `app/(manager)/match/[studentId].tsx` |
| `/api/mobile/manager/monitoring` | GET | `requireMobileManager` | 담당 학생 모니터링 스냅샷 | 없음(읽기) | `app/(manager)/monitoring.tsx` |
| `/api/mobile/manager/parent-link` | POST | `requireMobileManager` | 수동 학부모 연결 | DB쓰기 `parentStudent.create` | `app/(manager)/tools.tsx` |
| `/api/mobile/manager/password-reset` | POST | `requireMobileManager` | 학생·학부모 비밀번호 재설정 | DB쓰기 `user.update`, 감사 | `app/(manager)/tools.tsx` |
| `/api/mobile/manager/subscriptions/[id]/pause` | POST | `requireMobileManager` | 구독 일시정지·재개 | DB쓰기 `subscription.update`, 감사 | `app/(manager)/monitoring.tsx` |
| `/api/mobile/manager/teacher-approval` | GET·POST | `requireMobileManager` | 강사 승인·반려 | DB쓰기 `teacher.update`+`softDeleteUser`, 캐시, 감사·알림톡 | `app/(manager)/approval.tsx` |

## 3. 페이지 ↔ API 매트릭스 (55개)

접근 역할은 `middleware.ts` + 상위 `layout.tsx` + 페이지 내 가드를 합산한 결과다. API 목록은 페이지가 임포트하는 컴포넌트를 `next/dynamic` 포함 전이 추적해 얻은 실제 `fetch` 대상이다.

**전역 주입(공개 셸 페이지 공통)**: `components/providers/PublicAppProviders.tsx` 가 상담 가입 모달을 마운트하므로 공개 마케팅 페이지는 모두 `/api/register/student`·`/api/student/profile` 을 호출할 수 있다. `lib/analytics-client.ts` 는 모든 페이지에서 `/api/events` 를, `AppSessionProvider`/`signIn` 은 `/api/auth/[...nextauth]` 를 쓴다. 아래 표에서는 이 3종을 `전역`으로 줄여 적는다.

| 페이지 | 접근 역할 | 주요 렌더 컴포넌트 | 호출 API |
|---|---|---|---|
| `/` | Public | `landing/LandingRoot`, `layout/PublicShell` | 전역 |
| `/consult` | Public | `consultation/ConsultRequestForm`, `layout/PublicShell` | `/api/consultation-leads` + 전역 |
| `/pricing` | Public | `pricing/PricingContent` | 전역 |
| `/tutors` | Public | `tutors/FeaturedTutors` | 전역 |
| `/tutors/[id]` | Public | (인라인 — `/tutors` 로 리다이렉트) | 없음 |
| `/faq` | Public | `faq/FaqPageContent` | 전역 |
| `/reviews` | Public | `reviews/ReviewsPageContent` | 전역 |
| `/docs` | Public | `docs/DocsLibrary`, `concord/ConcordPageHead` | 없음 |
| `/terms` `/privacy` `/refund` | Public | `concord/LegalToc`, `ConcordReveal`, `ConcordPageHead` | 없음 |
| `/login` | Public | `app/login/LoginForm` | `/api/auth/login-status`, `/api/admin/setup` ⚠️, `/api/admin/recover` ⚠️ + 전역 |
| `/register` | Public | (인라인 — 역할 선택 안내) | 전역 |
| `/register/teacher` | Public | `ui/GenderSelect`, `concord/ConcordPageHead` | `/api/register/teacher`, `/api/register/teacher/documents` |
| `/checkout` | Public (`auth()` 선택적) | `checkout/CheckoutContent`, `admin/CmsEditOverlay` | 전역 (Toss 위젯은 클라이언트 SDK) |
| `/success` | Public | `success/SuccessPaymentComplete`, `consultation/ConsultationApplyButton` | `/api/payments/complete`, `/api/parent/payments/complete` + 전역 |
| `/payments` | STUDENT (페이지 내 `auth()`) | `payments/BillingManageSection` | `/api/billing/autorenew`, `/api/billing/register-success`(리다이렉트 도착점) |
| `/dashboard` | STUDENT (middleware + 페이지 `auth()`) | `dashboard/StudentDashboardEntry` → (dynamic) `StudentDashboard` | `/api/plans`, `/api/plans/[planId]/tasks`, `/api/plans/copy`, `/api/plans/tasks/[taskId]`, `/api/questions`, `/api/questions/[id]/ai-answer`, `/api/student/question-images`, `/api/student/satisfaction-checkins/[id]/respond`, `/api/mobile/qna`, `/api/notifications`, `/api/notifications/[id]/read`, `/api/notifications/read-all` + 전역 |
| `/dashboard/consultation` | STUDENT | `dashboard/ConsultationBookingPage` | `/api/consultation/my-booking`, `/api/consultation/request`, `/api/consultation/visit-times`, `/api/matches/[matchId]/accept` + 전역 |
| `/dashboard/account` | STUDENT | `concord-portal/StudentPortalShell`, `app/dashboard/account/AccountClient` | `/api/account/password`, `/api/account/delete`, `/api/student/parent-link-code` |
| `/dashboard/reports` | STUDENT | `concord-portal/StudentPortalShell`, `app/dashboard/reports/StudentReportsView` | 없음 (서버에서 `lib/parent-data`·prisma 직접 조회) |
| `/questions` | STUDENT | `questions/QuestionsPageClient` | `/api/questions`, `/api/questions/[id]/ai-answer`, `/api/student/question-images`, `/api/mobile/qna` |
| `/notifications` | 로그인 유저 (페이지 내 `auth()`) | `notifications/NotificationsPageClient` | `/api/notifications/[id]/read`, `/api/notifications/read-all` |
| `/parent` | PARENT (`parent/layout` → `requireParentPage`) | (인라인) | 없음 (`lib/parent-data` 서버 조회) |
| `/parent/link` | PARENT | `app/parent/LinkChildForm` | `/api/parent/link`, `/api/parent/link/[studentId]` |
| `/parent/consultation` | PARENT | `app/parent/consultation/ConsultationForm` | `/api/parent/children/[studentId]/consultation` |
| `/parent/reports` | PARENT | `app/parent/reports/ReportsView` | 없음 (서버 조회) |
| `/parent/payments` | PARENT | (인라인) | 없음 (서버 조회) |
| `/parent/account` | PARENT | `app/parent/account/AccountForms` | `/api/parent/profile`, `/api/account/password`, `/api/account/delete` |
| `/admin` | ADMIN·CHIEF_MANAGER (middleware + `admin/layout`) | `admin/AdminDashboard` | `/api/admin/stats`, `/api/admin/check-alerts` |
| `/admin/students` | ADMIN·CHIEF | `admin/AdminStudentsPage` | `/api/admin/students`, `/api/admin/students/[id]` |
| `/admin/teachers` | ADMIN·CHIEF | `admin/AdminTeachersPage` | `/api/admin/teachers`, `/api/admin/teachers/[id]`, `.../documents`, `.../photo`, `.../role` |
| `/admin/matches` | ADMIN·CHIEF | `admin/AdminMatchesPage` | `/api/admin/matches`, `/api/admin/matches/[id]`, `/api/admin/students`, `/api/admin/teachers` |
| `/admin/payments` | ADMIN·CHIEF | `admin/AdminPaymentsPage` | `/api/admin/payments`, `/api/admin/payments/[id]/refund` |
| `/admin/settlements` | ADMIN·CHIEF | `admin/AdminSettlementsPage` | `/api/admin/settlements` |
| `/admin/metrics` | ADMIN·CHIEF | `admin/AdminMetricsPage` | `/api/admin/metrics` |
| `/admin/funnel` | ADMIN·CHIEF | `admin/AdminFunnelPage` | `/api/admin/funnel` |
| `/admin/data` | ADMIN·CHIEF | `admin/AdminDataPage` | `/api/admin/data/plans`, `/api/admin/data/questions` |
| `/admin/leads` | ADMIN·CHIEF | `admin/AdminLeadsPage` | `/api/consultation-leads` (GET·PATCH) |
| `/admin/audit-logs` | ADMIN·CHIEF | `admin/AdminAuditLogsPage` | `/api/admin/audit-logs` |
| `/admin/cms` | ADMIN·CHIEF | `admin/AdminCmsPage` (+`CmsPublicTeachersPanel`) | `/api/admin/cms/content`, `.../faq`, `.../faq/[id]`, `.../testimonials`, `.../testimonials/[id]`, `.../init`, `.../upload-image`, `/api/admin/teachers`, `/api/admin/teachers/[id]`, `.../photo` |
| `/chief-manager/teacher-approval` | ADMIN·CHIEF (`chief-manager/layout`) | (인라인 클라이언트) | `/api/chief-manager/teacher-approval`, `/api/admin/teachers/[id]/documents` |
| `/manager/teacher-approval` ⚠️ | 레이아웃 가드 없음 — middleware가 STUDENT·PARENT·TEACHER·MANAGER를 각자 홈으로 되돌리므로 실제 도달은 ADMIN·CHIEF_MANAGER. **비로그인은 차단되지 않고 셸이 렌더된다**(데이터는 API 가드가 차단) | `teacher-portal/ManagerApprovalPage` (포털과 동일 구현 재사용) | `/api/manager/teacher-approval`, `/api/manager/matches`, `/api/manager/parent-link`, `/api/manager/password-reset` |
| `/teacher-portal` | Public (로그인 포털 역할이면 대시보드로 리다이렉트) | `teacher-portal/TeacherPortalLoginClient`, `layout/PublicShell` | 전역 |
| `/teacher-portal/apply` | Public | `teacher-portal/TeacherPortalApplyClient` | `/api/register/teacher` + 전역 |
| `/teacher-portal/dashboard` | TEACHER(승인)·MANAGER·CHIEF (`dashboard/layout`) | `teacher-portal/TeacherLessonConfirmCard` | `/api/teacher/lessons/pending-confirm`, `/api/teacher/lessons/[id]/confirm` |
| `/teacher-portal/dashboard/students` | 동일 | `TeacherStudentsManager`, `TeacherApprovalLock` | `/api/teacher/students`, `/api/teacher/lessons`, `/api/teacher/lessons/[id]/cancel`, `/api/teacher/students/[id]/first-lesson` |
| `/teacher-portal/dashboard/plans` | 동일 | `TeacherPlanClient` | `/api/teacher/students/[id]/plans`, `/api/teacher/students/[id]/homework-distribution`, `/api/teacher/homework-templates`, `/api/teacher/plans/[planId]/comment` |
| `/teacher-portal/dashboard/questions` | 동일 | `TeacherQuestionsClient`, `TeacherApprovalLock` | `/api/teacher/students/[id]/questions`, `/api/teacher/questions/[id]/answer` |
| `/teacher-portal/dashboard/settlements` | 동일 | `TeacherSettlementsClient`, `TeacherApprovalLock` | `/api/teacher/settlements` |
| `/teacher-portal/dashboard/profile` | 동일 | `TeacherProfileEditor`, `account/AccountDeleteSection` | `/api/teacher/profile`, `/api/teacher/profile/documents`, `/api/teacher/profile/photo`, `/api/account/delete` |
| `/teacher-portal/dashboard/approval` | 동일 (실사용은 매니저 이상) | `ManagerApprovalPage` | `/api/manager/teacher-approval`, `/api/manager/matches`, `/api/manager/parent-link`, `/api/manager/password-reset` |
| `/teacher-portal/dashboard/consultations` | 동일 | `ManagerConsultationsPage`, `ManagerUnassignedQuestions` | `/api/manager/consultations/mine`, `.../waiting`, `.../[id]/assign`, `.../[id]/cancel`, `.../[id]/complete`, `.../[id]/report`, `.../[id]/visit-confirmed`, `/api/manager/questions` |
| `/teacher-portal/dashboard/matching` | 동일 | `ManagerMatchingPage` | `/api/manager/matches` |
| `/teacher-portal/dashboard/monitoring` | 동일 | `ManagerMonitoringPage` | `/api/manager/monitoring/stats`, `/api/manager/care-logs`, `/api/manager/subscriptions/[id]/pause` |

> 행 수 주의: `/terms` `/privacy` `/refund` 를 한 행으로 묶었다. 파일 기준 페이지 수는 55개이며 전체 목록은 `api-inventory.json` 의 `pages[]` 에 있다.
>
> middleware 특이점: `CHIEF_MANAGER` 는 역할별 리다이렉트 분기(`STUDENT`/`PARENT`/`TEACHER`·`MANAGER`) 어디에도 걸리지 않아 **모든 경로를 열람할 수 있다**. `/admin` 만 명시적으로 `ADMIN`·`CHIEF_MANAGER` 로 제한된다.

## 4. 웹·모바일 중복 쌍

구조적 배경: 웹은 NextAuth 쿠키, 모바일은 Bearer JWT라 **가드만 다르고 본문이 같은 핸들러가 짝으로 존재**한다. 쌍은 34개. 아래 `줄` 은 두 파일의 줄 수, `유사도` 는 문자 단위 `difflib` 비율(`autojunk=False`), `공유 lib` 는 두 파일이 함께 임포트하는 `@/lib/*`(`prisma` 제외).

| 웹 | 모바일 | 줄 | 유사도 | 공유 lib | 판정 |
|---|---|---|---|---|---|
| `/api/manager/care-logs` | `/api/mobile/manager/care-logs` | 102/102 | 0.98 | — | **복사본** |
| `/api/manager/consultations/[id]/assign` | 동일 경로 mobile | 54/54 | 0.99 | `notifications` | **복사본** |
| `/api/manager/consultations/[id]/cancel` | 동일 | 48/48 | 0.99 | `notifications` | **복사본** |
| `/api/manager/consultations/[id]/complete` | 동일 | 76/76 | 0.99 | — | **복사본** |
| `/api/manager/consultations/[id]/report` | 동일 | 126/126 | 0.99 | `consultation-report` | 복사본 + DTO 공유 |
| `/api/manager/consultations/mine` | 동일 | 14/14 | 0.78 | `manager-portal-data` | lib 공유(얇은 래퍼) |
| `/api/manager/consultations/waiting` | 동일 | 13/13 | 0.83 | `manager-portal-data` | lib 공유(얇은 래퍼) |
| `/api/manager/matches` | `/api/mobile/manager/matches` | 191/191 | 0.99 | `manager-portal-data`, `notifications`, `study-plan-dates` | **복사본**(191줄 전체) |
| `/api/manager/parent-link` | 동일 | 63/63 | 0.99 | `parent-link`, `phone-login` | 복사본 + lib 공유 |
| `/api/manager/password-reset` | 동일 | 54/54 | 0.95 | `password`, `audit-log` | 복사본 + lib 공유 |
| `/api/manager/subscriptions/[id]/pause` | 동일 | 194/196 | 0.98 | `audit-log` | **복사본**(35일 상한·상태 전이 로직 두 벌) |
| `/api/manager/teacher-approval` | 동일 | 112/112 | 0.96 | `account-deletion`, `teacher-rejection`, `public-cms-cache` | **3중 복사본** — `/api/chief-manager/teacher-approval`(112줄)까지 셋 |
| `/api/teacher/homework-templates` | 동일 | 118/118 | 0.98 | — | **복사본** |
| `/api/teacher/homework-templates/[templateId]` | 동일 | 113/113 | 0.98 | — | **복사본** |
| `/api/teacher/lessons` | 동일 | 56/56 | 0.98 | — | **복사본** |
| `/api/teacher/lessons/[id]/cancel` | 동일 | 200/200 | **1.00** | `notifications` | **완전 복사본**(보충 수업 생성 로직 두 벌) |
| `/api/teacher/lessons/[id]/confirm` | 동일 | 44/43 | 0.94 | `lesson-confirm` | lib 공유(핵심 로직 단일) |
| `/api/teacher/plans/[planId]/comment` | 동일 | 61/61 | 0.94 | `notifications`, `teacher-student-match` | 복사본 |
| `/api/teacher/profile` | 동일 | 115/115 | 0.98 | `teacher-profile-types`, `public-cms-cache` | **복사본** |
| `/api/teacher/profile/documents` | 동일 | 224/171 | 0.86 | `supabase-admin/client`, `teacher-profile-types` | 복사본 — 웹만 `perf-timer` 계측 |
| `/api/teacher/profile/photo` | 동일 | 82/59 | 0.85 | `supabase-admin/client`, `public-cms-cache` | 복사본 — 웹만 `perf-timer` |
| `/api/teacher/questions/[id]/answer` | 동일 | 79/79 | 0.97 | `qna`, `notifications`, `teacher-student-match` | 복사본 + lib 공유 |
| `/api/teacher/settlements` | 동일 | 121/119 | 0.92 | `settlement`, `settlement-refund` | 복사본 + 계산 lib 공유 |
| `/api/teacher/students` | 동일 | 54/54 | 0.95 | — | **복사본** |
| `/api/teacher/students/[id]/first-lesson` | 동일 | 164/164 | 0.99 | `homework-distribution`, `pricing-plans`, `notifications` | **복사본**(164줄) |
| `/api/teacher/students/[id]/homework-distribution` | 동일 | 116/116 | 0.98 | `homework-distribution-core` | 복사본 + 계산 lib 공유 |
| `/api/teacher/students/[id]/plans` | 동일 | 118/118 | 0.97 | `student-auth`, `teacher-student-match` | **복사본** |
| `/api/teacher/students/[id]/questions` | 동일 | 32/32 | 0.94 | `qna`, `student-auth` | lib 공유(얇은 래퍼) |
| `/api/parent/link` | `/api/mobile/parent/link` | 60/70 | 0.89 | `parent-link`, `parent-link-rate-limit`, `analytics` | 복사본 + lib 공유 |
| `/api/parent/link/[studentId]` | 동일 | 22/22 | 0.95 | — | 복사본 |
| `/api/parent/children/[studentId]/consultation` | 동일 | 31/31 | 0.91 | `parent-data` | lib 공유(얇은 래퍼) |
| `/api/parent/profile` | `/api/mobile/parent/profile` | 46/77 | 0.73 | `phone-login` | **비대칭** — 모바일에만 DELETE(계정 탈퇴) |
| `/api/questions/[id]/ai-answer` | `/api/mobile/questions/[id]/ai-answer` | 21/32 | 0.73 | `qna-ai-answer` | lib 공유 — 모바일만 토큰 1 차감 |
| `/api/notifications` | `/api/mobile/notifications` | 53/77 | 0.57 | `notifications` | **기능 상이** — 웹 GET(+`?summary`)만, 모바일 GET+PATCH(전체/개별 읽음). 웹 읽음 처리는 별도 라우트 2개 |

### 4.1 짝이 없는 라우트

- **모바일 전용(웹 대응 없음)**: `mobile/auth/*`(4 — 토큰 체계 자체), `mobile/me`·`me/journey`·`me/password`·`me/parent-link-code`·`me/tokens`, `mobile/home`, `mobile/learning/weekly`, `mobile/consultation`, `mobile/matches`, `mobile/qna`·`qna/[tutorId]`, `mobile/question-images`, `mobile/reports`, `mobile/satisfaction-checkins`(+`/respond`), `mobile/pricing-plans`, `mobile/push/register`, `mobile/parent/register`·`parent/children`·`parent/children/[studentId]/reports`·`parent/payments`, `mobile/teacher/home`, `mobile/manager/monitoring`.
- **웹 전용(모바일 대응 없음)**: `admin/*` 29개 전부, `plans/*` 4개(학생 플래너는 웹만 — 모바일은 `mobile/learning/weekly` 로 읽기만), `consultation/*` 3개, `matches/[matchId]/accept`, `student/*` 4개, `register/*` 3개, `payments/complete`·`parent/payments/complete`, `billing/*`, `cron/*`, `webhooks/toss`, `events`, `auth/*`, `consultation-leads`, `chief-manager/teacher-approval`, `manager/questions`, `manager/monitoring/stats`, `manager/consultations/[id]/visit-confirmed`, `teacher/lessons/pending-confirm`, `notifications/[id]/read`·`read-all`, `account/*`, `questions`·`questions/[id]`, `question-images/[...path]`.
- 기능 대응 방식이 다른 쌍: 학생 상담은 웹 `consultation/request` ↔ 모바일 `mobile/consultation`, 매칭 수락은 웹 `matches/[matchId]/accept` ↔ 모바일 `mobile/matches` POST (둘 다 `lib/teacher-student-match.acceptTeacherStudentMatch` 공유), 질문 이미지 업로드는 웹 `student/question-images` ↔ 모바일 `mobile/question-images` (둘 다 `lib/question-image-upload` 공유), 만족도 응답은 웹 `student/satisfaction-checkins/[id]/respond`(98줄) ↔ 모바일 `mobile/satisfaction-checkins/[id]/respond`(93줄, 복사본).
- **모바일 결제 완료 라우트는 없다.** 앱은 `Linking.openURL(${API_BASE}/checkout?plan=…)` 로 웹 결제 페이지를 열고, 완료는 웹 `/api/payments/complete` 가 처리한다(`mobile/app/checkout.tsx`, `subscribe.tsx` 실측). 07-13 판의 `/api/mobile/payments/complete` 는 제거됐다.

## 5. 호출처 없는 라우트

`src/**` + `mobile/**` 전수 grep에서 호출 코드가 없는 8개. 주석 내 언급은 호출처로 세지 않았다.

| 경로 | 메서드 | 분류 | 근거 |
|---|---|---|---|
| `/api/cron/check-alerts` | GET | **cron** | `vercel.json` `"0 0 * * *"` |
| `/api/cron/generate-monthly-reports` | GET | **cron** | `vercel.json` `"0 1 1 * *"` |
| `/api/webhooks/toss` | POST | **외부(webhook)** | Toss Payments가 호출 |
| `/api/admin/db-check` | GET | **디버그(데드)** ⚠️ | UI 없음. 운영자가 직접 열어보는 진단용 |
| `/api/questions/[id]` | PATCH | **데드** | 학생 수동 "해결됨" 토글을 UI에서 제거함(`components/dashboard/QuestionCard.tsx` 주석: "학생 수동 isResolved 조작은 노출하지 않는다"). 모바일에도 대응 라우트 없음 |
| `/api/teacher/homework-templates/[templateId]` | PATCH·DELETE | **웹 데드** | 웹 `TeacherPlanClient` 는 템플릿 목록·생성만 호출. 수정·삭제 UI는 모바일(`app/(teacher)/templates.tsx`)에만 존재 |
| `/api/manager/subscriptions/[id]/pause` | POST | **호출됨(정정)** | `components/teacher-portal/ManagerMonitoringPage.tsx` 가 `` `/api/manager/subscriptions/${encodeURIComponent(id)}/pause` `` 로 호출 — 단순 문자열 grep에서는 누락되는 형태 |
| `/api/mobile/manager/subscriptions/[id]/pause` | POST | **호출됨(정정)** | `mobile/app/(manager)/monitoring.tsx` 동일 패턴 |

> UI 개편 시 주의: 위 표의 `데드` 3건을 제외하면 **모든 라우트에 최소 1개 호출처가 있다.** 페이지별 호출 목록은 [§3](#3-페이지--api-매트릭스-55개)과 `api-inventory.json` 의 `pages[].apis` 로 개편 전후를 비교할 수 있다.

## 6. 위험·주의

실측으로 확인한 것만 적는다. 판단·수정은 이 문서의 범위가 아니다(전수조사 보고).

### 6.1 부트스트랩·디버그 (프로덕션 노출 주의)

1. **`/api/admin/setup`** — Public. `ADMIN`·`CHIEF_MANAGER` 가 0명일 때만 통과하고 이후 항상 403. 프로덕션에서는 `ADMIN_SETUP_SECRET` 없으면 503, 비프로덕션은 secret 없이 통과(`NODE_ENV !== "production"`).
2. **`/api/admin/recover`** — Public. ADMIN 비밀번호를 이메일 + `secretKey` 로 재설정. IP 5회/10분 인메모리 레이트리밋. 비프로덕션에서는 secret 없이 통과. `/login` 화면에서 호출된다.
3. **`/api/admin/db-check`** — `CHIEF_MANAGER` 도 통과하며 `DATABASE_URL`·`DIRECT_URL`·`NEXT_PUBLIC_SUPABASE_URL`·`VERCEL`·`VERCEL_ENV` **존재 여부**와 학생 표본을 응답한다(값 자체는 비노출). 호출 UI 없음.
4. **`/api/admin/cms/init`** — CMS 콘텐츠를 대량 생성·갱신·삭제(`?force=`). 어드민 CMS 화면에서 호출.

### 6.2 무인증 쓰기

5. **`/api/events`** — Public 쓰기(`AnalyticsEvent` 생성). IP 30회/분 + 10KB 페이로드 제한이 완화책. `name`·`payload` 검증 없음(문자열/객체 형태만 확인).
6. **`/api/consultation-leads` POST** — Public 쓰기(`ConsultationLead` 생성) + 외부 웹훅 발신. 레이트리밋이 **인메모리 `Map`** 이라 서버리스 인스턴스별로 분리 — 다중 인스턴스·콜드스타트 시 우회 가능.
7. **`/api/webhooks/toss`** — 서명 검증 없음. 대신 `paymentKey` 로 Toss API를 재조회해 본문을 신뢰하지 않고, `orderId`·`status`·금액을 모두 Toss 기준으로 재확인한다. 위조 결제 생성은 막히지만 **임의 호출로 Toss API 조회를 유발할 수 있다**(레이트리밋 없음).
8. **`/api/auth/login-status`** — Public. 계정 존재 여부는 숨기고 잠금 여부만 반환하나, 잠금 스토어가 인메모리라 인스턴스마다 판정이 다를 수 있다.

### 6.3 가드 불일치·비대칭

9. **`/manager/teacher-approval` 페이지에 레이아웃 가드가 없다.** `src/app/manager/` 에 `layout.tsx` 가 없고 페이지 자체도 `auth()` 를 호출하지 않는다. middleware는 STUDENT·PARENT·TEACHER·MANAGER를 각자 홈으로 되돌리지만 **비로그인 요청에는 `/manager/*` 규칙이 없어** 클라이언트 셸이 렌더된다(데이터는 `requireManagerOrAbove` 가 차단하므로 유출은 없음). `/teacher-portal/dashboard/approval` 과 동일 컴포넌트를 렌더하는 구 경로다.
10. **`CHIEF_MANAGER` 는 middleware 역할 분기에 포함되지 않는다** — `/admin` 을 제외한 모든 페이지(학생 대시보드·학부모 포털 포함)를 열람할 수 있다. API 쪽도 `requireManager`·`requireManagerOrAbove`·`requireChiefManagerOrAdmin` 모두 통과하며, 매니저 소유 검증(`managerOwnsStudent`)에도 CHIEF 우회 경로가 있다.
11. **`requireManager` 는 `ADMIN` 도 통과시킨다**(`lib/manager-auth.ts`의 역할 배열에 `ADMIN` 포함). 문서 이전 판의 "MANAGER/CHIEF" 표기는 부정확했다.
12. **강사 승인 라우트가 3중으로 존재하고 가드가 서로 다르다** — `/api/chief-manager/teacher-approval`(`requireChiefManagerOrAdmin`), `/api/manager/teacher-approval`(`requireManagerOrAbove` = 매니저도 가능), `/api/mobile/manager/teacher-approval`(`requireMobileManager`). 반려 시 세 경로 모두 `softDeleteUser` 를 실행한다.
13. **`/api/admin/*` 는 대부분 `requireChiefManagerOrAdmin`** 이므로 `CHIEF_MANAGER` 가 학생·강사 삭제·결제 환불까지 수행할 수 있다. `requireAdmin`(ADMIN 전용)은 `/api/admin/teachers/[id]/role` 과 `/api/consultation-leads` GET·PATCH 둘뿐이다.
14. **`/api/mobile/manager/*` 는 `requireMobileManager` 로 `ADMIN` 도 통과**하지만 `Teacher` 레코드가 있어야 한다(없으면 404). 웹 `requireManager` 와 동일 정책.
15. **메서드 불일치** — 상담 리포트 저장은 웹·모바일 모두 **PUT**(`/api/manager/consultations/[id]/report`). 알림 읽음은 웹이 `PATCH /api/notifications/[id]/read`·`/read-all` 두 라우트, 모바일은 `PATCH /api/mobile/notifications` 한 라우트(`{ ids[] }` 유무로 분기).

### 6.4 업로드 검증 편차

16. **`/api/teacher/profile/documents` POST(웹·모바일 모두)에 파일 타입·용량 검증이 없다.** `file instanceof File` 과 `type ∈ {resume, document}` 만 확인하고 `contentType: file.type` 그대로 Supabase에 저장한다. 같은 성격의 `/api/register/teacher/documents` 는 10MB 상한 + 매직바이트 검사(PDF/JPEG/PNG/WebP, 선언 MIME 일치 필수)를 수행한다 — **온보딩 경로와 프로필 경로의 방어 수준이 다르다.**
17. `/api/teacher/profile/photo`(웹·모바일), `lib/question-image-upload`(학생·모바일 질문 이미지)는 **클라이언트가 보낸 `file.type` 만 신뢰**한다(용량 상한은 있음). 매직바이트 검사는 `/api/admin/cms/upload-image` 와 `/api/register/teacher/documents` 에만 있다.

### 6.5 코드 중복으로 인한 갈라짐 위험

18. **200줄·191줄·164줄 규모의 핸들러가 웹·모바일에 통째로 복사돼 있다** — `teacher/lessons/[id]/cancel`(200줄, 유사도 1.00), `manager/matches`(191줄), `teacher/students/[id]/first-lesson`(164줄), `manager/subscriptions/[id]/pause`(194/196줄). 보충 수업 생성·매칭 상태 전이·일시정지 35일 상한 같은 규칙이 각각 두 벌이다. 한쪽만 고치면 즉시 갈라진다. 전체 목록은 [§4](#4-웹모바일-중복-쌍).
19. `teacher-approval` 은 웹 2개 + 모바일 1개로 **세 벌**이다(각 112줄).

### 6.6 기타 (설계상 의도 확인됨)

20. **정산은 서버 고정 시급(`TEACHER_HOURLY_RATE_KRW`)** — 강사별 차등 시급 미지원. `durationMin=0` 수업은 합계 제외 + `needsReview` 표기만 하므로 실지급 전 수동 검토 전제.
21. **결제 금액→요금제는 항상 서버가 산출**(`planIdFromAmount`) — 클라이언트가 보낸 plan은 웹·웹훅·학부모 대납 경로 모두에서 무시된다.
22. **모바일 JWT 시크릿이 분리됐다**(`MOBILE_JWT_SECRET`). 미설정 시 `AUTH_SECRET` 으로 폴백하며, 검증은 현 시크릿 → 레거시 시크릿 순으로 시도해 기발급 refresh 토큰을 살린다. `tokenVersion` 불일치·`deletedAt` 은 매 요청 재조회로 즉시 반영된다.
23. **`/api/manager/password-reset`·`/api/mobile/manager/password-reset`** — 매니저가 학생·학부모 비밀번호를 대면 재설정. 강사·매니저·어드민은 대상 제외(`findResettableUser`), `AuditLog(PASSWORD_RESET)` 기록.
24. **AI 의존 경로는 모두 폴백이 있다** — 질문 AI 초안은 실패 시 플레이스홀더 후 강사 답변 대기, 월간 리포트는 실패 시 결정론적 템플릿. 모바일 AI 즉답만 `TokenWallet` 1 차감(재조회는 무료).
25. **이전 판(07-13) 부록 1번 "`/api/register/teacher/documents` 가 세션 없이 `teacherId` 만으로 업로드 허용" 은 현재 코드에서 해소됐다** — `auth()` + `role === "TEACHER"` + 본인 `Teacher` 레코드 조회로 경로를 서버가 결정한다.

## 7. 이력

### 2026-09-30 전수 재실측 (173 → 162)

제거 확인(07-13 판 문서에 있으나 현재 파일 없음, 11개): `/api/parent/register`, `/api/parent/children`, `/api/parent/children/[studentId]/reports`, `/api/parent/payments` (웹 학부모 조회는 서버 컴포넌트가 `lib/parent-data` 직접 호출로 전환), `/api/mobile/payments/complete` (모바일은 웹 `/checkout` 을 브라우저로 열어 결제), `/api/mobile/lessons`, `/api/mobile/manager/monitoring/stats`, `/api/mobile/manager/consultations/[id]/visit-confirmed`, `/api/mobile/tutors`·`/api/mobile/tutors/[id]`·`/api/mobile/tutors/[id]/slots`, `/api/student/teacher-change-request`.
추가 확인(문서에 없던 3개): `/api/mobile/auth/logout`, `/api/mobile/question-images`, `/api/mobile/questions/[id]/ai-answer`.
문서 구성도 전면 재작성했다 — 라우트별 웹/모바일 호출처 매핑, 페이지 55개 ↔ API 매트릭스, 중복 쌍 유사도 실측, 호출처 없는 라우트 분류를 새로 넣었다. 기계 판독용 사본은 `/tmp/redesign/api-inventory.json`.

### 2026-07-13 증분 갱신 (보존)

> 07-12~07-13에 7개 라우트 추가(166→173). 신규 — 학부모 대납 결제 `/api/parent/payments/complete`, 강사 본인 정산 read-only `/api/teacher/settlements`·`/api/mobile/teacher/settlements`, 수업 확인 제도 `/api/teacher/lessons/[id]/confirm`·`/api/mobile/teacher/lessons/[id]/confirm`·`/api/teacher/lessons/pending-confirm`, 로그인 잠금 사전조회 `/api/auth/login-status`. 기존 라우트 변경(정정 표기) — `/api/mobile/parent/profile`에 DELETE(소프트삭제) 추가, `/api/mobile/notifications` 가드가 `requireMobileStudent`→`requireMobileUser`(역할 무관)로 변경. 신규 헬퍼/모듈: `lesson-confirm`(`confirmLesson`·`parseConfirmInput`·`getPendingConfirmLessons`), `settlement`(`TEACHER_HOURLY_RATE_KRW`), `login-rate-limit`(`isLoginBlocked`·`loginRateLimitKey`), `requireMobileUser`. 제거된 라우트 없음.

### 2026-07-12 갱신 요약 (보존)

> 07-05~07-12에 56개 라우트 추가(110→166). 주요 증가분 — PARENT 역할 계열(웹 `/api/parent/*` 8, 모바일 `/api/mobile/parent/*` 8), 강사 모바일 API `/api/mobile/teacher/*` 15, 매니저 모바일 API `/api/mobile/manager/*` 15, 웹 매니저 추가(`parent-link`·`password-reset`·`questions`), 공개 상담 리드 `/api/consultation-leads`, 비밀번호 변경·리셋(`/api/account/password`·`/api/mobile/me/password`·`manager/password-reset`), 학부모 연결 코드(`student/parent-link-code`·`mobile/me/parent-link-code`), `student/profile`. 신규 헬퍼: `requireParent`(웹 NextAuth PARENT) / `requireMobileParent`·`requireMobileManager`·`requireMobileTeacher`·`requireMobileTeacherAllowPending`(모바일 Bearer JWT) / `requireManagerOrAbove`. 제거된 라우트 없음.

> 개수 이력 참고: 07-04 문서의 합계 110은 `question-images` 1개 누락값(실측 111)이었을 가능성. 07-12 재실측 166개, 07-13 증분 173개, 2026-09-30 실측 **162개**.
