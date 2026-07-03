# 제품·디자인 개선 트래커

> 통합일: 2026-07-04 · 구 문서 3개를 병합. 항목 번호(FI-*, EC-*, IMP-*, 디자인 §1~8)와 소제목은 원문 유지.
> 참조: 사업·리스크·성장은 `docs/BUSINESS_REVIEW.md`, 실행 계획은 `docs/IMPLEMENTATION_PLAN_2026-07.md`·`docs/IMPLEMENTATION_SESSIONS_REVISED.md`.

## 원본 → 섹션 매핑

| 원본 문서 | 이 문서의 섹션 |
|---|---|
| `docs/DESIGN_IMPROVEMENTS.md` (§7 구현 현황·§8 잔여 이슈 포함) | **Part 1** (트래커 성격을 살리기 위해 상단 배치) |
| `docs/PRODUCT_IMPROVEMENTS.md` (FI-*) | **Part 2** |
| `docs/FLOW_EDGE_CASES_AND_IMPROVEMENTS.md` (EC-*, IMP-*) | **Part 3** |

---

# Part 1 — 홈페이지 디자인 개선안 (구 `DESIGN_IMPROVEMENTS.md`)

> 기준: `https://tutormatch-web.vercel.app/` (LandingPageV2)
> 참고: 콴다과외(class.qanda.ai), 설탭(index.seoltab.com)
> 원칙: **기존 미니멀·타이포 중심 디자인은 유지**하고, 신뢰도와 전환율을 보강하는 방향.

---

## 디자인 §7. 구현 현황 (2026-07-04)

### 완료 — 홈 랜딩
- 통계 논리 오류 수정 (누적 상담 1,200+ / 매칭 완료 500+)
- 모바일 플로팅 상담 CTA (`MobileFloatingCta.tsx`, 스크롤 560px 후 노출)
- 랜딩 FAQ 섹션 (네이티브 `<details>` 아코디언, 미사용이던 faqs 데이터 활용)
- 선생님 카드 전체 `/tutors` 링크화 + 선발 절차 3단계 배지
- 후기 섹션 `/reviews` 전체 보기 링크
- Results 카드 이미지 자체 호스팅 (`public/images/results/`, Unsplash 핫링크 제거)

### 완료 — 서브페이지 (전체 순회 감사 후)
- `/pricing` 가격 천단위 콤마 (400000원 → 400,000원)
- `/tutors` 강사 사진 빈 alt 수정, 하단 상담 CTA 추가 (`ConcordSubpageCta.tsx`)
- `/reviews` 하단 상담 CTA 추가
- `/faq` 아코디언 aria-expanded/aria-controls + FAQPage JSON-LD (SEO)
- 푸터 죽은 SNS 링크(`href="#"`) — 유효 URL 없으면 컬럼 자체 미노출
- 데드코드 `register/RegisterForm.tsx` 삭제 (Tailwind 토큰 이질 + 미사용)
- `/login` 장식뿐이던 학생/선생님 role 탭 제거 (리다이렉트는 세션 role 기반으로 동작 중이었음)
- `/terms` `/privacy` `/refund` 앵커 목차(`LegalToc.tsx`, scroll-margin 처리) + 히어로 카피 개선
- `/register` 모달 실패 시 fallback 보강 (로그인 링크 추가)

## 디자인 §8. 순회 감사에서 발견된 잔여 이슈 (미구현 — 결정/데이터 필요)

| 우선순위 | 항목 | 비고 |
|---|---|---|
| 🔴 | **CMS DB 전체 비어 있음** (SiteContent/Testimonial/FaqItem 0행) — 사이트 전체가 코드 기본값으로 렌더링 중 | 시드 실행 여부는 다른 세션 작업과 조율 필요 |
| ✅ | ~~`/tutors`에 `[sample]` 계정·매니저 계정 공개 노출~~ → 공개 목록을 TEACHER 전용 + `[sample]` 제외로 수정 완료 (상세 딥링크는 기존 role 유지) | DB의 샘플 데이터 자체 정리는 별도 |
| 🔴 | 법적 페이지 `[기재 예정]` 다수 (terms 4곳, privacy 6곳, refund 시행일) | 실제 사업자 정보 필요 |
| 🔴 | `/login` 비밀번호 찾기 링크 부재 | 재설정 플로우(SMS/이메일) 자체가 미구현이라 선행 개발 필요 |
| 🟠 | `/reviews` 전 카드 ★★★★★ 하드코딩 — 조작 인상 우려 | 유지/제거/개별 rating 필드 중 결정 필요 |
| 🟡 | FAQ 카테고리 그루핑, 강사 필터 칩과 실제 과목 태그 정합성 | |

> 참고: "헤더 컬러 스위처 상시 노출" 지적은 재검증 결과 공개 페이지에는 해당 없음(로그인 후 포털 셸 전용) — 이슈에서 제외.

---

## 디자인 §1. 현재 디자인 진단

**잘 되어 있는 것 (유지)**

- Pretendard 기반의 절제된 타이포그래피, 큰 헤드라인 히어로 — 참고 사이트 대비 오히려 "프리미엄" 포지셔닝에 잘 맞음
- 그린/블루 테마 + 라이트/다크 모드, CSS 변수 체계 (`globals.css`)
- 섹션 논리 흐름(히어로 → 성적 사례 → 선생님 → 관리 → 프로세스 → 가격 → 비교 → 후기 → CTA)이 콴다과외의 "신뢰 구축 → 가격 → 리스크 감소" 흐름과 이미 유사
- 첫 수업 100% 환불, 히어로 신뢰 pill, 비교 테이블 등 리스크 감소 장치 존재

**핵심 약점 한 줄 요약**: *"사람이 안 보인다."* 대면 상담·전담 매니저·엄선된 선생님이 셀링 포인트인데, 페이지 전체에 실제 인물이 한 명도 없음.

---

## 디자인 §2. 인물 사진 (사용자 제안 방향 — 최우선)

### 2-1. 선생님 카드 이미지 교체 — 🔴 심각

- 현재 `public/images/teachers/default-male.png` / `default-female.png`는 **범용 라인아트 아바타 아이콘** (스톡 아이콘 스타일). "명문대 출신부터 경력 10년 이상 전문가까지"라는 헤드라인 바로 아래에 익명 아이콘 4개가 나오면 오히려 신뢰를 깎음.
- 콴다과외는 선생님 9명의 실제 프로필 사진 + "서울대 출신·경력 6년" 조합으로 이 섹션을 최대 신뢰 자산으로 사용.
- **권장 (우선순위 순)**:
  1. 실제 소속 선생님 사진 (상반신, 밝은 단색/스튜디오 배경, 동일 톤으로 촬영·보정 통일)
  2. 실사진이 어려우면 설탭 방식: 대체 이미지 사용 + **"사진은 실제와 다를 수 있습니다" 면책 문구** 병기
  3. 최소한 현재 라인아트 → 브랜드 컬러 기반 일러스트/이니셜 아바타로 교체 (톤 통일)
- 카드 CSS(`lp2-t-media`, 4:3, object-top)는 이미 인물 사진용으로 설계되어 있어 **이미지 파일만 교체하면 됨**. CMS(`teachers.teacherN_image`)로도 교체 가능.

### 2-2. 매니저의 얼굴 — 🔴 신뢰도 핵심

- 이 서비스의 차별점은 "전담 매니저가 직접(대면) 상담"인데, 매니저는 텍스트로만 존재.
- 프로세스 섹션(02 매니저 배정) 또는 별도 소단락에 **매니저 실물 사진 + 실명(성+직함) + 경력 한 줄** 추가. 학부모가 전화를 받기 전 얼굴을 미리 보는 것 자체가 대면 상담 모델의 강력한 신뢰 장치.
- 기존 레이아웃을 해치지 않는 방법: Learning Care 카드(`lp2-care-card`)와 같은 스타일의 카드 1장을 프로세스 섹션 옆/아래 배치.

### 2-3. 히어로에 인물 개입 — 🟡 선택적, 기존 디자인 존중

- 지금 히어로는 텍스트 + 그라디언트/그리드 배경. 이 타이포 히어로는 정체성이므로 **전면 이미지 히어로로 바꾸지 말 것**.
- 대신 절충안: 데스크톱에서 히어로 우측 여백에 **수업 장면(선생님+학생) 사진 카드 1장**을 작게 띄우기 (라운드 18px, 기존 `--shadow-md`, 살짝 회전). 텍스트 중심 구조 유지하면서 "사람" 첫인상만 추가.
- 대안: 히어로는 그대로 두고, 바로 아래 Results 마퀴 카드에 인물 이미지를 넣는 것으로 갈음.

### 2-4. 후기(Reviews) 실체화 — 🟠

- 현재 후기 카드는 따옴표 + 텍스트 + "고2 수학 · 학부모"뿐. 콴다·설탭 모두 **이름 일부 공개(김○○ 학부모) + 사진/아바타** 사용.
- 권장: 카드 하단에 원형 아바타(32~40px) + "김○○ 어머니 · 고2 수학" 형식. 실사진 없으면 이니셜 아바타 + 면책 문구.
- 참고: `page.tsx`의 fallbackTestimonials에 `img` 필드(Unsplash URL)가 이미 있으나 **LandingPageV2가 렌더링하지 않음** — 필드는 있는데 안 쓰는 상태.

### 2-5. Results 카드 이미지 국내 정서화 — 🟠

- `result-card-images.ts`가 전부 Unsplash 스톡(외국 사무실 차트, 노트북 등). 한국 학부모에게는 이질적.
- 권장: **모자이크 처리한 실제 성적표/모의고사 성적 그래프, 또는 서비스 내 학습 리포트 스크린샷**. "결과로 증명합니다"라는 헤드라인과 이미지 내용이 일치해야 함. 콴다과외도 성적 변화를 이미지가 아닌 숫자로 크게 보여줌 → 이미지 대신 등급 변화 타이포를 키우는 것도 방법.

---

## 디자인 §3. 신뢰 요소 보강 (사진 외)

### 3-1. 통계 숫자의 논리 오류 — 🔴 즉시 수정

- 히어로 stats: **"누적 상담 500+ / 매칭 완료 1,200+"** → 상담보다 매칭이 많을 수 없음. 눈치챈 학부모에게는 치명적. 숫자 재검토 필요 (CMS `stats` 섹션에서 수정 가능).
- 설탭처럼 기준 시점 병기 권장: "2026년 상반기 기준" 등. 검증 불가능한 수치는 빼는 게 나음.

### 3-2. 사업자 정보·인증 — 🔴

- 설탭은 학원설립운영등록번호·사업자등록번호·교습비 안내를 명시. 푸터에 **상호/대표자/사업자등록번호/통신판매업/주소/연락처**가 없다면 반드시 추가 (전자상거래법상 결제 받는 사이트는 의무이기도 함).

### 3-3. 선발 절차의 시각화 — 🟠

- "확실한 서류 인증과 채용 절차로 엄선된"이라는 문구를 뒷받침하는 시각 자료가 없음.
- 권장: 선생님 섹션 하단에 작은 스텝 배지 3개 — "서류·학력 인증 → 수업 시연 → 대면 인터뷰 (합격률 n%)". 설탭의 '선생님 선별 체계' 섹션에 해당. 기존 `lp2-hero-pill` 스타일 재사용 가능.

### 3-4. 후기 출처와 수량 — 🟡

- "후기 ○○건", 출처(카카오 채널/네이버 등) 명시 시 신뢰 상승. `/reviews` 페이지가 이미 있으므로 "후기 전체 보기 →" 링크를 후기 섹션에 추가.

---

## 디자인 §4. 전환(CTA) 개선 — 두 참고 사이트의 공통 패턴

### 4-1. 모바일 플로팅 CTA — 🔴 효과 대비 비용 최소

- 콴다·설탭 모두 스크롤 내내 상담 CTA가 고정 노출. 현재 사이트는 스크롤하면 CTA가 사라짐 (플로팅 요소 없음 확인).
- 권장: 모바일에서 히어로를 지나면 하단에 고정 바(`무료 상담 신청` 풀폭 버튼) 노출. 기존 `lp2-btn-acc` 스타일 그대로 사용하면 디자인 이질감 없음.

### 4-2. 카카오톡 채널 버튼 — 🟠

- 설탭은 "단 5초, 상담신청" 카카오 CTA를 3회 이상 반복. 한국 학부모 대상 서비스에서 전화·폼보다 진입 장벽이 낮음. 플로팅 원형 버튼 또는 CTA 밴드에 보조 버튼으로 추가.

### 4-3. 랜딩에 FAQ 섹션 부재 — 🟠 (코드상 데이터는 이미 있음)

- `page.tsx`가 `faqs`를 fetch해서 내려주지만 **LandingPageV2는 FAQ를 렌더링하지 않음** (죽은 데이터). 콴다·설탭 모두 가격 뒤 FAQ 배치 — 이탈 직전 마지막 불안 해소 장치.
- 권장: 가격/비교 섹션과 CTA 밴드 사이에 아코디언 4개 추가 + "FAQ 전체 보기 → /faq".

### 4-4. 전화번호 노출 — 🟡

- 설탭은 대표번호를 노출. 40~50대 학부모 대상이므로 푸터·CTA 밴드에 전화번호 명시 권장.

---

## 디자인 §5. 기술·디테일 (기존 톤 유지 범위 내)

| # | 항목 | 내용 |
|---|------|------|
| 5-1 | 외부 이미지 의존 | Results·후기 이미지가 Unsplash 핫링크. 성능(외부 도메인 커넥션)·서비스 중단 리스크 → `public/` 자체 호스팅 또는 Vercel Blob으로 이전 |
| 5-2 | 다크모드 사진 처리 | 인물 사진 도입 시 다크 테마에서 카드 배경과 충돌하지 않도록 `lp2-t-media` 배경/보더 확인 |
| 5-3 | 선생님 카드 클릭 | 카드 hover는 있는데 클릭 목적지가 없음 → 카드 전체를 `/tutors` 상세로 링크 |
| 5-4 | 후기 `img` 필드 | 렌더링에 사용하거나 데이터에서 제거 (2-4와 연동) |
| 5-5 | 히어로 pill 하드코딩 | `heroTrustPills`가 컴포넌트 하드코딩 — 다른 문구처럼 CMS 편집 가능하게 통일 고려 |
| 5-6 | 결과 마퀴 접근성 | 자동 스크롤 마퀴는 `prefers-reduced-motion` 대응 완료(양호). 모바일에서 터치로 넘길 수 있는 스와이프 대체도 고려 |

---

## 디자인 §6. 우선순위 요약

| 순위 | 작업 | 난이도 | 기대 효과 |
|------|------|--------|-----------|
| 1 | 선생님 카드 실사진(또는 면책 병기 대체 사진) 교체 (2-1) | 낮음 (이미지 교체) | 매우 큼 |
| 2 | stats 논리 오류 수정 (3-1) | 매우 낮음 (CMS) | 큼 |
| 3 | 모바일 플로팅 CTA (4-1) | 낮음 | 큼 |
| 4 | 푸터 사업자 정보 (3-2) | 낮음 | 큼 (법적 필수) |
| 5 | 매니저 소개 사진+실명 (2-2) | 낮음 | 큼 |
| 6 | 랜딩 FAQ 섹션 (4-3) | 중간 | 중간 |
| 7 | 후기 아바타+실명 일부 (2-4) | 낮음 | 중간 |
| 8 | Results 이미지 국내 정서화 (2-5) | 중간 (자료 필요) | 중간 |
| 9 | 카카오 채널 버튼 (4-2) | 낮음 | 중간 |
| 10 | 선발 절차 시각화 (3-3) | 중간 | 중간 |
| 11 | 히어로 인물 카드 (2-3) | 중간 | 중간 (선택) |
| 12 | 5장 기술 디테일 | 낮음~중간 | 소~중 |

**결론**: 사용자 판단대로 "인물 사진 추가"가 가장 임팩트 큰 방향이 맞음. 다만 사진의 우선 투입처는 히어로가 아니라 ① 선생님 카드 ② 매니저 소개 ③ 후기 순서가 효율적. 레이아웃 변경 없이 이미지 슬롯이 이미 존재하는 곳부터 채우면 기존 디자인을 전혀 해치지 않고 개선 가능.

---

# Part 2 — 기능적 개선 제안 (구 `PRODUCT_IMPROVEMENTS.md`)

> 작성: 2026-07-02 · 방법: 코드 실측 (모든 항목에 근거 명시, 추측 배제)
> 연관: `docs/IMPLEMENTATION_PLAN_2026-07.md`(스키마·P0), Part 3(플로우 결함)

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
2. 트리거: Part 3 EC-7의 `closePastLessons()`가 `COMPLETED` 전환한 수업이 학생별 누적 4회째(첫 결제 단위)일 때 `REVIEW_REQUEST` 알림+푸시 1회 발송. 앱 홈 `actionRequired`(IMP-2)에 `"RATE_TEACHER"` 케이스 추가.
3. 마케팅 전환: `GET/PATCH /api/admin/reviews` 신규 — Admin이 `TutorReview` 목록에서 좋은 후기를 선택하면 `Testimonial`로 복사(작성자 표기는 "고2 학부모" 식 익명화 후 노출, 본인 동의 문구를 평점 제출 UI에 포함).

**기대효과**: 앱 내 신뢰 신호(평점) + 공개 후기 페이지·홈의 사회적 증거가 실데이터로 채워진다. 수기 후기보다 전환 설득력이 높다.

### FI-3. 학습 시간 그래프를 실데이터로 — 가짜 0분 그래프 제거

**근거**: 앱 학습 탭 주간 막대는 `StudySession.minutes` 합산(`api/mobile/learning/weekly/route.ts:35-54`)인데 쓰기 경로가 없어 항상 0. 학생이 매일 태스크를 완료해도 그래프는 "공부 안 함"으로 보인다 — 동기부여 UI가 역효과를 낸다.

**지시** (가짜 추정치 대신 실측 가능한 데이터만):
1. `closePastLessons()`(Part 3 EC-7)가 수업을 `COMPLETED` 처리할 때 `StudySession` upsert: `{ date: 수업일, minutes: durationMin, source: "lesson" }`.
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
1. `docs/IMPLEMENTATION_PLAN_2026-07.md` §2.1 마이그레이션에 `TeacherStudent.matchReason String?` 추가 (같은 마이그레이션 1건 유지).
2. `POST /api/manager/matches` body에 `matchReason` 추가, 매니저 매칭 폼에 필수 입력 필드 (placeholder로 좋은 예시 제공).
3. `api/mobile/matches` GET의 `why`를 `matchReason ?? bio ?? 기본문구` 우선순위로 변경. 웹 수락 카드(Part 3 EC-3)에도 동일 표시.

**기대효과**: 수락 대기 이탈(Part 3 EC-1·EC-6의 원인) 감소 — 수락률은 결제 이후 첫 활성화 지표다.

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

## Part 2 우선순위

| 등급 | 항목 | 근거 |
|------|------|------|
| **P1** | FI-1 (월간 리포트), FI-5 (matchReason — 마이그레이션 동승 필수), FI-6 (결제 퍼널 이벤트) | 해지 방어·수락률·측정은 매출 직결, 인프라 전부 존재 |
| **P1.5** | FI-3 (학습 그래프), FI-7 (리인게이지), FI-9 (수업 리마인더) | Part 3 EC-7 크론 확장에 동승하면 한 세션에 처리 가능 |
| **P2** | FI-2 (평점 파이프라인), FI-4 (온보딩 설문), FI-10 (타임라인) | 신규 UI 필요, 플로우 안정화 후 |
| **P3** | FI-8 (세그먼트 뷰) | 리드 볼륨이 쌓인 뒤 가치 발생 |

**실행 시 주의**: FI-5의 `matchReason`은 반드시 `docs/IMPLEMENTATION_PLAN_2026-07.md` §2 마이그레이션 1건에 포함시켜 마이그레이션 횟수를 늘리지 말 것. FI-9의 Cron 시간별 전환은 Part 3 EC-6·EC-7·IMP-4 크론 확장과 같은 세션에서 한 번에.

---

# Part 3 — 플로우 Walk-through 엣지케이스 & 구조적 개선안 (구 `FLOW_EDGE_CASES_AND_IMPROVEMENTS.md`)

> 작성: 2026-07-02 · 방법: 실제 라우트·lib 코드 실측 walk-through (추측 아님 — 모든 항목에 파일:라인 근거)
> 선행 문서: `docs/IMPLEMENTATION_PLAN_2026-07.md` — 이 파트의 지시는 그 계획의 P1(§3.2) 범위를 구체화·정정한다.

## ⚠️ 계획 문서 대비 현행화 노트 (먼저 읽을 것)

작업 트리 코드는 핸드오프(§22.2)보다 이미 앞서 있다:

- `POST /api/manager/matches`는 이미 **`isActive: false`로 매칭을 생성**하고 학생에게 "앱에서 수락" 알림을 보낸다 (`src/app/api/manager/matches/route.ts:92-94`).
- **모바일 수락 API가 이미 존재**: `POST /api/mobile/matches` (`src/app/api/mobile/matches/route.ts:55`), 앱 수락 버튼도 구현됨 (`mobile/app/consult/match.tsx:129`).

따라서 계획 문서의 B1·B6·B7(수락)은 절반 완료 상태다. **그러나 거절·취소·재배정이 전부 없어서, 절반 구현이 아래 데드락들을 만들었다.** 이 파트의 지시가 우선한다.

---

## Part 3-A — 시나리오 Walk-through 엣지케이스

### EC-1. 학생이 배정된 선생님을 거절하면? → 거절 수단이 없고, 매니저도 되돌릴 수 없다 (데드락)

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

### EC-2. 2과목 결제 학생은 두 번째 선생님을 배정받을 수 없다

**시나리오**: 학생이 `/checkout?sessions=8&subjects=2`로 **2과목 요금(월 144만원)을 결제** → 매니저가 수학 선생님 배정 → 영어 선생님 배정 시도 → **409**.

**현재 코드 동작**: EC-1과 같은 체크(`manager/matches/route.ts:73-81`)가 과목 무관하게 학생당 매칭 1개만 허용. 요금제는 2과목을 팔지만(`pricing-plans.ts` `4-2`/`8-2`) 매칭 계층은 1선생님만 지원.

**지시**: 중복 체크를 (studentId, 과목 겹침) 기준으로 변경 — 신규 매칭 subjects와 기존 active/pending 매칭 subjects의 교집합이 있을 때만 409. `Subscription.plan`의 과목 수(`*-2`)를 초과하는 3번째 매칭은 경고만 (하드 블록은 하지 않음 — 매니저 재량 보존, CLAUDE.md 북극성 5번).

### EC-3. 웹으로만 가입한 학생은 수락 자체가 불가능하다

**시나리오**: 학부모가 PC 웹으로 가입·결제 → 상담 완료 → 매니저가 선생님 배정 → 웹 알림: *"앱에서 선생님 정보를 확인하고 수락해 주세요"* (`manager/matches/route.ts:123`) → **앱이 없다**.

**현재 코드 동작**: 수락 API는 `requireMobileStudent`(모바일 JWT) 전용 (`src/app/api/mobile/matches/route.ts:9`). 웹에는 수락 UI·API 모두 없음. 웹 `/dashboard`는 `isActive: true` 매칭을 요구하므로 이 학생은 **`/dashboard/consultation`의 "매칭 진행 중" 화면에 영구 고착**된다.

**지시**:
1. 수락/거절 로직을 `src/lib/match-response.ts`로 추출 (계획 문서 B7과 동일 방향).
2. 웹용 `POST /api/student/match-response` 신규 (`requireStudent` 가드, body `{ matchId, action, reason? }`).
3. `ConsultationBookingPage`(웹 상담 화면)에 pending 매칭 존재 시 선생님 카드 + 수락/거절 버튼 렌더링. 데이터는 `GET /api/consultation/my-booking` 응답에 `pendingMatch` 필드를 추가해 내려줌.

### EC-4. 제안 시점에 선생님은 "학생이 배정되었다"는 알림을 받지만, 포털에서 그 학생이 안 보인다

**시나리오**: 매니저가 배정 → 선생님에게 `NEW_STUDENT_ASSIGNED` "새로운 학생이 배정되었습니다" 즉시 발송 (`manager/matches/route.ts:111-118`) → 선생님이 포털 '담당 학생' 진입 → **학생 없음**.

**현재 코드 동작**: `GET /api/teacher/students`는 `isActive: true`만 조회 (`src/app/api/teacher/students/route.ts:12`). 수락 전 학생은 비노출. 수락 시점에 **같은 타입의 알림이 한 번 더** 발송된다 (`mobile/matches/route.ts:87-93` — "학생이 배정 선생님을 수락했습니다").

**지시**:
1. 제안 시점 선생님 알림을 신규 타입 `MATCH_PROPOSED_TEACHER`("매칭 제안됨 — 학생 수락 대기 중")로 교체, 수락 시점 알림만 `NEW_STUDENT_ASSIGNED` 유지.
2. `GET /api/teacher/students` 응답에 pending 학생을 `status: "PENDING"` 구분자와 함께 포함 (이름·과목만, 플랜·질문 접근은 여전히 `requireTeacherStudentMatch`가 차단 — 수정 불필요, `src/lib/teacher-student-match.ts:9-16`이 이미 `isActive: true`만 통과).
3. `TeacherStudentsManager.tsx`에 "수락 대기" 뱃지 섹션 추가.

### EC-5. 결제했는데 Chief 매니저가 없으면? → 503 이후 영구 재시도 불가 버그

**시나리오**: Chief 미설정 상태에서 학생 결제 → `/api/payments/complete` 503 → 운영자가 Chief 설정 → 학생(또는 success 페이지)이 재시도 → **500. 영원히 실패.**

**현재 코드 동작** (`src/lib/student-payment.ts`):
1. 최초 호출: `PaymentCompletion(orderId, status: "PROCESSING")` 생성(:94) → `assignChiefManagerToStudent()`가 `NO_DEFAULT_MANAGER` throw → catch에서 `status: "FAILED"` 마킹(:152-156) → 503.
2. 재시도: `existingCompletion.status === "FAILED"`는 **분기 처리가 없어**(:78-90은 COMPLETED/PROCESSING만) 코드가 `create`(:94)로 진행 → `orderId` `@unique` 위반 **P2002** → catch → rethrow → **500**.

돈은 토스에서 빠져나갔는데(위젯 결제 완료) 구독·배정은 없고, 같은 orderId로는 복구가 불가능하다.

**지시**:
1. `completeStudentPayment()`에 FAILED 분기 추가: `existingCompletion?.status === "FAILED"`이면 `update`로 `status: "PROCESSING"` 재전환 후 기존 플로우 계속 (create 대신).
2. `GET /api/admin/payments/incomplete` 신규 — `PaymentCompletion.status in ("FAILED","PROCESSING")` 목록 + `POST /api/admin/payments/[orderId]/retry` (requireAdmin). Admin 대시보드에 미완료 결제 카운트 표시.
3. success 페이지(`SuccessPaymentComplete.tsx`)에서 503/500 시 orderId를 localStorage에 보관하고 `/dashboard/consultation` 진입 시 자동 재시도 1회.

### EC-6. 학생이 수락도 안 했는데 "수업 시작일"이 이미 박혀 있고, 아무도 감시하지 않는다

**시나리오**: 매니저가 7/2에 배정(기본 `startDate = today`, `manager/matches/route.ts:48-49`) → 학생이 앱을 안 열어 1주 방치 → 7/9가 되어도 시스템은 아무 것도 하지 않는다.

**현재 코드 동작**: Cron(`run-alert-checks.ts`)은 미답변 질문·주간 진도·WAITING 상담만 검사. **pending 매칭·수락 후 첫수업 미설정은 검사 항목에 없음**. 학생이 앱 푸시 1회(`TEACHER_ASSIGNED`)를 놓치면 후속 신호 제로.

**지시** (`src/lib/run-alert-checks.ts`에 체크 2개 추가):
1. `checkStalePendingMatches()`: `TeacherStudent(isActive: false, createdAt < now-24h)` → 학생에게 푸시 재알림(`MATCH_ACCEPT_REMINDER`) + 담당 매니저에게 알림. 48h 경과 시 매니저에게 "재매칭 검토" 알림. 24h 중복 방지는 기존 미답변 질문 패턴 재사용.
2. `checkFirstLessonNotSet()`: `isActive: true`인데 해당 (teacherId, studentId)의 `Lesson`이 0건이고 수락(`respondedAt`) 후 48h 경과 → 선생님 + 매니저 알림.
3. `startDate`는 제안 시점에 넣지 말 것 — `manager/matches` POST에서 `startDate` 기본값을 빈 의미로 두거나(제안일 기록은 `createdAt`이 이미 있음) 첫수업 API가 갱신하는 현행 동작(`first-lesson/route.ts:108-114`)에 위임.

### EC-7. 수업이 시작된 뒤 first-lesson API를 다시 호출하면 과거 수업 기록이 덮어써진다

**시나리오**: 첫 수업(7/5) 완료 → 2주 후 선생님이 "다음 수업 일정을 바꾸려고" 첫수업 설정 화면을 다시 사용 → **7/5의 수업 레코드가 새 날짜로 UPDATE**되어 이력이 사라진다.

**현재 코드 동작**: `first-lesson/route.ts:78-85`가 `findFirst({ status: { not: "CANCELLED" } }, orderBy: { startAt: "asc" })` — **가장 이른 수업**(이미 지난 수업 포함)을 잡아 update한다. 또한 `Lesson.status`를 `COMPLETED`로 바꾸는 코드가 어디에도 없어 모든 수업이 영원히 `SCHEDULED`다.

**지시**:
1. 계획 문서 §2.4 `lessonType: "FIRST"` 적용 후, first-lesson API는 `lessonType: "FIRST"` && `startAt > now` 인 수업만 update, 과거 FIRST 수업이 있으면 409 `"첫 수업이 이미 진행되었습니다"` 반환.
2. Cron에 `closePastLessons()` 추가: `status: "SCHEDULED"` && `startAt + durationMin < now-12h` → `COMPLETED` 일괄 전환.

### EC-8. 이미 담당 매니저와 상담을 끝낸 학생이 결제하면 담당이 Chief로 강제 교체된다

**시나리오**: 상담 신청 → 매니저 M 배정 → 방문 상담 `COMPLETED` → 매칭 대기 중 학생이 그제서야 결제 → `assignChiefManagerToStudent()`가 **booking을 무조건 `managerId: chief, status: "ASSIGNED"`로 UPDATE** (`src/lib/student-enrollment.ts:146-157`).

**결과**: ① 상담을 진행한 M이 학생을 잃음 (`ManagerStudent`에 M 링크는 남지만 booking 주인은 chief), ② 상담 상태가 `COMPLETED → ASSIGNED`로 **역행**해 학생 화면이 "선생님 매칭 진행"에서 "매니저 배정 완료"로 되돌아감, ③ Chief는 이미 상담이 끝난 학생에게 "담당 학생 배정" 알림을 받고 중복 상담을 준비하게 됨.

**지시**: `assignChiefManagerToStudent()` 수정 — `existing.managerId`가 있으면 **기존 매니저·상태 유지** (booking은 건드리지 않고 `ManagerStudent` upsert와 알림만 기존 매니저에게). `existing.status === "COMPLETED"`도 역행 금지. Chief 교체는 `managerId == null`(WAITING)일 때만.

### EC-9. `CHIEF_MANAGER_EMAIL` 오타 시 임의의 매니저에게 소리 없이 배정된다

**시나리오**: env에 `chief@concrod.local`(오타) 설정 → 결제 학생 유입 → `getChiefManager()`가 email 매치 실패 → CHIEF_MANAGER 역할 검색 → 이름 "Chief" 검색 → **`getDefaultManager()` = 가장 먼저 등록된 매니저** (`src/lib/chief-manager.ts:34-49`, `default-manager.ts:17-21`). 유료 학생 전원이 잘못된 매니저에게 조용히 배정되고, 아무 로그·경고가 없다.

**지시**: `getChiefManager()`에서 `CHIEF_MANAGER_EMAIL`이 설정됐는데 email 매치가 실패하면 `console.error("[chief-manager] CHIEF_MANAGER_EMAIL set but no matching approved manager: " + chiefEmail)` 로깅 + Admin에게 1일 1회 `OPS_CONFIG_WARNING` 알림 (Cron에서 검사). 폴백 자체는 유지 (서비스 중단보다 낫다).

### EC-10. 상담 `COMPLETED` 학생은 매칭이 안 된 채로 재상담을 신청할 수 없다

**시나리오**: 상담 완료 → 매니저가 적합한 선생님을 못 찾음 → 3주 경과 → 학생이 "다시 상담하고 싶다" → `createConsultationRequest()`가 `ALREADY_COMPLETED` throw (`src/lib/student-enrollment.ts:28-30`). `ConsultationBooking.studentId`가 `@unique`라 새 레코드도 불가.

**지시** (스키마 변경 없는 최소 수정): `COMPLETED`이고 **active 매칭이 0건**이면 기존 booking을 WAITING으로 리셋 허용 (CANCELLED 재신청과 동일 경로, `managerNote`에 이전 이력 append). active 매칭이 있으면 현행대로 거부. 근본 해결(1:N 이력화)은 계획 문서 P3-10 유지.

## 검토했으나 문제 없음 (참고)

- **수락 중복 탭/동시성**: `mobile/matches` POST가 `isActive` 확인 후 update라 두 번 눌러도 멱등. 문제 없음.
- **결제 시 방문시간 유실**: `assignChiefManagerToStudent`는 `visitPreferredTimes`를 보존한다 (`student-enrollment.ts:152`). 문제 없음.
- **미승인 선생님 매칭**: `manager/matches`가 `approved: true` 필터로 차단. 문제 없음.
- **토큰 지갑 미생성**: `getTokenWallet()`이 upsert로 lazy 생성 + 구독 플랜 반영 (`mobile-token-wallet.ts:33-37`). 문제 없음.

---

## Part 3-B — 기존 기능 구조적 개선

### IMP-1. 숙제 자동 분배가 학생이 직접 짠 플랜을 통째로 삭제한다 — append 방식으로 전환

**사용자 행동 패턴**: 학생 대시보드의 핵심 기능이 "내가 태스크를 추가·완료·DnD 정렬"이다. 학생이 일주일치 자기 계획을 짜 놓았는데, 선생님이 숙제 분배를 실행하면 —

**현재 구조**: `homework-distribution/route.ts:155-163`이 기존 플랜에 `tasks: { deleteMany: {}, create: […] }` — 해당 날짜의 **모든 태스크(학생 본인 것 + 완료 기록 `isDone`/`doneAt` 포함)를 삭제**하고 숙제로 교체한다. 학생 입장에서는 내 계획과 완료 이력이 소리 없이 증발한다. 신뢰를 깨는 동작이고, 주간 완료율 모니터링(`manager-stats.ts`) 수치도 왜곡된다.

**지시**:
1. `deleteMany: {}` 제거 → 기존 태스크 뒤에 append: `create: dayTasks.map((title, i) => ({ title, order: maxExistingOrder + 1 + i }))`. 기존 플랜의 `order` 최댓값은 트랜잭션 전 조회에 `tasks: { select: { order: true } }` 추가로 확보.
2. 재분배(같은 주 다시 실행) 시 중복 방지: `StudyTask`에 `origin: "TEACHER" | "STUDENT"` 컬럼 추가(기본 `"STUDENT"`, 계획 문서 §2.3과 같은 마이그레이션에 포함), 분배 태스크는 `origin: "TEACHER"`로 생성하고 재분배 시 `deleteMany: { origin: "TEACHER", isDone: false }`만 삭제 — **완료한 숙제와 학생 태스크는 보존**.
3. 학생 대시보드 `TaskList`에서 `origin: "TEACHER"` 태스크에 "선생님" 뱃지 표시.

### IMP-2. 알림이 "1회성 인앱 벨"에 갇혀 있다 — 단계 전환마다 상태 기반 CTA로 전환

**사용자 행동 패턴**: 학생·학부모는 앱을 매일 열지 않는다. 수락 요청·첫수업 확정 같은 **행동이 필요한 이벤트**가 알림 벨 1회로 끝나면, 놓친 사용자는 EC-6처럼 플로우가 멈춘다. 반면 홈 화면은 매 접속 시 보게 된다.

**현재 구조**: 행동 요구 이벤트(수락 대기, 첫수업 미확정)가 `Notification` 레코드로만 존재. 앱 홈(`/api/mobile/home`)과 웹 대시보드는 journey stage 카피만 보여줄 뿐 **"지금 할 일" CTA가 없다**.

**지시**:
1. `GET /api/mobile/home`·`GET /api/mobile/me/journey` 응답에 `actionRequired` 필드 추가: 서버가 `{ type: "ACCEPT_MATCH" | "CONFIRM_FIRST_LESSON" | null, matchId?, lessonId? }`를 계산해 내려줌 (pending 매칭 존재 → ACCEPT_MATCH 등).
2. 앱 홈 상단에 `actionRequired` 배너 컴포넌트 (탭 시 `consult/match` 등으로 딥링크). 웹 `/dashboard/consultation`에도 동일 배너.
3. 이 구조로 EC-6의 Cron 리마인더는 "놓친 푸시 재발송"이 아니라 보조 수단이 된다 — 상태가 화면에 항상 떠 있으므로.

### IMP-3. 매니저 매칭 화면이 "생성"만 있고 "추적"이 없다 — 매칭 파이프라인 뷰

**사용자 행동 패턴**: 매니저의 실제 업무는 배정 후 "학생이 수락했나? 첫 수업은 잡혔나?"를 챙기는 것인데, 현재 매니저 포털 매칭 화면(`ManagerMatchingPage`)은 매칭 생성 폼 + 목록뿐이다. pending/수락/첫수업 여부를 보려면 학생마다 개별 확인해야 하고, EC-1의 방치 매칭은 눈에 띄지도 않는다.

**지시**:
1. `getManagerMatchingData()`(`src/lib/manager-portal-data.ts`)에 매칭별 파생 상태 추가: `PENDING_ACCEPT`(isActive=false) / `FIRST_LESSON_PENDING`(active, Lesson 0건) / `ACTIVE`(Lesson 1건+) + `createdAt` 기준 경과 시간.
2. `ManagerMatchingPage`를 3열 파이프라인(수락 대기 / 첫수업 대기 / 수업 중)으로 재구성, 24h+ 경과 항목에 경고 뱃지, 수락 대기 카드에 EC-1의 취소 버튼 배치.
3. 같은 데이터를 Admin `/admin/matches`에도 재사용.

### IMP-4. 미답변 감시가 웹 `Question`만 본다 — 앱 QnA(QuestionMessage)는 방치된다

**사용자 행동 패턴**: 앱 학생의 질문 동선은 QnA 채팅(`QuestionMessage`)이다. 선생님이 24h 안 보면 웹 질문은 Cron이 선생님·매니저를 찌르지만(`run-alert-checks.ts` 1번 체크), **앱 채팅 질문은 아무도 모른 채 썩는다**. 유료 사용자의 핵심 가치("선생님이 확인해 준다")가 앱에서만 깨진다.

**지시**: `run-alert-checks.ts`에 `checkUnansweredQnaMessages()` 추가 — 학생별·튜터별 마지막 메시지가 `sender: "me"`이고 24h 경과한 스레드 조회(`QuestionMessage` groupBy studentId+teacherId, 마지막 메시지 판정) → 해당 선생님 + 담당 매니저에게 `QUESTION_UNANSWERED` 알림 (기존 타입 재사용, relatedId에 studentId). 24h 중복 방지 로직은 기존 체크 1과 동일 패턴.

### IMP-5. 결제 → 배정까지가 클라이언트 fetch 1회에 매달려 있다 — 서버 주도 완결로 전환

**사용자 행동 패턴**: 결제 직후 사용자는 모바일 사파리에서 탭을 닫거나, success 페이지 로딩 중 이탈한다. 지금은 success 페이지의 `POST /api/payments/complete` fetch가 실패하면 **돈만 나가고 아무 일도 일어나지 않는다** (웹훅 없음, EC-5와 결합 시 복구도 불가).

**지시** (계획 문서 P0 E1–E3에 통합 실행):
1. E1 서버 confirm 구현 시 **Toss 웹훅 수신 라우트를 함께 추가**: `POST /api/payments/webhook` — 토스 `PAYMENT_STATUS_CHANGED`(DONE) 수신 → `orderId`로 `completeStudentPayment()` 호출 (멱등이므로 success 페이지와 중복 호출 안전). 서명 검증은 웹훅 시크릿 헤더.
2. `orderId`에 studentId를 인코딩 (`concord-{studentId}-{ts}` 형식, checkout에서 생성) — 웹훅은 세션이 없으므로 orderId만으로 학생 특정이 가능해야 한다. `payments/complete`는 세션 studentId와 orderId 내 studentId 일치 검증 추가.
3. 이로써 success 페이지 fetch는 UX용 즉시 피드백, 웹훅은 신뢰 경로가 된다.

### IMP-6. 상담 "방문 희망 시간"이 다음 7일 고정이라 배정 지연 시 전부 무효가 된다

**사용자 행동 패턴**: 학생은 신청 직후 방문 시간을 입력한다(`visit-consultation.ts` — 다음 7일 슬롯). 매니저 배정이 며칠 늦어지면(현재 WAITING 알림은 Cron 특성상 최대 24h 지연, 실제 배정은 더 늦을 수 있음) 매니저가 볼 때는 **이미 지난 날짜의 희망 시간**을 보고 전화하게 된다.

**지시**:
1. `GET /api/manager/consultations/*` DTO에서 `visitPreferredTimes` 파싱 시 과거 날짜 슬롯을 `expired: true`로 구분해 내려주고, 매니저 UI에서 취소선 + "재요청" 버튼 표시.
2. "재요청" → 학생에게 `VISIT_TIMES_REFRESH_REQUESTED` 알림 + 앱/웹 상담 화면에서 재입력 유도 (IMP-2의 `actionRequired: "UPDATE_VISIT_TIMES"` 재사용).
3. 매니저 배정 시점(`consultations/[id]/assign`)에 희망 시간이 전부 과거면 자동으로 위 재요청 발동.

---

## Part 3 우선순위 매핑 (계획 문서 P0–P3에 편입)

| 등급 | 항목 |
|------|------|
| **P0 (돈·데드락)** | EC-5 (FAILED 재시도 버그 — 수정 몇 줄), IMP-5 (웹훅, E1–E3와 함께), EC-1·EC-3 (수락 플로우 완성 — 거절·매니저 취소·웹 수락) |
| **P1** | EC-2 (다과목), EC-4 (알림·포털 정합), EC-6 (SLA 크론), EC-8 (매니저 강탈), IMP-1 (숙제 append — 마이그레이션에 `StudyTask.origin` 포함), IMP-2 (actionRequired), IMP-3 (파이프라인 뷰) |
| **P2** | EC-7 (수업 라이프사이클), EC-9 (Chief 오설정 경고), EC-10 (재상담), IMP-4 (QnA 크론), IMP-6 (방문시간 만료) |

**세션 단위 실행 제안**: ① EC-5 단독(작고 위험 낮음) → ② 계획 문서 §2 마이그레이션에 `StudyTask.origin` 추가해 1회로 통합 → ③ EC-1+EC-3+EC-4 (매칭 라이프사이클 일괄) → ④ EC-6+EC-7 크론 확장 → ⑤ IMP-1 → ⑥ IMP-2+IMP-3.
