# 기능적 개선 제안 — 마케팅 · UX · 제품

> 작성: 2026-07-02 · 방법: 코드 실측 (모든 항목에 근거 명시, 추측 배제)
> 연관: `docs/IMPLEMENTATION_PLAN_2026-07.md`(스키마·P0), `docs/FLOW_EDGE_CASES_AND_IMPROVEMENTS.md`(플로우 결함)

## 핵심 발견 — "지어놓고 안 쓰는 기능" 4개

DB 모델 + 조회 API + 앱 화면까지 완성됐는데 **데이터를 쓰는 코드가 0줄**이라 유료 사용자에게 영구 빈 화면을 보여주는 기능들 (grep으로 쓰기 경로 부재 확인):

| 기능 | 모델 | 읽는 곳 | 쓰는 곳 |
|------|------|---------|---------|
| 월간 리포트 | `MonthlyReport` | `api/mobile/reports`, `api/mobile/me`, 앱 `report/[id].tsx` | **없음** |
| 강사 평점·후기 | `TutorReview` | `api/mobile/tutors` (평균·개수 계산까지 구현) | **없음** |
| 주간 학습 시간 | `StudySession` | `api/mobile/learning/weekly` (주간 막대) | **없음** |
| 온보딩 설문 | `OnboardingSurvey` | **없음** | **없음** |

유료 구독자가 앱을 켜면 리포트 탭 "첫 리포트 생성 전", 학습 탭 그래프 0분, 선생님 평점 0건이 **영원히** 지속된다. 신규 개발 없이 쓰기 경로만 붙이면 살아나는, ROI 최상의 개선 대상.

---

## A. 죽은 기능 활성화 (제품 가치 증명 = 해지 방어)

### FI-1. 월간 리포트 자동 생성 — 학부모에게 보내는 "돈값" 증거

**근거**: `MonthlyReport`는 `summary`·`weakTypes`·`detail` 스키마와 앱 리포트 화면이 완성돼 있으나 생성 코드가 없다. 월 40~144만원 구독 상품에서 학부모가 받는 정기 산출물이 0개 — 프리미엄 과외 서비스의 해지 방어 수단이 비어 있다.

**지시**:
1. `src/lib/generate-monthly-report.ts` 신규: 학생별로 전월의 ① `StudyTask` 완료율(주차별), ② `Question`+`QuestionMessage` 질문 수·주제, ③ `Lesson` 진행 횟수를 집계 → 기존 `ai-answer.ts`의 Anthropic 클라이언트 패턴 재사용해 Claude로 `summary`(3~4문장)·`weakTypes`(질문 내용에서 추출) 생성 → `MonthlyReport` upsert(`studentId_month` unique 활용). AI 키 없으면 집계 수치만으로 템플릿 문장 생성 (mock 폴백 패턴 동일).
2. `vercel.json`에 월간 Cron 추가: `0 22 last * *`는 불가하므로 `0 15 1 * *`(매월 1일 00:00 KST) → `GET /api/cron/monthly-reports` (CRON_SECRET Bearer, 기존 check-alerts 패턴 복제). 대상: 전월에 `ACTIVE` 구독이 있던 학생만.
3. 생성 완료 시 학생에게 `MONTHLY_REPORT_READY` 알림 + 푸시 (앱 리포트 탭 딥링크).

**기대효과**: 리텐션 — 학부모가 매달 받아보는 유일한 정기 리포트. 재결제 시점(월 단위 구독) 직전에 가치를 상기시킨다.

### FI-2. 수업 후 평점 수집 → 강사 평점 → 후기 마케팅 파이프라인

**근거**: `api/mobile/tutors/route.ts:39-62`가 평균 평점·리뷰 수를 이미 계산해 앱 '선생님 찾기'에 내려주지만 `TutorReview` 쓰기 API가 없어 항상 0건. 한편 마케팅 후기(`Testimonial`)는 Admin 수기 입력만 가능 — 실사용자 후기 수집 루프가 전무하다.

**지시**:
1. `POST /api/mobile/reviews` 신규 (`requireMobileStudent`): body `{ teacherId, rating(1-5), comment? }`, 본인 active `TeacherStudent` 매칭 검증, `@@unique([teacherId, studentId])`라 upsert (재평가 허용).
2. 트리거: `FLOW…md` EC-7의 `closePastLessons()`가 `COMPLETED` 전환한 수업이 학생별 누적 4회째(첫 결제 단위)일 때 `REVIEW_REQUEST` 알림+푸시 1회 발송. 앱 홈 `actionRequired`(IMP-2)에 `"RATE_TEACHER"` 케이스 추가.
3. 마케팅 전환: `GET/PATCH /api/admin/reviews` 신규 — Admin이 `TutorReview` 목록에서 좋은 후기를 선택하면 `Testimonial`로 복사(작성자 표기는 "고2 학부모" 식 익명화 후 노출, 본인 동의 문구를 평점 제출 UI에 포함).

**기대효과**: 앱 내 신뢰 신호(평점) + 공개 후기 페이지·홈의 사회적 증거가 실데이터로 채워진다. 수기 후기보다 전환 설득력이 높다.

### FI-3. 학습 시간 그래프를 실데이터로 — 가짜 0분 그래프 제거

**근거**: 앱 학습 탭 주간 막대는 `StudySession.minutes` 합산(`api/mobile/learning/weekly/route.ts:35-54`)인데 쓰기 경로가 없어 항상 0. 학생이 매일 태스크를 완료해도 그래프는 "공부 안 함"으로 보인다 — 동기부여 UI가 역효과를 낸다.

**지시** (가짜 추정치 대신 실측 가능한 데이터만):
1. `closePastLessons()`(EC-7)가 수업을 `COMPLETED` 처리할 때 `StudySession` upsert: `{ date: 수업일, minutes: durationMin, source: "lesson" }`.
2. `weekly` API의 막대를 `minutes` 단독에서 `{ lessonMinutes, tasksDone }` 복합으로 변경 — `StudyTask.doneAt`을 날짜별 count (실데이터). 앱 막대는 수업시간 + 완료 태스크 수 이중 표기.
3. 임의 추정(태스크당 N분 가산)은 **하지 말 것** — 학부모에게 보이는 수치의 신뢰가 상품이다.

### FI-4. 온보딩 설문 수집 → 상담·매칭 근거로 연결

**근거**: `OnboardingSurvey`(grade·goal·style·JSON) 사용처 0. 매니저는 학생의 목표·성향 정보 없이 대면 상담에 들어가고, 앱 매칭 화면의 "왜 이 선생님일까요?"는 선생님 `bio` 폴백이다 (`api/mobile/matches/route.ts:45` — `bio || "학습 목표에 맞춰 배정된…"`).

**지시**:
1. 앱 가입 완료 직후(`(auth)/signup.tsx` 성공 콜백) 3문항 설문 화면 추가 (목표 등급·취약 과목·선호 수업 스타일, 건너뛰기 허용) → `POST /api/mobile/onboarding-survey` 신규 → upsert.
2. 웹 상담 가입 모달(`ConsultationSignupForm`)에도 동일 3문항을 마지막 스텝으로 추가 → `POST /api/register/student` body 확장.
3. 매니저 상담 화면(`ManagerConsultationsPage`)의 학생 카드에 설문 응답 표시 — 상담 준비 시간 단축.
4. FI-5의 `matchReason`과 결합: 매니저가 배정 시 설문 응답을 보며 추천 사유를 쓰게 한다.

---

## B. 마케팅 퍼널

### FI-5. 매칭 수락률을 좌우하는 "추천 사유"를 매니저가 직접 쓰게

**근거**: 학생 수락이 플로우의 관문(북극성 6번)인데, 수락 화면의 설득 카피가 강사 자기소개 폴백이다. 대면 상담에서 매니저가 파악한 맞춤 근거("내신 4→2등급 목표시면 ○○ 선생님의 기출 중심 수업이…")가 가장 강한 전환 카피인데 담을 곳이 없다.

**지시**:
1. `IMPLEMENTATION_PLAN…md` §2.1 마이그레이션에 `TeacherStudent.matchReason String?` 추가 (같은 마이그레이션 1건 유지).
2. `POST /api/manager/matches` body에 `matchReason` 추가, 매니저 매칭 폼에 필수 입력 필드 (placeholder로 좋은 예시 제공).
3. `api/mobile/matches` GET의 `why`를 `matchReason ?? bio ?? 기본문구` 우선순위로 변경. 웹 수락 카드(EC-3)에도 동일 표시.

**기대효과**: 수락 대기 이탈(EC-1·EC-6의 원인) 감소 — 수락률은 결제 이후 첫 활성화 지표다.

### FI-6. 결제 구간 퍼널 이벤트가 통째로 없다 — /admin/funnel이 돈 앞에서 장님

**근거**: `src/lib/analytics-events.ts` 실측 — 상담·journey 이벤트는 촘촘한데 **`pricing_viewed`·`checkout_started`·`payment_completed`·`payment_failed`가 없다**. 요금제→체크아웃→결제 이탈률을 측정할 수 없고, 체크아웃 이탈자는 가입 전이라(인라인 가입이 success 시점에 실행됨, 핸드오프 §3.3) 아무 흔적도 남지 않는다.

**지시**:
1. `ANALYTICS_EVENTS`에 추가: `pricingViewed`, `pricingPlanCtaClicked`(plan id payload), `checkoutViewed`, `checkoutPaymentAttempted`, `paymentCompleted`, `paymentFailed`.
2. 발화 지점: `PricingContent`(mount), `PricingPlanCard`(CTA), `CheckoutContent`(mount + 위젯 결제 버튼), `SuccessPaymentComplete`(complete 성공/실패), 모바일 `checkout.tsx` 동일.
3. `/admin/funnel` 페이지에 "요금제 → 체크아웃 → 결제 완료" 구간 추가 (기존 AnalyticsEvent 집계 패턴 재사용).

### FI-7. 상담 신청 후 이탈 구간 리인게이지 (인앱·푸시만, SMS 동의 이슈 회피)

**근거**: 리인게이지 장치가 전무하다. ① WAITING 학생이 방문 희망시간을 안 넣으면 매니저가 연락할 근거가 없는데 학생 측 리마인더 없음, ② 상담 `COMPLETED` 후 결제·매칭 없이 이탈한 학생(= 가장 뜨거운 리드)에게 후속 터치 없음. Cron(`run-alert-checks.ts`)의 3개 체크는 전부 운영자 대상이고 학생 대상 넛지는 0개다.

**지시** (`run-alert-checks.ts`에 학생 대상 체크 2개 추가):
1. `checkVisitTimesMissing()`: `WAITING`·`ASSIGNED` + `visitPreferredTimes === "{}"` + 24h 경과 → 학생에게 "방문 희망 시간을 알려주시면 배정이 빨라져요" 알림+푸시 (1회, relatedId로 중복 방지).
2. `checkConsultCompletedNoPlan()`: `COMPLETED` + active 구독 없음 + active 매칭 없음 + 72h 경과 → "상담 결과 기반 맞춤 요금제 보기" 알림+푸시, `/pricing` 딥링크 (1회만 — 스팸 금지).
3. SMS는 붙이지 말 것 — 현행 SMS는 트랜잭션 알림 용도(`SMS_NOTIFICATION_TYPES`)이고 마케팅성 문자는 광고 수신동의(정보통신망법) 체계가 없어 위험.

### FI-8. 방치된 리드가 보이는 Admin 뷰

**근거**: 퍼널 이벤트(`AnalyticsEvent`)와 상담 상태는 쌓이는데, "상담 완료 후 7일간 미결제", "가입 후 상담 미신청" 같은 **행동 세그먼트를 보는 화면이 없다**. Admin 학생 목록은 검색·페이지네이션뿐.

**지시**: `/admin/students`에 세그먼트 필터 탭 추가 — ① 가입만(상담 없음) ② WAITING ③ 상담완료·미결제 ④ 수락대기(EC 문서 IMP-3 데이터 재사용) ⑤ 구독 활성. 쿼리는 `src/lib/admin-student-segments.ts` 신규로 분리. CSV 내보내기 버튼 (전화 아웃바운드용 — 이건 매니저의 통화 업무라 수신동의 이슈 없음).

---

## C. UX

### FI-9. 수업 리마인더 푸시 — 노쇼 방지

**근거**: `Lesson.startAt`이 있고 푸시 인프라(`expo-push.ts`·`PushDevice`)가 완성돼 있는데 수업 전 리마인더가 없다. Cron이 하루 1회(00:00 UTC)라 시간 단위 리마인더가 불가능한 구조적 제약이 원인.

**지시**:
1. `vercel.json` Cron을 시간별로 상향: `0 * * * *` → `/api/cron/check-alerts`에 시간별 체크(수업 리마인더)와 일별 체크(기존 3종, KST 자정 시간대에만 실행) 분리 실행. 기존 체크들의 24h 중복 방지 로직이 이미 있어 시간별 호출에 안전한지 각 체크별로 확인 후 적용.
2. `checkUpcomingLessons()`: `SCHEDULED` && `startAt`이 24h±30m 또는 1h±30m 이내 → 학생+선생님 푸시 `LESSON_REMINDER` (lessonId+시점 조합으로 중복 방지).

### FI-10. 매칭 전 학생에게 "지금 무슨 일이 일어나고 있는지" 타임라인 노출

**근거**: journey 카피(`JOURNEY_STAGE_COPY`)는 현재 단계 한 줄뿐이다. 결제한 학부모가 보는 화면은 "매니저 배정 완료" 문장 하나 — 프리미엄 서비스 기대치 대비 진행 가시성이 빈약하고, `consultationStatusViewClicked` 이벤트가 이미 있는 걸 보면 상태 확인 수요는 측정 중이다.

**지시**:
1. `getStudentJourneySnapshot()` 응답에 `timeline` 배열 추가: 각 단계(신청→배정→상담→매칭→수락→첫수업)의 `{ stage, done, at }` — booking `createdAt`/`assignedAt`, `TeacherStudent.createdAt`/`respondedAt`, 첫 `Lesson.startAt`에서 전부 도출 가능 (신규 저장 불필요).
2. 앱 `consult/status.tsx`와 웹 `ConsultationBookingPage`를 체크리스트형 타임라인 UI로 — 완료 단계는 시각과 함께, 다음 단계는 예상 안내 문구.
3. 매니저 배정 시 매니저 프로필(사진·이름)을 카드로 노출 — "담당자가 있다"는 감각이 프리미엄 상담 서비스의 핵심 UX다 (`booking.manager` 관계로 이미 조회 가능).

---

## 우선순위

| 등급 | 항목 | 근거 |
|------|------|------|
| **P1** | FI-1 (월간 리포트), FI-5 (matchReason — 마이그레이션 동승 필수), FI-6 (결제 퍼널 이벤트) | 해지 방어·수락률·측정은 매출 직결, 인프라 전부 존재 |
| **P1.5** | FI-3 (학습 그래프), FI-7 (리인게이지), FI-9 (수업 리마인더) | EC-7 크론 확장에 동승하면 한 세션에 처리 가능 |
| **P2** | FI-2 (평점 파이프라인), FI-4 (온보딩 설문), FI-10 (타임라인) | 신규 UI 필요, 플로우 안정화 후 |
| **P3** | FI-8 (세그먼트 뷰) | 리드 볼륨이 쌓인 뒤 가치 발생 |

**실행 시 주의**: FI-5의 `matchReason`은 반드시 `IMPLEMENTATION_PLAN…md` §2 마이그레이션 1건에 포함시켜 마이그레이션 횟수를 늘리지 말 것. FI-9의 Cron 시간별 전환은 EC-6·EC-7·IMP-4 크론 확장과 같은 세션에서 한 번에.
