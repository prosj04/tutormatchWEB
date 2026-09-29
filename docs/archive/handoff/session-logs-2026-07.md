# 핸드오프 세션 로그 — 2026-07 (원문 보존)

> 2026-09-30 문서 정리로 루트 `HANDOFF.md` 에서 이곳으로 옮긴 과거 기록이다. **원문 보존 — 수정하지 않는다.**
> 현행 핸드오프는 루트 [`/HANDOFF.md`](../../../HANDOFF.md), 현행 상태는 [`docs/00-현재상태.md`](../../00-현재상태.md).
> 더 이전(2026-06~07-03)의 세션 로그·이연 스펙 원본은 루트 `CLAUDE_HANDOFF.md` §25~§26 에 있다.
> 여기 적힌 상태·수치·정책은 **기록 시점의 것**이다. 현행 규칙과 어긋나면 현행 규칙이 우선한다.

---

## 부록 A — 2026-07-13 세션 마감 요약 (당시 `HANDOFF.md` 머리말)


**완료 (로컬 16커밋, 전부 tsc·lint·prod build 검증 — push 대기)**
1. **UX 전수조사 2차**: opus 8팀, 108건 발견 → P0/H 전건+M 대부분 당일 수정. 상세는 `docs/30-제품·디자인.md` Part G. 방법론 재사용: "전수조사" → `ux-sweep` 스킬.
2. **수업 확인 제도 신설** (오너 스펙, 메모리 `project_lesson_confirm`): 자동완료 폐지 → 선생님 확인(완료/사유, 비과실=마지막 수업 이월) → 3자 공지. 마이그레이션 `20260713090000_lesson_confirm` **배포 시 자동 적용됨**.
3. 알림 4역할 개방+학부모 팬아웃(결제+핵심만), 미수락 매칭 3일 자동 확정, 만료 구독 D+3 마감, 인증 복구 경로+모바일 rate-limit(보안), 어드민 confirm 가드+치프 서류 열람, 모바일 정산·업로드 UI(expo-picker 설치됨), 감사로그 실명화+반려 SMS, API_REFERENCE 173 라우트.

**다음 세션 할 일 (순서대로)**
1. 🔴 **오너 PAT `workflow` scope 갱신 확인 → `git push origin main`** — 16커밋 배포+마이그레이션+hourly 크론이 전부 이것에 걸려 있음. push 성공 시 GitHub Secrets `CRON_SECRET` 등록도 확인.
2. 배포 후 **프로덕션 스모크**: 수업 확인 제도(확인 알림→완료/이월), 학부모 알림 팬아웃, PARENT 자녀 선택 결제, 모바일 업로드. 테스트 데이터는 pilot- 접두사 후 정리 (07-12 스모크 절차 참조).
3. 잔여 소소: 매니저 내부 화면 용어 통일(선택), D+7 무응답 자동완료 폴백 값 오너 재확인, 앱스토어 제출(개발자 계정 등록되면 `docs/STORE_SUBMISSION_2026-07.md`부터).

**주의**: 동시 세션이 같은 트리에서 작업하는 패턴 지속 — §0.2 준수(명시적 경로 add). 요금·수락·PAUSED 정책은 메모리·§0.1 참조.

---


---

## 부록 B — 당시 `HANDOFF.md` §5.1 문서 지도 스냅샷

> 현행 지도는 [`docs/README.md`](../../README.md) 가 정본이다. 아래는 2026-07-12~14 시점의 계층 스냅샷으로, 경로가 바뀐 항목이 있다(`design handoff/` → `docs/archive/design-handoff-v2/`, `IMPLEMENTATION_*` → `docs/archive/implementation-2026-07/`).


> **07-12 재편**: 시간순 누적 문서 15종을 주제별 단권 6종으로 병합(전문 무손실), 원본은 `docs/archive/` 보존. 구 파일명 ↔ 새 위치 매핑은 `docs/README.md` 아카이브 절 참조.

| 계층 | 문서 | 위치 |
|---|---|---|
| 마스터 진입점 (AI) | 이 파일 (`HANDOFF.md`) | 루트 |
| **현재 상태 요약 (사람)** | `docs/00-현재상태.md` | `docs/` |
| 사업전략 (BM v4.1+v3 통합) | `docs/10-사업전략.md` | `docs/` |
| 사업 리뷰·취약점 통합 | `docs/11-사업리뷰·취약점.md` | `docs/` |
| 마케팅 통합 (계획 v3+카피+설탭 2종) | `docs/20-마케팅.md` | `docs/` |
| 제품·디자인 통합 (트래커+방향+CRO+UX 감사+홈 개선) | `docs/30-제품·디자인.md` | `docs/` |
| 파일럿 1차 기록 (2차는 활성 문서) | `docs/40-파일럿.md` | `docs/` |
| 파일럿 2차 (활성 — pilot-verify 스킬 참조, 이동 금지) | `docs/PILOT_SIM2_2026-07.md` | `docs/` |
| 세션 로그·이연 스펙 원본 | `CLAUDE_HANDOFF.md` (§25~§26) | 루트 |
| 하네스 원본 | `CLAUDE.md`, `AGENTS.md` | 루트 |
| 문서 지도 | `docs/README.md` | `docs/` |
| 기술 개요 | `docs/internal/TECH_OVERVIEW.md` | `docs/internal/` |
| API 레퍼런스 | `docs/internal/API_REFERENCE.md` (07-04 기준 110 — 07-12 실측 166, 재실측 필요) | `docs/internal/` |
| 법률 현황 | `docs/internal/LEGAL_DOCS_STATUS.md` | `docs/internal/` |
| 계약 초안 | `docs/internal/contracts/*.md` | `docs/internal/contracts/` |
| 법률 자문 메모 | `docs/internal/LEGAL_ADVISORY_MEMO.md` (AI 임시) | `docs/internal/` |
| 사업계획서 (PSST) | `docs/external/BUSINESS_PLAN_PSST.md` | `docs/external/` |
| 재무계획 | `docs/external/FINANCIAL_PLAN.md` | `docs/external/` |
| 구현 계획 (활성) | `docs/IMPLEMENTATION_PLAN_2026-07.md` | `docs/` |
| 세션별 구현 기록 (활성) | `docs/IMPLEMENTATION_SESSIONS_REVISED.md` | `docs/` |
| 매니저 운영 가이드 | `docs/MANAGER_GUIDELINES.md` | `docs/` |
| 리팩토링 제안 R-1~16 | `docs/REFACTORING_PLAN.md` | `docs/` |
| 사진 프롬프트 | `docs/PHOTO_GENERATION_PROMPT.md` (작업 보류) | `docs/` |
| 디자인 시스템 원본 | `design handoff/DESIGN_SYSTEM.md` (+ HTML 시안, `tokens-reference.css`) | `design handoff/` |
| 아카이브 (병합 원본 15종 + 구버전 사업계획서 4종) | `docs/archive/` | `docs/archive/` |

**루트 정리 (07-12 실행, 07-14 완결)**: `concord_bizplan.*` 3종·`Concord_사업계획서_2026.docx`·`Concord_사업계획서_2026.md`(원본 소스) 전부 `docs/archive/`로 이동됨. PSST 버전(`docs/external/BUSINESS_PLAN_PSST.md`)이 계승. `.hermes/`(07-01·02 계획 잔재)도 `docs/archive/hermes/`로 이동.


---

## 세션 로그 (2026-07-04 ~ 07-14)

> 세션 종료 시 이 절에 **append**한다. 형식은 `CLAUDE_HANDOFF.md §25.1x`를 승계 — 헤더 `### 세션 로그 · YYYY-MM-DD (제목)` + 완료 항목 · 검증 · 미해결.

### 세션 로그 · 2026-07-04 (핸드오프 재정비)

- ✅ **`HANDOFF.md` 신설** (루트) — Part 0(AI 운영 하네스) · Part 1(온보딩) · Part 2(시스템 지도, 원본 참조) · Part 3(스냅샷) · Part 4(백로그) · Part 5(문서 지도 + 세션 로그 자리) 구조로 작성.
- ✅ **`CLAUDE_HANDOFF.md` 최상단 5줄 안내 블록만 추가** — 기존 §0~§26 내용은 일절 수정하지 않았음.
- ✅ **CLAUDE_HANDOFF 대비 갱신된 사실 (구버전 표기 병기)**:
  - API 라우트 수: 58 → **110** (`docs/internal/API_REFERENCE.md` 실측, `src/app/api/**/route.ts` 파일 카운트 일치).
  - 마이그레이션: 9개 → **25개** 실측 리스트로 대체 (`prisma/migrations/` 실측).
  - 요금제: v1(회당/과목) → **v2(시간제 월정액 8종)**. `PRICING_PLANS_V2` 진실의 원천, v1은 `planIdFromAmount` 역매핑에서만 존재.
  - 결제 검증: "orderId만" → **Toss confirm 서버 검증 + 웹훅 재검증**.
  - 매칭 상태: 즉시 active → **`matchStatus: PENDING_STUDENT_ACCEPT` → 학생 수락 시 ACTIVE**, `matchReason` 필드.
  - 상담: 학생 1건 → **이력 다행**(`consultation-current.ts` 헬퍼).
  - QnA: `Question` + `QuestionMessage` 이원화 → **`QuestionMessage` 단일 저장소**. `Question`은 DEPRECATED로 존치.
  - CHIEF_MANAGER: Prisma 주석 누락 → **`UserRole` enum에 정식 반영**.
  - Storage: 브라우저 anon 업로드 → **서버 라우트 경유** (`/api/student/question-images` 등).
  - Cron: hourly GitHub Actions → **daily만** (hourly는 PAT scope 문제로 제거, 라우트는 `x-vercel-cron` 지원).
  - 정산·빌링·계정삭제·감사로그·환불·일시정지·만족도·케어로그·상담 리포트 전부 **구현 완료** — 원본 §18의 "❌ 미구현"·§22의 "부분" 서술은 구버전 표기로 남기고 이 문서에서 재분류.
- ✅ **실측한 사실**: 로컬 `main`이 `origin/main`보다 **29 커밋 앞섬**. 법률 페이지 `[기재 예정]` **8곳** (terms/privacy/refund 각 파일에서 grep). 프로젝트 총 마이그레이션 25개, API 라우트 110개.
- ✅ **검증**: 새 문서 2건(신규 + 5줄 프리앰블). 코드 변경 없음이므로 `tsc/lint` 실행 대상 없음. `git status` 클린 유지.
- ⚠️ 미해결(다음 세션): [Part 4 · 백로그](#part-4) 참조. 특히 P0-1~P0-7이 파일럿 오픈 전 필수.

### 세션 로그 · 2026-07-12 (문서 통합·최신화)

- ✅ **HANDOFF.md 07-12 정정·추록** (내용 삭제 없이 취소선+갱신 주석 방식):
  - §0.1 6단계 규범 정정 — 수락 버튼은 **형식적 절차**, 마케팅·UI 강조 금지 (`CLAUDE.md` 07-08 개정 반영). 구 문구는 취소선 보존.
  - §0.4·Part 1·§3.1·P0-4: "29 커밋 미배포" → **push·배포 완료(대기 0)** 로 정정.
  - Part 1 역할 표 4→**5역할** (PARENT 07-10 신설), §2.2 동반 갱신.
  - §2.5 모델 추가분(ConsultationLead·Testimonial 확장·PARENT enum), §2.6 API **110→166**, §2.11 마이그레이션 **25→31** 실측 갱신.
  - **§3.4 신설** — 07-05~07-12 사이클 143커밋 날짜·영역별 추록 (Sprint 1, 설탭 벤치마크 개편, 실사 사진 교체, CRO, UX 감사 M-1~17, 보안 라운드, PARENT 역할, 디자인 핸드오프 적용+공개 페이지 revert, 통합 4역할 모바일 앱, 구독 일시정지, 파일럿 11R).
  - Part 4: P0-4·P0-7·P2-4 완료 처리(취소선), P1-1 부분 완료 주석, P2-1 범위 확대 주석.
- ✅ **docs/README.md 문서 지도 갱신** — 07-04 이후 신규 문서 8종 인덱싱 (seoltab-teardown, benchmark-seoltab, copy-proposals, design-direction, design-review, ux-audit-handoff, VULNERABILITY_AUDIT, FRONTEND_BUILD_SPEC).
- ✅ **FRONTEND_BUILD_SPEC 중복 단일화** — `design handoff/FRONTEND_BUILD_SPEC.md`를 원본으로 확정, 바이트 동일 사본이던 `docs/FRONTEND_BUILD_SPEC.md`는 포인터 스텁으로 교체.
- ✅ **루트 구버전 사업계획서 아카이브** — `concord_bizplan.docx`(.bak과 바이트 동일)·`.bak`·`.rtf`·`Concord_사업계획서_2026.docx` → `docs/archive/` 이동 (삭제 아님). `Concord_사업계획서_2026.md`는 원본 소스로 루트 유지.
- ✅ **수락 버튼 정책 고지 전파** — 수락을 강조하는 기존 문서들(MARKETING_PLAN, copy-proposals, design-direction, project-goals, external/APP_GUIDE·CEO_PROPOSAL·IR_ONE_PAGER, IMPLEMENTATION_SESSIONS_REVISED) 상단에 07-08 정책 변경 고지 추가. 본문은 수정하지 않음(기록 보존).
- 검증: 문서만 변경 — 코드 변경 없음. 커밋은 오너 요청 대기.
- ⚠️ 미해결: `docs/internal/API_REFERENCE.md` 재실측(110→166 증가분 반영), 6월 16일자 stale worktree 2개(`.claude/worktrees/agent-*`, 미커밋 cms 컴포넌트 잔존) 처분, `photos/` 116MB gitignore 여부 — 오너 결정 필요.

### 세션 로그 · 2026-07-12 (2차 — 주제별 단권화 재편)

- ✅ **docs/ 주제별 단권화** (오너 지시: 시간순·분산 구조로 파악이 어려움 → 주제별 재편, 내용 무손실):
  - 신설 6종: `00-현재상태.md`(신규 요약) · `10-사업전략.md`(BM v4.1+v3 전문 병합) · `11-사업리뷰·취약점.md`(BUSINESS_REVIEW+VULNERABILITY_AUDIT) · `20-마케팅.md`(MARKETING_PLAN+copy-proposals+설탭 2종) · `30-제품·디자인.md`(TRACKER+direction+CRO리뷰+UX감사+홈개선) · `40-파일럿.md`(SIM 1차).
  - 병합 방식: 원본 전문을 Part A/B/C…로 그대로 수록 + 상단에 현행 우선순위·수록표 헤더. 바이트 합산으로 무손실 확인.
  - 원본 15종은 `git mv`로 `docs/archive/` 이동 (히스토리 보존). 아카이브 내 상호 참조는 동일 폴더라 유효.
  - **의도적으로 유지한 파일**: `PILOT_SIM2_2026-07.md`(pilot-verify 스킬이 `docs/PILOT_SIM2_*.md` 글롭 참조 — **이동 금지**), IMPLEMENTATION 2종·MANAGER_GUIDELINES(§0.8 활성), REFACTORING_PLAN, PHOTO 2종, FRONTEND_BUILD_SPEC(스텁), 덱 소스 HTML 3종.
  - 웹 자료실(`DocsLibrary.tsx`)은 `public/docs/*.html`만 참조 — md 이동 영향 없음 확인.
  - `docs/README.md` 전면 재작성(새 지도), 이 파일 §5.1 갱신, 활성 문서 3종(IMPLEMENTATION 2종·REFACTORING_PLAN)에 경로 이동 고지 1줄씩 추가.
- 검증: 문서만 변경, 코드 무변경. 커밋은 오너 요청 대기.
- ⚠️ 규칙: 이후 세션은 전략·리뷰류 신규 문서를 만들지 말고 **해당 주제 단권에 Part 추가/갱신**할 것. 새 시점 스냅샷이 필요하면 단권 안에 날짜 절로 append.

### 세션 로그 · 2026-07-12 (3차 — UX 감사·수정 + 오너 결정 반영 + 프로덕션 정비)

- ✅ **오너 결정 반영**: 요금제 = 오너 심리 최적가 확정(중\|고: 38\|43·55\|58·76\|78·106\|112만, 코드값이 진실) — 할인 구조 제안·금액 변경 금지, P1-4 폐기. 문서 요금 감사에서 "38~108만" 오기 5곳 → 112만으로 정정.
- ✅ **RLS/스토리지 정책 프로덕션 적용** — `prisma/manual/20260705_...sql`을 question-images private 현행에 맞게 정정 후 적용. RLS 37테이블, anon 권한 0, 레거시 anon INSERT/UPDATE 정책 6개 제거(P0-6 종결). CMS 시딩 완료(SiteContent 1→1,184 · FAQ 4 · 후기 30 보존, `scripts/seed-cms.ts`).
- ✅ **프로덕션 스모크** — 가입→상담(자동생성)→치프 배정→매칭→수락→첫수업→숙제분배→이미지 업로드/프록시 접근제어(익명 401)까지 관통. 테스트 데이터(pilot3-smoke) 전량 삭제.
- ✅ **GA4 이중 계측** — `trackEvent`가 gtag 동시 전송, purchase/begin_checkout 표준 이벤트 매핑. `API_REFERENCE.md` 166 라우트 재실측(서브에이전트).
- ✅ **UX 어색 지점 감사** — opus 5팀 병렬, 75건(§30-제품·디자인 Part F). P0: 첫 수업 시각 UTC 저장 버그(두 팀 교차 발견).
- ✅ **UX 수정 구현** — opus 5팀 병렬(파일 소유권 분할): P0 KST 픽스(직접), 앱 학생(알림 딥링크·오늘 할 일·QnA 갱신), 학부모(학생 앱 연결 코드 발급 UI 신설·결제 컨텍스트), 결제(PARENT 체크아웃 분기+`/api/parent/payments/complete` 신설·success 재시도·PAUSED 무마찰 투영 — **정지 신청 가능성 노출 금지가 오너 정책**), 가입·상담(자동 접수 배너·리드→가입 이관), 공급자(matchReason "학생 공개" 명시·분배 미리보기·케어로그 기본 비공개·강사 정산 탭 신설). 전체 tsc·lint 클린.
- ✅ **외부 PDF 5종 재생성** — 수락 강조 제거(매니저 직접 배정 중심) + 요금 정정, `public/docs/` 동기화.
- ⚠️ 코드 변경분은 동시 세션의 `06cbcd7`(feat/reports)에 함께 커밋·push됨 — 커밋 귀속 혼재, 내용은 검증 완료.
- ⚠️ 미해결: 환불정책 v1 요금 예시 v2 갱신(공제 기준 오너 결정 필요), 웹/앱 QnA 모델 통일·학생 웹 리포트 라우트(설계 결정), L급 폴리시 잔여(Part F 참조).

### 세션 로그 · 2026-07-13 (UX 전수조사 2차 + 대규모 수정 + 수업 확인 제도)

- ✅ **UX 전수조사 2차** — opus 8팀(5도메인 회귀+확장, 신규: 어드민·알림시스템·크로스커팅), 신규 108건. `docs/30-제품·디자인.md` Part G. 방법론은 `.claude/skills/ux-sweep` 스킬로 저장(트리거: "전수조사").
- ✅ **회귀 검증**: 07-12 수정 43건 중 42건 정상. 실회귀 1건(케어로그 기본 공개 리셋) 즉시 수정.
- ✅ **오너 결정 3건 반영**: ① 미수락 매칭 3일 자동 확정 ② 학부모 알림 = 결제+핵심만 팬아웃 ③ **수업 확인 제도**(자동완료 폐지 — 오너 직접 설계 스펙, 메모리 `project_lesson_confirm` 참조): 종료 시각→강사 확인 알림→완료/사유(학생 과실=정산 포함, 비과실="마지막 수업으로 변경" 이월)→3자 공지, D+7 무응답 자동완료(잠정). 마이그레이션 `20260713090000_lesson_confirm`(nullable 3컬럼).
- ✅ **수정 8커밋** (`ad60145`~`11ef9ea`): 4역할 앱 알림 개방+학부모 팬아웃+딥링크, 학부모 미납 인지·앱 비대칭 해소·탈퇴, 수업 확인 제도, 인증 잠금 안내·모바일 rate-limit(보안), 어드민 confirm 가드·치프 서류 열람·CMS 검색, QnA 배지 회귀, 크로스커팅(다크 토큰·테이블 overflow·a11y·용어), 모바일 정산 화면·보강 실날짜·nextStep.
- ✅ expo-image-picker·document-picker 설치, 강사 모바일 업로드 UI 연결(진행).
- ⚠️ **push 차단 중**: 로컬 히스토리의 hourly 워크플로 커밋(3f89879) 때문에 PAT workflow scope 없이는 전체 push 거부. 동시 세션 활동으로 rebase는 회피. **오너 PAT 갱신이 배포+hourly cron+향후 push 모두의 유일 해소책.**
- ✅ (같은 날 후속 완주) E-UPLOAD 업로드 UI 연결(`00671f1`), 만료 구독 D+3 자동 마감(`9d15fea`), 감사로그 이름 표시+반려 사유·SMS(`e532a53`), API_REFERENCE 173 라우트(`49ff10b`), 로컬 프로덕션 빌드 통과 확인. 잔여: 매니저 내부 화면 용어 통일(선택), 배포 후 프로덕션 스모크.

### 세션 로그 · 2026-07-13 (오너 결정 12건 확정 + 즉시 반영 + biz-rounds 스킬)

- **오너 결정 1~12 확정** (MASTER §5 확정 블록·메모리 `project_decisions_2026-07-13`): D+7=이월(기구현 확인, 수정 0) · 서사 B(대면·밀도·큐레이션) · 스토어 연기 · AI 질답 키 활성 방침 · PARENT 결제 기본화 · 강사 집중 배치 · 총량 수치 실측 교체(적용 시점 별도) · 차등시급 수동 프리셋 · 검증 요소 강조. 강사 계약·크레딧 상한 보류.
- **코드**: `Teacher.hourlyRateKrw`(프리셋 32/34/40k, 정산 3경로+어드민 UI) · `PaymentCompletion.paidByUserId` 결제자 귀속(학생/학부모 라우트, 웹훅 무수정) · ai-answer 모델 claude-sonnet-4-6. 마이그레이션 SQL 2건 준비만(`20260713150000_teacher_hourly_rate`, `20260713160500_payment_paid_by_user`) — **프로덕션 선적용 후 배포**(추가 전용, 선적용 무해).
- **검증**: tsc·lint·prisma validate 클린, 회귀 테스트 2종 PASS(신규 학생 단독 결제 6 + 정산·환불 8).
- **문서**: MANAGER_GUIDELINES §6(검증 요소 능동 안내+서사 B) 신설. `.claude/skills/biz-rounds` 스킬 신설(R0~R6 라운드 루프 방법론+개선 10종).
- **오너 대기**: ANTHROPIC_API_KEY 발급·env 등록, 마이그레이션 적용 지시, 결정 13~16. 잔여 AI 작업: IR·외부 문서 서사 B 스윕, 로그인 후 화면 검증 카피 실물 적용, 학부모 빌링키 등록 신설 여부(오너 결정 사안으로 이월).

### 세션 로그 · 2026-07-14 (확장 라운드 통합 마스터)

- ✅ **확장 라운드 통합** — 발굴 63건(ES·EI) → R2 판정 → 반박 재정 4건(ES-23·ES-11 수용, EI-18 유지, EI-2 증거 분해) → 최종 생존 4·조건부 47·기각 2·재탕 10, 실행체 39. 산출: `docs/BUSINESS_EXPANSION_MASTER_2026-07.md`(8절). 유일한 즉시 오너 결정 = EI-27 파일럿 단핵 집중.

---

