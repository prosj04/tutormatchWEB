# Concord 프론트엔드 재구축 명세 (FRONTEND BUILD SPEC)

작성일: 2026-07-10 · 대상: 프론트엔드 개발자

이 문서는 **홈(랜딩) 화면을 제외한 모든 화면과 기능**을 재구축하기 위한 범위 명세다.
디자인은 별도로 숙지하고 있다는 전제이므로 **디자인/스타일/레이아웃은 기술하지 않는다.**
각 화면에 대해 목적 · 기능 · 데이터 소스(API) · 사용자 액션 · 상태 · 권한만 기술한다.

---

## 0. 전체 구조

### 0.1 플랫폼

| 플랫폼 | 스택 | 대상 역할 |
|---|---|---|
| 모바일 앱 (Expo/React Native, expo-router) | scheme `concord` | STUDENT, **PARENT (신규)**, **TEACHER (신규)**, **MANAGER (신규)** |
| 웹 (Next.js App Router) | tutormatch-web | STUDENT, **PARENT (신규)**, TEACHER, MANAGER, CHIEF_MANAGER, ADMIN |

- **네 역할(학생·학부모·선생님·매니저)이 모두 동일한 하나의 모바일 앱**에서 로그인 역할에 따라 서로 다른 탭 세트/화면을 본다("사실상 여러 버전의 앱").
- 선생님·매니저는 **웹 포털**(`/teacher-portal`)도 그대로 사용한다. 즉 웹 포털 + 모바일 앱 **양쪽** 지원.
- 어드민·치프매니저는 웹(`/admin`) 전용(모바일 미지원). 이 문서 범위 밖(기존 유지)이나, 신규 학부모 데이터 노출 지점만 부록에 표기.

### 0.2 역할 정의

`ADMIN`, `CHIEF_MANAGER`, `MANAGER`, `TEACHER`, `STUDENT`, `PARENT`(신규)

### 0.3 로그인 후 진입 라우팅 (역할별)

| 역할 | 웹 진입 | 모바일 진입 |
|---|---|---|
| STUDENT | `/dashboard` | `(tabs)` **학생 탭 세트** |
| PARENT (신규) | `/parent` | `(tabs)` **학부모 탭 세트** |
| TEACHER (신규 모바일) | `/teacher-portal/dashboard` | `(tabs)` **선생님 탭 세트** |
| MANAGER (신규 모바일) | `/teacher-portal/dashboard` | `(tabs)` **매니저 탭 세트** |
| CHIEF_MANAGER | `/admin` | 미지원(웹 안내) |
| ADMIN | `/admin` | 미지원(웹 안내) |

인증 방식:
- 웹: NextAuth 세션 쿠키(Credentials, 전화번호 또는 이메일 + 비밀번호).
- 모바일: 자체 발급 HMAC-SHA256 JWT(access 7d / refresh 60d). `Authorization: Bearer <accessToken>`.
- 로그인 식별자는 전화번호 또는 이메일 둘 다 허용.

### 0.4 크로스커팅 신규 요구사항 (모든 역할에 걸침)

1. **역할 기반 앱 진입 게이트 (모바일):** 로그인/토큰 로드 후 `role`을 읽어 **학생 / 학부모 / 선생님 / 매니저 4개 탭 세트**로 분기. `GET /api/mobile/me`의 `role` 사용. CHIEF_MANAGER·ADMIN으로 모바일 로그인 시 "웹 관리자 페이지를 이용하세요" 안내 화면. **백엔드 변경 필요:** `src/app/api/mobile/auth/login/route.ts`의 역할 게이트가 현재 STUDENT·PARENT만 허용 → TEACHER·MANAGER 추가 허용, CHIEF_MANAGER·ADMIN만 차단.
2. **비밀번호 변경·재설정 (구현됨):** 문자·이메일 발송 인프라가 없어 미인증 "비밀번호 찾기" 플로우는 제공하지 않는다. 대신 두 경로:
   - **본인 변경(로그인 상태):** 현재 비밀번호 확인 후 변경. 모든 역할·양 플랫폼. 웹 `POST /api/account/password`, 모바일 `POST /api/mobile/me/password`. 바디 `{ currentPassword, newPassword(≥8) }`. 계정 설정 화면에 배치.
   - **매니저 재설정(분실 시):** 매니저가 대면으로 학생·학부모 비밀번호를 재설정. 웹 `POST /api/manager/password-reset`, 모바일 `POST /api/mobile/manager/password-reset`. 바디 `{ identifier(전화/이메일), newPassword(≥8) }`. 대상은 STUDENT·PARENT만. 감사 로그(PASSWORD_RESET) 기록.
3. **자녀 연결 (학부모 신규):**
   - 학생 화면에서 **연결 코드 발급** 및 **QR 코드 표시**.
   - 학부모 화면에서 **코드 입력** 또는 **QR 스캔**으로 연결.
   - 매니저 화면에서 **수동 연결**(학부모↔학생).
4. **결제 주체 이원화:** 결제는 **학생 계정과 학부모 계정 모두** 가능. 결제 UI는 두 역할 모두에 노출.

### 0.5 구현 원칙 — 플랫폼 커버리지

**기본 원칙: 아래 "명시적 제외"를 제외한 모든 기능은 앱(모바일) + 웹 양쪽에 동시 구현한다.**
어떤 화면/기능이 한 플랫폼에만 보이면 그것은 버그다(제외 목록에 없는 한).

**명시적 제외(이것만 예외):**
1. **학부모의 진도·숙제·질문** — 앱·웹 **양쪽 모두에서** 제외. 학부모는 리포트·결제·상담·자녀연결만.
2. **CHIEF_MANAGER · ADMIN 모바일 앱** — 웹(`/admin`) 전용, 모바일 제외.

위 두 가지 외에는 학생·학부모·선생님·매니저의 모든 화면·액션을 앱과 웹 모두에서 제공한다.

---

## 1. STUDENT — 모바일 앱

기존 구현이 대부분 완성되어 있으나 재구축 대상. 탭 구성: **홈 / 학습 / 질문 / MY**.

### 1.1 온보딩 / 로그인 / 회원가입

| 화면 | 목적 | 데이터 · 액션 · 상태 |
|---|---|---|
| 온보딩 | 첫 실행 소개 | 정적. 액션: "시작하기" → 로그인. |
| 로그인 | 인증 | `POST /api/mobile/auth/login` (identifier, password) → access/refresh 토큰. 상태: 오류(자격 불일치), 로딩. 역할이 STUDENT/PARENT 아니면 차단 안내. |
| 회원가입 | 학생 셀프 가입 | `POST /api/mobile/auth/register`. 필드: 이름·전화·이메일·비밀번호(정책상 상담/결제 기반 가입이 주. 셀프가입 유지 여부 확인 필요). |

토큰 갱신: `POST /api/mobile/auth/refresh` (refreshToken).

### 1.2 홈 탭 (`(tabs)/index`)

- **목적:** 학생 여정 단계(journey stage)에 따른 현재 상태 + 다음 액션 안내.
- **데이터:** `GET /api/mobile/home`, `GET /api/mobile/me/journey`.
- **여정 단계:** WAITING(매니저 배정 대기) / ASSIGNED(매니저 배정됨) / MATCHING(선생님 매칭중) / FIRST_LESSON_PENDING(첫 수업일 대기) / ACTIVE(수업중). 각 단계별 안내 카드 + CTA 상이.
- **액션:** 단계에 따라 상담 예약 이동, 매칭 수락, 결제 이동 등.
- **권한:** 본인 데이터만.

### 1.3 학습 탭 (`(tabs)/learning`)

- **목적:** 주간 학습 플래너(진도·숙제) 확인·체크.
- **데이터:** `GET /api/mobile/learning/weekly` (주 단위 태스크).
- **액션:** 태스크 완료 토글(→ 플래너 태스크 PATCH; 부록에서 모바일 태스크 완료 엔드포인트 확인 필요), 주 이동(이전/다음).
- **상태:** 배정된 플랜 없음 / 로딩 / 주별 데이터.
- **권한:** 본인. **학부모는 이 탭 없음(진도·숙제 비노출).**

### 1.4 질문 탭 (`(tabs)/qna`)

- **목적:** 담당 선생님에게 과목 질문(사진 첨부) + 답변 확인.
- **데이터:** 목록 `GET /api/mobile/qna`, 특정 튜터 스레드 `GET /api/mobile/qna/[tutorId]`.
- **액션:** 질문 작성(텍스트+이미지 업로드), AI 답변 요청 여부(웹의 `ai-answer` 대응 확인), 답변 열람.
- **상태:** 질문 없음 / 답변 대기 / 답변 완료.
- **권한:** 본인.

### 1.5 MY 탭 (`(tabs)/my`)

- **목적:** 프로필·구독·결제·알림·설정 허브.
- **데이터:** `GET /api/mobile/me`, `GET /api/mobile/me/tokens`(로그인 이력/세션).
- **액션 진입점:** 알림, 결제/구독, 리포트, 계정 관리, 로그아웃.
- **권한:** 본인.

### 1.6 부가 화면 (스택)

| 화면 | 목적 | API · 액션 |
|---|---|---|
| 알림 (`notifications`) | 알림 목록·읽음 | `GET /api/mobile/notifications`. 읽음 처리. 푸시 등록 `POST /api/mobile/push/register`. |
| 리포트 상세 (`report/[id]`) | 월간 리포트 열람 | `GET /api/mobile/reports`. |
| 튜터 상세 (`teacher/[id]`) | 담당/후보 선생님 프로필·수업 가능 슬롯 | `GET /api/mobile/tutors/[id]`, 슬롯 `GET /api/mobile/tutors/[id]/slots`. 튜터 목록 `GET /api/mobile/tutors`. |
| 상담 (`consult/index`, `consult/status`, `consult/match`, `consult/done`) | 상담 신청·상태·매칭 수락 | `GET/POST /api/mobile/consultation`. 매칭 `GET /api/mobile/matches` + 수락. |
| 구독 (`subscribe`, `subscription`) | 요금제 조회·구독 상태 | `GET /api/mobile/pricing-plans`. |
| 결제 (`checkout`, `checkout/success`, `billing`) | Toss 결제·완료 처리·청구 | 결제 완료 `POST /api/mobile/payments/complete`. |
| 만족도 체크인 | 주기적 만족도 응답 | `GET /api/mobile/satisfaction-checkins`, 응답 `POST /api/mobile/satisfaction-checkins/[id]/respond`. |

---

## 2. STUDENT — 웹

모바일과 기능 중복이 있으나 웹 대시보드로 유지.

| 화면 (경로) | 목적 | API · 액션 · 권한 |
|---|---|---|
| 로그인 (`/login`) | 통합 로그인(모든 역할) | NextAuth `signIn("credentials")`. 성공 시 역할별 라우팅(0.3). 학생/학부모 회원가입 아님 유도 링크(무료 상담). 관리자 셋업 툴은 `?setup=admin` 쿼리 시에만. |
| 회원가입 (`/register`) | 상담 기반 2단계 가입 | `POST /api/register/student`. |
| 상담 리드 (`/consult`) | 공개 상담 신청 | `POST /api/consultation-leads` 또는 `/api/consultation/request`. |
| 대시보드 (`/dashboard`) | 학습 플래너 + 질문 | 플랜 `GET /api/plans`, 태스크 `GET/POST /api/plans/[planId]/tasks`, 태스크 상태 `PATCH /api/plans/tasks/[taskId]`, 플랜 복사 `POST /api/plans/copy`. 질문 `GET/POST /api/questions`, 상세 `/api/questions/[id]`, AI 답변 `/api/questions/[id]/ai-answer`. 이미지 업로드 `POST /api/student/question-images`. |
| 상담 예약 (`/dashboard/consultation`) | 방문 상담 예약·매칭 수락 | 방문 가능 시간 `GET /api/consultation/visit-times`, 예약 `POST /api/consultation/request`, 내 예약 `GET /api/consultation/my-booking`, 매칭 수락 `POST /api/matches/[matchId]/accept`. |
| 계정 (`/dashboard/account`) | 프로필·탈퇴 | 프로필 `GET/PATCH /api/student/profile`, 탈퇴 `POST /api/account/delete`, 선생님 변경 요청 `POST /api/student/teacher-change-request`. |
| 질문 목록 (`/questions`) | 전체 질문 열람 | `GET /api/questions`. |
| 알림 (`/notifications`) | 알림 | `GET /api/notifications`, 읽음 `POST /api/notifications/[id]/read`, 전체읽음 `POST /api/notifications/read-all`. |
| 결제/청구 (`/payments`, `/checkout`, `/success`) | 결제·완료 | 요금제 `/pricing`, Toss 위젯 결제 → `POST /api/payments/complete`, 자동갱신 `/api/billing/autorenew`, 성공 등록 `/api/billing/register-success`. |
| 요금제 (`/pricing`) | 공개 요금제 | 정적/CMS. |
| 튜터 (`/tutors`, `/tutors/[id]`) | 선생님 목록·상세 | 공개 조회. |

권한: STUDENT 세션. 미들웨어가 STUDENT를 `/dashboard`·공개경로·`/api`로 제한.

---

## 3. PARENT — 신규 (모바일 앱 + 웹)

**신규 역할.** 학생과 동일 앱에서 로그인, 학부모 전용 탭 세트. 웹은 `/parent` 하위.
**핵심 제약:** 학부모는 **리포트 · 결제 · 상담**만. **진도·숙제·질문은 비노출.**
학부모 권한은 읽기 전용이 아니라 **액션 가능**(상담 예약, 결제, 자녀 연결 관리 등).

### 3.1 학부모 온보딩 / 인증

| 화면 | 목적 | 데이터 · 액션 |
|---|---|---|
| 로그인 | 학부모 인증 | 모바일 `POST /api/mobile/auth/login` (role=PARENT 허용됨). 웹 통합 `/login`. |
| 회원가입 (신규) | 학부모 셀프 가입 | **신규 엔드포인트 필요** `POST /api/parent/register` 또는 모바일 `POST /api/mobile/parent/register`(부록 A). 필드: 이름·전화·이메일·비밀번호. |
| 자녀 연결 (신규) | 코드/QR로 자녀 연결 | **신규**: 코드 입력 `POST /api/parent/link` (code) / QR 스캔 후 동일 엔드포인트. 상태: 코드 만료·중복 연결·성공. |

### 3.2 학부모 홈 탭 (모바일)

- **목적:** 연결된 자녀별 요약(현재 상태, 최근 리포트, 결제 상태) 대시보드.
- **데이터 (신규):** `GET /api/mobile/parent/children` (연결 자녀 목록+요약). 자녀 미연결 시 연결 유도.
- **액션:** 자녀 선택 → 자녀별 상세, 자녀 추가 연결.
- **상태:** 자녀 0명(연결 CTA) / N명.
- **권한:** 연결된 자녀만.

### 3.3 리포트 탭 (모바일 + 웹)

- **목적:** 자녀 월간/학습 리포트 열람 (읽기).
- **데이터 (신규):** `GET /api/mobile/parent/children/[studentId]/reports` (또는 자녀 스코프 리포트). 웹: `/parent/reports`.
- **액션:** 리포트 상세 열람, 자녀 전환.
- **권한:** `ParentStudent` 링크 존재하는 자녀만(백엔드 `parentChildOrNull` 가드).
- **비노출:** 진도 플래너 원본·숙제 태스크·질문 스레드는 표시하지 않음. 리포트로 요약된 형태만.

### 3.4 결제 탭 (모바일 + 웹)

- **목적:** 자녀 요금제 결제·구독 상태·청구 이력.
- **데이터:** 요금제 `GET /api/mobile/pricing-plans`. 결제 완료 `POST /api/mobile/payments/complete`(자녀 스코프 파라미터 필요 — 신규 확장). 청구 이력(신규) `GET /api/mobile/parent/payments`.
- **액션:** 결제 진행(Toss), 자동갱신 설정, 영수증 확인.
- **권한:** 연결 자녀 대상 결제. 결제 주체가 학부모로 기록.
- **참고:** 학생 계정도 동일 자녀 대상 결제 가능(이원화). 중복 결제 방지 로직은 백엔드에서 구독 상태로 처리.

### 3.5 상담 탭 (모바일 + 웹)

- **목적:** 자녀 관련 방문 상담 신청·예약·상태 확인.
- **데이터 (신규 또는 재사용):** 상담 신청 `POST /api/mobile/consultation`(학부모 스코프 + studentId), 내 상담 `GET`. 웹: `/parent/consultation`.
- **액션:** 상담 신청, 방문 시간 선택, 예약 확인.
- **권한:** 연결 자녀.

### 3.6 학부모 MY 탭 (모바일)

- **목적:** 프로필·연결 자녀 관리·알림·로그아웃.
- **데이터:** `GET /api/mobile/me` (role=PARENT). 연결 자녀 관리(신규) `GET /api/mobile/parent/children`, 연결 해제 `DELETE /api/parent/link/[studentId]`.
- **액션:** 자녀 추가 연결(코드/QR), 연결 해제, 알림, 로그아웃.
- **권한:** 본인 + 연결 자녀.

### 3.7 학부모 웹 (`/parent` 하위)

동일 기능을 웹으로. **리포트 · 결제 · 상담 + 자녀 연결 관리만.** 진도·숙제·질문 화면 없음.
미들웨어: PARENT는 `/parent`, `/checkout`, `/success`, `/pricing`, `/consult`, `/api`만 허용, 그 외 `/parent`로 리다이렉트(이미 구현됨).

| 화면 (경로) | 목적 | API |
|---|---|---|
| `/parent` | 자녀 요약 대시보드 | `GET /api/parent/children` (신규) |
| `/parent/reports` | 리포트 | `GET /api/parent/children/[studentId]/reports` (신규) |
| `/parent/payments` | 결제·청구 | `/pricing`, `POST /api/payments/complete`(학부모 스코프), 이력(신규) |
| `/parent/consultation` | 상담 | 상담 신청/예약(재사용+studentId) |
| `/parent/link` | 자녀 연결 관리 | 코드 입력 `POST /api/parent/link`, 목록/해제(신규) |
| `/parent/account` | 프로필·탈퇴 | 프로필(신규) `/api/parent/profile`, 탈퇴 `/api/account/delete` |

---

## 4. STUDENT 측 자녀 연결 발급 (신규, 모바일 + 웹)

학부모 연결을 위해 **학생 쪽에 코드/QR 발급 화면**이 필요.

- **위치:** 모바일 MY 탭 하위 "학부모 연결" 화면 / 웹 `/dashboard/account` 내 섹션.
- **목적:** 학부모가 사용할 일회성 연결 코드 발급 + 동일 코드의 QR 표시.
- **데이터 (신규):** `POST /api/student/parent-link-code` → { code, expiresAt } 발급. `GET`로 유효 코드 조회.
- **액션:** 코드 발급/재발급, QR 표시(코드 값을 QR로 인코딩), 연결된 학부모 목록 확인·해제.
- **상태:** 코드 없음 / 유효 코드(만료 타이머) / 만료됨.
- **권한:** 본인 학생만. 코드는 `ParentLinkCode` 모델(만료·사용됨 필드) 사용.

---

## 5. TEACHER — 웹 포털 (`/teacher-portal`) + 모바일 앱

**웹 포털과 모바일 앱 양쪽 지원.** 웹은 아래 표, 모바일은 §5.1.

| 화면 (경로) | 목적 | API · 액션 · 상태 · 권한 |
|---|---|---|
| 포털 로그인 (`/teacher-portal`) | 선생님 진입 | NextAuth 로그인. 미승인 시 대시보드에서 상태 안내. |
| 지원 (`/teacher-portal/apply`) | 선생님 지원 | `POST /api/register/teacher`, 서류 `POST /api/register/teacher/documents`. 상태: 지원 접수. |
| 대시보드 (`/teacher-portal/dashboard`) | 승인 상태·요약 | 승인 대기/승인됨 분기. 승인 전에는 기능 잠금. |
| 학생 (`/teacher-portal/dashboard/students`) | 담당 학생 관리 허브 | 목록 `GET /api/teacher/students`, 상세 `GET /api/teacher/students/[id]`. |
| — 첫 수업일 설정 | 매칭 후 첫 수업일 지정 | `PATCH /api/teacher/students/[id]/first-lesson`. |
| — 수업 관리 | 수업 목록·취소 | `GET /api/teacher/lessons`, 취소 `POST /api/teacher/lessons/[id]/cancel`. |
| — 플랜(진도·숙제) 탭 | 주간 숙제 입력·자동분배 | 플랜 `GET/POST /api/teacher/students/[id]/plans`. **숙제 자동분배** `POST /api/teacher/students/[id]/homework-distribution` (1주/4일치 한 번 입력 → 요일별 가중 분배). 코멘트 `PATCH /api/teacher/plans/[planId]/comment`. |
| — 숙제 템플릿 | 반복 주간 숙제 재사용 | `GET/POST /api/teacher/homework-templates`, 수정/삭제 `/api/teacher/homework-templates/[templateId]`. |
| — 질문 탭 | 담당 학생 질문 답변 | 학생별 질문 `GET /api/teacher/students/[id]/questions`, 답변 `PATCH /api/teacher/questions/[id]/answer`. |
| 프로필 (`/teacher-portal/dashboard/profile`) | 프로필·사진·서류 | `GET/PATCH /api/teacher/profile`, 사진 `/api/teacher/profile/photo`, 서류 `/api/teacher/profile/documents`. |
| 상담 (`/teacher-portal/dashboard/consultations`) | (매니저 역할 겸직 시) 상담 | §6 참조. |
| 매칭 (`/teacher-portal/dashboard/matching`) | (매니저) 매칭 | §6 참조. |
| 모니터링 (`/teacher-portal/dashboard/monitoring`) | (매니저) 모니터링 | §6 참조. |

**숙제 자동분배 로직(백엔드, `src/lib/homework-distribution.ts`):** 총량을 일수로 균등 분배, 나머지는 앞쪽 요일에 우선 배치, 하루 최소 1개 보장, 단조 감소 형태. `source:"teacher"`, `repeatWeeks` 1–12 반복.

권한: TEACHER 세션 + 승인됨. 담당(매칭된) 학생만 접근.

### 5.1 TEACHER — 모바일 앱 (신규)

선생님 역할 로그인 시 노출되는 탭 세트. 웹 포털 기능을 모바일에 맞게 제공. 모든 API는 **신규** `/api/mobile/teacher/*` (부록 A.2).

| 탭/화면 | 목적 | API(신규) · 액션 · 상태 |
|---|---|---|
| 대시보드(홈) | 승인 상태 + 오늘/이번주 수업 요약 | `GET /api/mobile/teacher/home`. 미승인 시 상태 안내(기능 잠금). |
| 학생 탭 | 담당 학생 목록·상세 | `GET /api/mobile/teacher/students`, 상세 `GET /api/mobile/teacher/students/[id]`. |
| — 첫 수업일 설정 | 매칭 후 첫 수업일 지정 | `PATCH /api/mobile/teacher/students/[id]/first-lesson`. |
| — 수업 관리 | 수업 목록·취소 | `GET /api/mobile/teacher/lessons`, `POST /api/mobile/teacher/lessons/[id]/cancel`. |
| — 진도·숙제 | 주간 숙제 입력·자동분배·코멘트 | 플랜 `GET/POST /api/mobile/teacher/students/[id]/plans`, 자동분배 `POST /api/mobile/teacher/students/[id]/homework-distribution`, 코멘트 `PATCH /api/mobile/teacher/plans/[planId]/comment`. |
| — 숙제 템플릿 | 반복 주간 숙제 재사용 | `GET/POST /api/mobile/teacher/homework-templates`, `/[templateId]`. |
| 질문 탭 | 담당 학생 질문 답변 | 목록 `GET /api/mobile/teacher/questions`(또는 학생별), 답변 `PATCH /api/mobile/teacher/questions/[id]/answer`. |
| MY(프로필) | 프로필·사진·서류·로그아웃 | `GET/PATCH /api/mobile/teacher/profile`, 사진·서류 업로드. 알림 `GET /api/mobile/notifications`(공용). |

자동분배 로직은 웹과 동일(`src/lib/homework-distribution.ts` 재사용). 권한: TEACHER + 승인됨, 담당 학생만.

---

## 6. MANAGER — 웹 포털 (`/teacher-portal/dashboard/*`) + 모바일 앱

매니저는 선생님 포털을 공유하되 매니저 전용 탭이 활성화된다(역할 기반). **웹 + 모바일 양쪽 지원**(모바일은 §6.1).

| 화면 (경로) | 목적 | API · 액션 · 상태 · 권한 |
|---|---|---|
| 상담 (`/teacher-portal/dashboard/consultations`) | 배정 학생 상담 관리 | 대기 목록 `GET /api/manager/consultations/waiting`, 내 담당 `GET /api/manager/consultations/mine`. 액션: 배정 `POST /api/manager/consultations/[id]/assign`, 취소 `/cancel`, 완료 `/complete`, 방문확정 `/visit-confirmed`, 리포트 `/report`. 탭: 대기 / 내 담당. |
| — 미배정 질문 (임베드) | 담당 미지정 질문 처리 | `GET /api/manager/questions`. |
| 매칭 (`/teacher-portal/dashboard/matching`) | 학생↔선생님 매칭 | `GET/POST /api/manager/matches` (matchReason 입력, reassign 플래그로 재매칭). 상태: 미매칭/매칭됨/재매칭. |
| 모니터링 (`/teacher-portal/dashboard/monitoring`) | 진행 현황 카드·드릴다운·케어로그 | SSR `GET /api/manager/monitoring`, 통계 드릴다운 `GET /api/manager/monitoring/stats`, 케어로그 `GET/POST /api/manager/care-logs`. |
| 선생님 승인 (`/manager/teacher-approval`) | 선생님 지원 승인(매니저) | `GET/POST /api/manager/teacher-approval`. |
| 자녀 수동 연결 (신규) | 학부모↔학생 수동 연결 | **신규**: `POST /api/manager/parent-link` (parentId 또는 학부모 식별 + studentId). 매니저가 학부모를 특정 자녀에 직접 연결. |

**참고:** 구독 일시정지/재개 엔드포인트 `POST /api/manager/subscriptions/[id]/pause`가 존재하나 **UI 소비처가 없음** → 재구축 시 모니터링/학생 상세에 정지·재개 액션 UI 추가 필요.

권한: MANAGER 세션. 배정된 학생만. 선생님 승인은 매니저/치프 분리 엔드포인트.

### 6.1 MANAGER — 모바일 앱 (신규)

매니저 역할 로그인 시 노출되는 탭 세트. 웹 매니저 기능을 모바일에 맞게 제공. 모든 API는 **신규** `/api/mobile/manager/*` (부록 A.2).

| 탭/화면 | 목적 | API(신규) · 액션 |
|---|---|---|
| 상담 탭 | 배정 학생 상담 관리 | 대기 `GET /api/mobile/manager/consultations/waiting`, 내 담당 `GET /api/mobile/manager/consultations/mine`. 액션: 배정·취소·완료·방문확정·리포트(웹 하위 경로 대응 신규). |
| 매칭 탭 | 학생↔선생님 매칭 | `GET/POST /api/mobile/manager/matches` (matchReason, reassign). |
| 모니터링 탭 | 진행 현황·드릴다운·케어로그 | `GET /api/mobile/manager/monitoring`, `/stats`, 케어로그 `GET/POST /api/mobile/manager/care-logs`. 구독 정지·재개 `POST /api/mobile/manager/subscriptions/[id]/pause`. |
| 자녀 수동 연결 | 학부모↔학생 수동 연결 | `POST /api/mobile/manager/parent-link` (§3 연결과 동일 로직). |
| 선생님 승인 | 선생님 지원 승인(매니저 라인) | `GET/POST /api/mobile/manager/teacher-approval` (웹 `/api/manager/teacher-approval` 로직 재사용). |
| MY | 프로필·알림·로그아웃 | `GET /api/mobile/me`, 알림 공용. |

권한: MANAGER 세션, 배정 학생만. (치프매니저 승인 라인은 웹 전용 — CHIEF_MANAGER 모바일 미지원 원칙.)

### CHIEF_MANAGER 추가

- 선생님 승인 치프 라인: `/chief-manager/teacher-approval` (`GET/POST /api/chief-manager/teacher-approval`).
- 결제 학생 자동 치프 배정(성공 결제 시). CHIEF_MANAGER는 `/admin` 진입.

---

## 부록 A. API 계약 — 기존 vs 신규(PARENT)

### A.1 기존 (재사용, 변경 없음 또는 스코프 확장)

인증: `/api/mobile/auth/login|refresh|register`
학생 모바일: `/api/mobile/home`, `/me`, `/me/journey`, `/me/tokens`, `/learning/weekly`, `/qna`, `/qna/[tutorId]`, `/lessons`, `/matches`, `/notifications`, `/push/register`, `/reports`, `/tutors`, `/tutors/[id]`, `/tutors/[id]/slots`, `/pricing-plans`, `/consultation`, `/payments/complete`, `/satisfaction-checkins`, `/satisfaction-checkins/[id]/respond`
학생 웹: `/api/plans*`, `/api/questions*`, `/api/student/*`, `/api/consultation/*`, `/api/matches/[matchId]/accept`, `/api/notifications*`, `/api/account/delete`, `/api/payments/complete`, `/api/billing/*`
선생님: `/api/teacher/*`, `/api/register/teacher*`
매니저: `/api/manager/*`, `/api/chief-manager/*`, `/api/manager/subscriptions/[id]/pause`(UI 미연결)

**참고:** 선생님/매니저 모바일 엔드포인트(`/api/mobile/teacher/*`, `/api/mobile/manager/*`)는 아직 없음 → A.2 신규. 기존 웹 `/api/teacher/*`·`/api/manager/*`의 서비스 로직은 재사용하되, 인증만 모바일 토큰(Bearer)으로 감싸는 얇은 래퍼로 구현 권장.

### A.2 신규 필요 엔드포인트

| 엔드포인트 | 메서드 | 목적 |
|---|---|---|
| `/api/parent/register` (+ `/api/mobile/parent/register`) | POST | 학부모 셀프 가입 |
| `/api/parent/link` | POST | 코드/QR로 자녀 연결 |
| `/api/parent/link/[studentId]` | DELETE | 자녀 연결 해제 |
| `/api/parent/children` (+ `/api/mobile/parent/children`) | GET | 연결 자녀 목록·요약 |
| `/api/parent/children/[studentId]/reports` | GET | 자녀 리포트(읽기) |
| `/api/parent/payments` (+ mobile) | GET | 학부모 결제/청구 이력 |
| `/api/parent/consultation` (또는 mobile `/consultation` 확장) | GET/POST | 학부모 상담 신청 |
| `/api/parent/profile` | GET/PATCH | 학부모 프로필 |
| `/api/student/parent-link-code` | GET/POST | 학생 측 연결 코드/QR 발급 |
| `/api/manager/parent-link` | POST | 매니저 수동 학부모↔학생 연결 |
| `/api/account/password` (+ mobile `/api/mobile/me/password`) | POST | 본인 비밀번호 변경(현재 비밀번호 확인, 전 역할) |
| `/api/manager/password-reset` (+ mobile) | POST | 매니저의 학생·학부모 비밀번호 재설정(분실 대응) |
| `/api/mobile/teacher/*` (home, students, students/[id], first-lesson, lessons, lessons/[id]/cancel, plans, homework-distribution, plans/[planId]/comment, homework-templates, questions, questions/[id]/answer, profile) | 다양 | 선생님 모바일 앱(웹 `/api/teacher/*` 로직 재사용, 모바일 토큰 인증) |
| `/api/mobile/manager/*` (consultations/waiting, consultations/mine, consultations/[id]/*, matches, monitoring, monitoring/stats, care-logs, subscriptions/[id]/pause, parent-link, teacher-approval) | 다양 | 매니저 모바일 앱(웹 `/api/manager/*` 로직 재사용, 모바일 토큰 인증) |

**모바일 인증 게이트 변경(신규):** `src/app/api/mobile/auth/login/route.ts`의 역할 차단을 STUDENT·PARENT → STUDENT·PARENT·TEACHER·MANAGER 허용으로 확대. `src/lib/mobile-auth.ts`에 `requireMobileTeacher` / `requireMobileManager` 가드 추가(기존 `requireMobileStudent`·`requireMobileParent` 패턴 동일).

권한 가드: 모든 학부모 자녀 접근은 `ParentStudent` 링크 검증(`parentChildOrNull` / `parentOwnsStudent`)을 통과해야 함.
데이터 모델(이미 스키마 반영): `Parent`, `ParentStudent`(linkedVia: CODE|QR|MANAGER), `ParentLinkCode`(code, expiresAt, usedAt).

## 부록 B. 상태·권한 공통 규칙

- 모든 목록 화면: 로딩 / 빈 상태 / 오류(재시도) / 데이터 상태를 가진다.
- 모바일 인증 만료: access 만료 시 refresh 자동 시도, 실패 시 로그인으로.
- 소프트삭제·역할변경은 즉시 반영(백엔드가 매 요청 user 재조회로 무효화).
- 학부모 화면 전반: 진도·숙제·질문 데이터는 어떤 경로로도 노출 금지.
