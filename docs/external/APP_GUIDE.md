# Concord — 앱 상세 설명 자료

> 실제 구동 화면 기반 제품 설명서 · 2026-07 · 캡처 원본: `docs/app-screenshots/{역할}/{desktop|mobile}/`
> 모든 스크린샷은 로컬 시연 데이터(가상의 학생·강사)로 촬영되었으며, 실제 고객 개인정보는 포함되지 않습니다.
> 요약 지표·재무 근거는 `IR_ONE_PAGER.md` · `FINANCIAL_PLAN.md` · `BUSINESS_PLAN_PSST.md`를 따릅니다.
> ⚠️ **내부 고지 — 정책 변경 (2026-07-08, 대외 배포 전 반영 필요)**: 본문의 "동의 기반 매칭"·수락 버튼 강조 서술은 개정 이전 작성분. 현행 규범(`CLAUDE.md`)은 수락 버튼을 형식적 절차로 규정하며 **대외 자료에서 학생 수락을 강조하지 않는다**. PDF(`branding/Concord-App-Guide.pdf`) 재생성 시 해당 대목 수정 후 배포할 것.

---

## 0. 한눈에 보는 Concord

**Concord Private Tutoring**은 면접·검증된 강사와 전담 매니저가 **대면 1:1 과외를 매칭·관리**하는 프리미엄 에듀테크 플랫폼입니다. 아이디어 단계가 아니라 **웹 4역할 포털·결제·AI 질답·학습관리가 모두 작동하는 완성된 소프트웨어**입니다.

| 축 | 내용 |
|---|---|
| 사용자 역할 | 학생/학부모 · 강사 · 매니저(+최고매니저) · 최고관리자 |
| 핵심 플로우 | 상담 신청 → 매니저 배정 → 대면 상담 → 강사 매칭 → **학생 수락** → 첫 수업 → 진행관리 |
| 차별 기능 | 강사 검증 · 매니저 대면 매칭 · **주간 숙제 자동 분배** · **Claude AI 질답** · 학습 리포트 |
| 기술 | Next.js 14 · Prisma · Supabase · Vercel · 토스페이먼츠(서버 검증) |
| 대응 화면 | 데스크톱 + 모바일 웹 (반응형) · 네이티브 앱 백엔드 API 완비 |

문서 구성: **1) 공개 페이지 → 2) 학생 여정 → 3) 강사 포털 → 4) 매니저 포털 → 5) 최고관리자 → 6) 모바일**. 각 절은 데스크톱 캡처를 기본으로 하며, 동일 화면의 모바일 버전은 `app-screenshots/{역할}/mobile/`에 있습니다.

---

## 1. 공개 페이지 — 첫인상과 신뢰 설계

로그인 없이 접근하는 마케팅·전환 페이지입니다. 서사는 **"성적보다 습관이 먼저 바뀐다"**는 불안 해소 카피를 축으로 합니다.

### 1.1 홈 (랜딩)
![홈](app-screenshots/public/desktop/home.png)

히어로 → 문제 제기 → 검증/매칭/관리 3단 약속 → 프루프 카드 → 상담 CTA로 이어지는 단일 전환 퍼널. 우상단 **무료 상담** 버튼이 모든 페이지에 상주합니다.

### 1.2 요금제
![요금제](app-screenshots/public/desktop/pricing.png)

월정액 선불 8개 플랜(38만~112만 원)을 과목·횟수 조합으로 제시. 강사 시급 30,000원 정산 구조 위에 평균 마진율 34.2%를 확보하는 단가 체계입니다.

### 1.3 강사진 / 강사 상세
![강사진](app-screenshots/public/desktop/tutors.png)
![강사 상세](app-screenshots/public/desktop/tutor-detail.png)

검증을 통과한(`approved`) 강사만 노출됩니다. 상세 페이지는 과목·경력·소개를 담아 "사전 검증된 강사"라는 핵심 가치를 시각화합니다.

### 1.4 후기
![후기](app-screenshots/public/desktop/reviews.png)

성적 수치가 아니라 **습관·태도 변화** 중심의 후기 카드. "대치동 학원을 옮겨다녔는데 매니저님이 직접 상담…", "모르는 문제를 밤에 올리면 AI가 바로 답을…" 등 제품 차별점이 그대로 사회적 증거가 됩니다.

### 1.5 FAQ · 약관 · 개인정보 · 환불정책
![FAQ](app-screenshots/public/desktop/faq.png)

| 화면 | 캡처 |
|---|---|
| FAQ | `public/desktop/faq.png` |
| 이용약관 | `public/desktop/terms.png` |
| 개인정보처리방침 | `public/desktop/privacy.png` |
| 환불정책 | `public/desktop/refund.png` |

법률·신뢰 문서가 이미 페이지로 편입되어 있어, 결제·분쟁 대응의 기본 골격을 갖췄습니다(정식 법률 검토는 별도 진행).

### 1.6 가입 · 로그인
![로그인](app-screenshots/public/desktop/login.png)

| 화면 | 캡처 |
|---|---|
| 로그인(휴대폰/이메일 + 비밀번호) | `public/desktop/login.png` |
| 학생 회원가입 | `public/desktop/register.png` |
| 강사 지원 | `public/desktop/register-teacher.png` |

---

## 2. 학생 여정 — 상담부터 수업 진행까지

Concord의 제품 북극성은 **"화면 너머가 아니라 옆자리에서"**입니다. 학생 대시보드는 학습 단계(Journey Stage)에 따라 다른 화면을 보여주며, 각 단계가 실제 DB 상태에서 자동 산출됩니다.

**단계: 상담대기 → 매니저 배정 → 매칭 진행 → 강사 수락 대기 → 첫 수업 대기 → 수업 진행(ACTIVE)**

### 2.1 ① 매칭 진행 (상담 완료)
![매칭 진행](app-screenshots/student/desktop/state-matching.png)

대면 상담이 끝나면 "곧 맞춤 선생님을 추천해 드릴게요" 상태 카드가 뜨고, 상담 메모(예: "수학 내신 대비, 주 2회 대면 희망")가 그대로 이어집니다.

### 2.2 ② 강사 수락 대기 — **핵심 차별점**
![수락 대기](app-screenshots/student/desktop/state-pending-accept.png)

매니저가 배정한 강사를 학생이 **직접 수락 버튼("이 선생님으로 시작하기")**으로 확정합니다. **매니저의 추천 이유**("학생 성향(차분한 설명 선호)에 맞춰 추천드립니다")가 함께 표시되어, 일방 배정이 아닌 **동의 기반 매칭**임을 보여줍니다. 미스매치 시 무료 재매칭.

### 2.3 ③ 첫 수업 일정 대기
![첫 수업 대기](app-screenshots/student/desktop/state-first-lesson.png)

학생이 강사를 수락하면 강사가 첫 수업 날짜를 설정하고, 그 전까지 "첫 수업 일정 조율 중" 상태를 유지합니다.

### 2.4 ④ 수업 진행 대시보드 (ACTIVE) — 제품의 심장
![학생 대시보드](app-screenshots/student/desktop/dashboard.png)

수업이 시작되면 학생은 통합 학습 대시보드를 받습니다. 한 화면에:

- **캘린더 학습 플래너** — 날짜별 할 일("미적분 개념정리 p88 예제 4개" 등), "이전 날에서 복사" 재사용
- **담당 선생님 카드** + 매니저 케어 기록("2주차 점검 — 과제 이행률 양호…")
- **선생님 코멘트**와 **학습 목표**(정량/정성 목표 분리)
- **질문(Q&A) 스레드** — 아래 2.5

### 2.5 ⑤ AI + 강사 질답 (Q&A) — 두 번째 차별점
![질문 목록](app-screenshots/student/desktop/questions.png)

학생이 모르는 문제를 올리면 **Claude AI가 즉시 1차 답변**하고, **담당 강사가 이어서 확인·보강**합니다. 대시보드 하단(2.4)에서도 동일 스레드가 보이며, "해결됨" 플래그로 관리됩니다.

> 예시: "미분계수 정의에서 극한이 존재하지 않으면 미분 불가능인가요?" → AI 즉답(순간변화율 정의) → 강사 보강("연속이지만 미분 불가능한 예 y=\|x\| 를 꼭 기억하세요") → **해결됨**.

이 구조는 "밤에 질문해도 방치되지 않는다"는 후기(1.4)의 실체이자, **AI 토큰 = 원가 통제 가능한 부가가치**라는 사업적 의미를 갖습니다.

### 2.6 결제 · 계정 · 알림
| 화면 | 설명 | 캡처 |
|---|---|---|
| 결제(체크아웃) | 토스페이먼츠 서버 검증 결제 | `student/desktop/checkout.png` |
| 결제 내역 | 납부·환불 이력 | `student/desktop/payments.png` |
| 계정 관리 | 프로필·보호자 정보 | `student/desktop/dashboard-account.png` |
| 알림 | 배정·수락·수업 알림 배치 | `student/desktop/notifications.png` |

---

## 3. 강사 포털 — 검증된 공급자 도구

강사는 별도 포털(`/teacher-portal`)에서 승인·학생·수업을 관리합니다.

### 3.1 강사 대시보드
![강사 대시보드](app-screenshots/teacher/desktop/tp-dashboard.png)

승인 상태(**승인 완료 → 수업을 시작하실 수 있습니다**)와 등록 정보(이름·담당 과목·연락처)를 노출. 상단 탭으로 프로필/학생 관리 이동.

### 3.2 강사 지원 · 랜딩 · 프로필
| 화면 | 캡처 |
|---|---|
| 강사 포털 랜딩 | `teacher/desktop/tp-landing.png` |
| 강사 지원 폼 | `teacher/desktop/tp-apply.png` |
| 프로필 관리 | `teacher/desktop/tp-profile.png` |
| 담당 학생 관리 | `teacher/desktop/tp-students.png` |

> 매칭·모니터링·상담 관리(`tp-matching`, `tp-monitoring`, `tp-consultations`)는 **매니저 권한 전용**이므로 일반 강사 계정에서는 대시보드로 안내됩니다(권한 게이팅 정상 동작).

---

## 4. 매니저 포털 — 운영의 중심

매니저는 배정된 학생을 상담하고, 강사를 매칭하고, 진행을 모니터링합니다. 최고매니저(Chief)는 강사 승인 권한을 추가로 가집니다.

### 4.1 매칭 관리 — **운영 차별점**
![매칭 관리](app-screenshots/manager/desktop/tp-matching.png)

상담이 끝난 학생(예: 박유나, 고3, 물리·수학)을 좌측에서 선택 → **강사 후보 카드**(김도현·박준호, 각 담당 학생 수 표시) → **담당 과목 매칭** → **매칭 이유(학생에게 표시)** 입력 → 매칭 등록. 이 이유가 학생 화면(2.2)의 "매니저의 추천 이유"로 그대로 전달됩니다.

### 4.2 상담 · 학생 · 모니터링
| 화면 | 설명 | 캡처 |
|---|---|---|
| 상담 관리 | 배정 학생 상담 일정·메모 | `manager/desktop/tp-consultations.png` |
| 학생 관리 | 담당 학생 전체 현황 | `manager/desktop/tp-students.png` |
| 모니터링 | 진행률·이상징후 감시 | `manager/desktop/tp-monitoring.png` |
| 강사 승인 | (매니저/최고매니저) 강사 심사 | `manager/desktop/manager-teacher-approval.png` |

### 4.3 최고매니저(Chief)
| 화면 | 캡처 |
|---|---|
| 최고매니저 대시보드 | `chief/desktop/tp-dashboard.png` |
| 강사 승인 | `chief/desktop/chief-teacher-approval.png` |

---

## 5. 최고관리자(Admin) — 데이터·정산·운영 콘솔

`/admin`은 사업 운영 전반을 통제하는 백오피스입니다.

![관리자 홈](app-screenshots/admin/desktop/admin-home.png)

| 콘솔 | 역할 | 캡처 |
|---|---|---|
| 학생 관리 | 전 학생 상태·이력 | `admin/desktop/admin-students.png` |
| 강사 관리 | 강사 승인·정산 대상 | `admin/desktop/admin-teachers.png` |
| 매칭 관리 | 전체 매칭 현황 | `admin/desktop/admin-matches.png` |
| 결제 관리 | 결제 트랜잭션 | `admin/desktop/admin-payments.png` |
| 정산 관리 | 강사 정산(시급 30,000원 기준) | `admin/desktop/admin-settlements.png` |
| 지표(Metrics) | 매출·활성·마진 KPI | `admin/desktop/admin-metrics.png` |
| 퍼널(Funnel) | 상담→결제 전환 분석 | `admin/desktop/admin-funnel.png` |
| 감사 로그 | 권한·데이터 변경 추적 | `admin/desktop/admin-audit-logs.png` |
| CMS | 공개 페이지 카피 관리 | `admin/desktop/admin-cms.png` |
| 데이터 | 원장·백업·운영 데이터 | `admin/desktop/admin-data.png` |

정산·퍼널·감사 로그까지 갖춰, **1인 운영에서 다인 운영으로 확장할 때 필요한 통제 인프라가 선제적으로 구축**되어 있습니다.

---

## 6. 모바일 대응

모든 페이지는 반응형으로 모바일 화면(390×844)에서도 동일 기능을 제공합니다. 캡처는 각 역할 폴더의 `mobile/`에 데스크톱과 1:1 대응됩니다.

- 학생: `student/mobile/dashboard.png`, `state-*.png`, `questions.png`
- 강사/매니저: `teacher/mobile/*`, `manager/mobile/*`
- 관리자: `admin/mobile/*`

> 네이티브 앱(React Native)은 백엔드 API 58종이 이미 완성되어 있어, 지원금 확보 시 프론트엔드 개발만으로 출시 가능한 상태입니다.

---

## 부록 — 캡처 커버리지

| 역할 | 페이지 수 | 뷰포트 | 합계 |
|---|---|---|---|
| 공개 | 12 | 2 | 24 |
| 학생(상태 3종 포함) | 10 | 2 | 20 |
| 강사 | 8 | 2 | 16 |
| 매니저 | 6 | 2 | 12 |
| 최고매니저 | 2 | 2 | 4 |
| 최고관리자 | 11 | 2 | 22 |
| **총계** | **49** | — | **98** |

전 페이지·전 역할·양대 뷰포트를 실데이터 시연 환경에서 촬영. 재촬영 스크립트: `/tmp/shoot.mjs`(전체) · `/tmp/shoot_states.mjs`(학생 단계).
