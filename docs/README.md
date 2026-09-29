# 문서 지도

> 갱신 2026-09-30. **처음 온 사람(사람·AI)이 이 문서 하나로 어디를 읽을지 안다**가 이 지도의 목적이다.
> 이동한 문서의 전·후 경로는 [`archive/README.md`](archive/README.md), 결정 번복 이력은 [`adr/`](adr/README.md).

**Concord** — 전담 매니저가 학생에게 맞는 선생님을 배정하고, 수업 이후의 학습까지 관리하는 **프리미엄 1:1 방문 과외 큐레이션·학습관리 서비스**. 서울·동탄, 중·고등학생 대상. 학부모의 탐색·검증·선택 부담을 맡는 것이 상품이며, 앱·웹은 이 서비스를 운영하는 도구다.

## 읽는 순서

| 순서 | 사람 | AI 세션 |
|---|---|---|
| 1 | [`00-현재상태.md`](00-현재상태.md) — 지금 상태 한눈에 | [`/CLAUDE.md`](../CLAUDE.md) + [`BUSINESS_DIRECTION.md`](BUSINESS_DIRECTION.md) — 실행 규칙 |
| 2 | [`BUSINESS_DIRECTION.md`](BUSINESS_DIRECTION.md) — 사업 정의·원칙 | [`/HANDOFF.md`](../HANDOFF.md) Part 0 — 운영 하네스(멀티 세션·DB·배포·검증·커밋) |
| 3 | [`결정대기.md`](결정대기.md) — 내가 정할 것 / [`개선책.md`](개선책.md) — 할 일 | [`00-현재상태.md`](00-현재상태.md) → 작업 주제의 단권 |
| 4 | 주제별 단권 10~40 | [`adr/`](adr/README.md) — 번복된 결정 확인 |

## 1. 규칙 (정본 — 충돌 시 이 셋이 우선)

| 문서 | 무엇의 정본인가 |
|---|---|
| [`/CLAUDE.md`](../CLAUDE.md) | 구현 엔지니어 지침 + 오너 원칙 요약 |
| [`BUSINESS_DIRECTION.md`](BUSINESS_DIRECTION.md) | 사업 정의·요금 철학·카피 헌법·미학·디자인 §7·반복 교정 패턴 §11–14 |
| `.claude/rules/build-and-commit.md` | 빌드 검증·커밋·푸시 리듬 (경로 조건부 로드) |
| [`/AGENTS.md`](../AGENTS.md) | 위 셋으로 가는 3줄 관문 |
| [`adr/`](adr/README.md) | 결정 번복 이력. 기존 ADR 은 고치지 않고 새 번호로 대체 — [0001](adr/0001-commit-push-rhythm.md) 커밋·푸시 리듬 · [0002](adr/0002-editorial-redesign.md) 디자인 v3 |

같은 규칙이 다른 문서에 복제돼 있으면 그쪽이 사본이다. 사본을 고치지 말고 정본을 고친다.

## 2. 현행 상태·실행

| 문서 | 성격 | 상태 |
|---|---|---|
| [`00-현재상태.md`](00-현재상태.md) | 제품·사업 현황 한눈에 — 상태·수치·블로커·다음 할 일 | 현행 (2026-09-30) |
| [`/HANDOFF.md`](../HANDOFF.md) | AI 마스터 핸드오프 — 운영 하네스 · 시스템 지도 · 상태 스냅샷 · 백로그 | 현행 |
| [`결정대기.md`](결정대기.md) | 오너가 지금 정해야 할 것만 (+ 확정 부록으로 재론 방지) | 현행 |
| [`개선책.md`](개선책.md) | 발굴 312건에서 살아남은 실행 항목, 유형별 | 현행 |
| [`OWNER_EXECUTION_QUEUE.md`](OWNER_EXECUTION_QUEUE.md) | 오너 직접 집행 항목의 **상세 정본** (무엇/왜/비용/방법) | 현행 |
| [`REFACTORING_PLAN.md`](REFACTORING_PLAN.md) | 기술 부채 R-1~16 | 추적 중 |
| [`STORE_SUBMISSION_2026-07.md`](STORE_SUBMISSION_2026-07.md) | 앱 스토어 제출 체크리스트·등록 텍스트 | 오너 선행 대기 |
| [`MANAGER_GUIDELINES.md`](MANAGER_GUIDELINES.md) | 매니저 운영 가이드 (일시정지·검증 안내 등) | 운영 |
| [`PILOT_SIM2_2026-07.md`](PILOT_SIM2_2026-07.md) | 파일럿 2차 — 12라운드, 계속 append | **활성** |

## 3. 주제별 단권 (깊이 들어갈 때)

시간순으로 누적된 문서 15종을 2026-07-12 에 주제별로 합친 것이다. 원본은 전문 무손실 수록 후 [`archive/`](archive/README.md) 에 있다.

| 문서 | 내용 |
|---|---|
| [`10-사업전략.md`](10-사업전략.md) | BM 설계 — Part A v4.1(NX·EXP) / Part B v3 전문 |
| [`11-사업리뷰·취약점.md`](11-사업리뷰·취약점.md) | Part A 사업·마케팅·리스크 리뷰 / Part B 취약점 50·개선점 50 |
| [`20-마케팅.md`](20-마케팅.md) | Part A 실행 계획 v3 / B 카피 제안 / C·D 설탭 분석 |
| [`30-제품·디자인.md`](30-제품·디자인.md) | Part A~E 트래커·방향·CRO·UX 감사·홈 개선 / F·G UX 전수조사 75건·108건 |
| [`40-파일럿.md`](40-파일럿.md) | 파일럿 1차 (종결). 2차는 `PILOT_SIM2_2026-07.md` |
| [`COPY_ALTERNATIVES.md`](COPY_ALTERNATIVES.md) | 핵심 10곳 × 각 10안 카피 후보 |
| [`PHOTO_SHOOT_LIST.md`](PHOTO_SHOOT_LIST.md) · [`PHOTO_GENERATION_PROMPT.md`](PHOTO_GENERATION_PROMPT.md) | 촬영 리스트 / 생성 프롬프트(인물 생성 금지 — 보류) |

**단권과 마스터의 관계**: 단권은 *원문 보존소*, 마스터는 *판정 결과*다. 생사·수치가 어긋나면 마스터가 우선한다.

| 마스터 | 내용 |
|---|---|
| [`BUSINESS_IMPROVEMENT_MASTER_2026-07.md`](BUSINESS_IMPROVEMENT_MASTER_2026-07.md) | 개선 라운드 통합 — 발굴 249건, R1~R6 재심 반영 |
| [`BUSINESS_EXPANSION_MASTER_2026-07.md`](BUSINESS_EXPANSION_MASTER_2026-07.md) | 확장 라운드 통합 — 63건 재정, 실행체 39·Top 10 |
| `strategy-rounds/improvement/` · `strategy-rounds/expansion/` | 라운드 원본 (감사 추적용. `biz-rounds` 스킬 출력 경로) |

## 4. 디자인 — [`design/`](design/README.md)

**2026-09-30 v3 "Editorial" 로 전면 개편 — 구현 완료** (브랜치 `feat/editorial-redesign`, main 미병합 · 오너 확인 대기).

| 문서 | 성격 |
|---|---|
| [`design/DESIGN_SYSTEM_V3.md`](design/DESIGN_SYSTEM_V3.md) | 사양 정본 (구현 정본은 `src/app/ds.css`) |
| [`adr/0002-editorial-redesign.md`](adr/0002-editorial-redesign.md) | 결정 배경 · 대체된 §7 조항 대조표 · 롤백 방법 |
| [`design/README.md`](design/README.md) | 디자인 문서 지도 + v2 이력 포인터 |
| [`design/REDESIGN_2026-09-30.md`](design/REDESIGN_2026-09-30.md) | UI 전면 개편 기록 — 범위·검증·미확인·오너 결정 + 페이지별 인벤토리 |
| [`archive/design-handoff-v2/`](archive/design-handoff-v2/) | 대체된 v2 핸드오프 패키지 전량 (롤백 자산) |
| `app-screenshots/` | 역할별 화면 캡처 — 2026-09-30 개편 후 **74/98장 재촬영**. 개편 전 그대로인 24장 목록은 [design/README.md](design/README.md#스크린샷) |

## 5. 기술·법무 — [`internal/`](internal/)

| 문서 | 상태 |
|---|---|
| [`internal/TECH_OVERVIEW.md`](internal/TECH_OVERVIEW.md) | 스택·인증·DB·결제·배포 (07-04 실측. 수치는 `/HANDOFF.md` §2 가 최신) |
| [`internal/API_REFERENCE.md`](internal/API_REFERENCE.md) | API 전수 레퍼런스 — **2026-09-30 재작성** (162 라우트 · 페이지↔API 매트릭스 · 웹/모바일 쌍 · 위험 목록) |
| [`internal/LEGAL_DOCS_STATUS.md`](internal/LEGAL_DOCS_STATUS.md) | 필요 법률 문서 7종(L-1~7) 체크리스트. 미작성: L-3 개인정보 내부관리계획, L-4 신원확인 동의서 |
| [`internal/contracts/TUITION_CONTRACT_DRAFT.md`](internal/contracts/TUITION_CONTRACT_DRAFT.md) · [`TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md`](internal/contracts/TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md) | ⚠️ 초안 — 변호사·노무 검토 필수 |
| [`internal/LEGAL_ADVISORY_MEMO.md`](internal/LEGAL_ADVISORY_MEMO.md) | ⚠️ AI 임시 — 정식 자문으로 대체 필요 |

법률 문서는 플레이스홀더 + 추후 실제 자문이 원칙이다(BUSINESS_DIRECTION §8) — AI 가 법률 조항을 창작하지 않는다.

## 6. 대외 제출 — [`external/`](external/)

| 문서 | 상태 |
|---|---|
| [`external/BUSINESS_PLAN_PSST.md`](external/BUSINESS_PLAN_PSST.md) | 창업지원사업 제출용. 초안 — `[기재 필요]` 채우면 제출 가능 |
| [`external/FINANCIAL_PLAN.md`](external/FINANCIAL_PLAN.md) | 3개년 재무계획, 3시나리오. 파일럿 실측치로 갱신 예정 |
| [`external/IR_ONE_PAGER.md`](external/IR_ONE_PAGER.md) · [`external/CEO_PROPOSAL.md`](external/CEO_PROPOSAL.md) · [`external/APP_GUIDE.md`](external/APP_GUIDE.md) | 완료 — 대표자 정보 `[기재 필요]` |

미작성 권고(우선순위순): ① 대표자 프로필·이력 상세 ② 데모 시나리오 ③ 정부 양식별 변환본(공고 확정 후) ④ 트랙션 리포트 템플릿(파일럿 후) ⑤ 투자용 데이터룸 체크리스트(Pre-A 전).

## 7. 생성 파이프라인 (문서가 아니라 빌드)

`docs/chapters/*.md` → `docs/build-html.mjs` → 브랜드 HTML 8권 + 자산 목록.
`docs/sync-dashboard.sh` 가 이 빌드를 개인 대시보드(`~/Documents/dashboards/concord-docs`)로 밀어넣는다(post-commit 훅).

| 경로 | 성격 |
|---|---|
| `chapters/` (방향현황·전략·마케팅·제품·운영·법무기술·대외IR) | **빌드 소스.** 원문 DB 를 걷어낸 결론본 — 본문이 참조하는 원문은 위 3~6절 |
| `결정대기.md` · `개선책.md` | 빌드 소스 겸 현행 실행 문서 (①②권) |
| `app-guide.html` · `ceo-proposal.html` · `proposal-ledger.html` | 덱 PDF 소스 (headless Chrome `--print-to-pdf`) |
| `branding/` | 생성 PDF·이미지. 대용량 바이너리 |
| `external/dist/` | 제출 자산 PDF·xlsx |
| `_html/` | build-html 산출물 — `.gitignore` 처리(2026-09-30). `node docs/build-html.mjs` 로 재생성 |
| `public/docs/` (레포 루트) | 웹 자료실 배포본. `src/components/docs/DocsLibrary.tsx` 가 참조 |

PDF·HTML 은 생성물이다 — 원본(md·소스 html)만 고치고 재생성한다. 원본 커밋만으로 배포본이 갱신되지는 않는다.

## 8. 과거 기록 — [`archive/`](archive/README.md)

원문 보존, 수정 금지. 하위 분류: `design-handoff-v2/`(v2 디자인) · `handoff/`(핸드오프·세션 로그) · `audits-2026-07/`(보안·정리·내용 감사) · `implementation-2026-07/`(구현 계획) · 단권화 원본 15종 · 구버전 사업계획서 · `hermes/`. 전·후 경로표는 [`archive/README.md`](archive/README.md).

루트에 남는 과거 기록: [`/CLAUDE_HANDOFF.md`](../CLAUDE_HANDOFF.md)(세션 로그 §25·이연 스펙 §26 원본), [`session-instructions.md`](session-instructions.md)(오너 지시 원문 467건 — BUSINESS_DIRECTION 의 출처). 둘 다 분량이 커서 자동 로드되지 않는다 — 특정 구현의 배경을 찾을 때만 grep 한다.

## 9. 이동 금지 경로 (도구가 경로로 직접 참조)

문서를 옮기기 전에 이 표를 본다. 여기 있는 경로를 옮기면 스킬·에이전트·빌드가 조용히 깨진다.

| 경로 | 참조처 |
|---|---|
| `docs/README.md` · `docs/00-현재상태.md` · `docs/30-제품·디자인.md` | `biz-rounds` · `ux-sweep` 스킬 |
| `docs/PILOT_SIM2_*.md` | `pilot-verify` 스킬 (글롭) |
| `docs/strategy-rounds/` | `biz-rounds` 스킬 출력 경로 |
| `docs/BUSINESS_IMPROVEMENT_MASTER_2026-07.md` | `biz-rounds` 스킬 |
| `docs/10~40` 단권 · `docs/external/*.md` · `docs/internal/*.md` · `docs/MANAGER_GUIDELINES.md` · `docs/BUSINESS_DIRECTION.md` · `docs/archive/*.docx` | `.claude/agents/biz-*` |
| `docs/app-screenshots/**` | `concord-deck` 스킬 + `TEMPLATE.html` 상대경로 |
| `docs/design/DESIGN_SYSTEM_V3.md` | `src/app/ds.css` · `src/app/(home)/landing.css` |
| `docs/chapters/**` · `docs/결정대기.md` · `docs/개선책.md` · `docs/external/dist/` · `docs/branding/` | `docs/build-html.mjs` |
| `/HANDOFF.md` · `/CLAUDE_HANDOFF.md` · `/README.md` · `/CLAUDE.md` · `/OWNER_ORDERS.md` | `.claude/agents/**` · `tools/team-office/server.js` |

`tools/team-office/server.js` 의 문서 브라우저는 **비재귀**이므로 `docs/` 루트에서 하위 폴더로 내려간 md 는 워룸 "사업 문서" 목록에서 빠진다(기능 손상 아님).

## 10. 문서를 고칠 때

1. 규칙을 바꾸는가 → `CLAUDE.md` / `BUSINESS_DIRECTION.md` / `.claude/rules/` 중 정본 한 곳만.
2. 앞선 결정을 뒤집는가 → `adr/` 에 **새 번호**. 기존 ADR 은 고치지 않는다.
3. 상태가 바뀌었는가 → `00-현재상태.md` 먼저, 상세는 `/HANDOFF.md`.
4. 과거 문서가 낡았는가 → 고치거나 지우지 말고 `archive/` 로. `archive/README.md` 표에 전·후 경로 한 줄.
5. 요금·수치는 코드값이 진실이다 — `src/lib/pricing-plans.ts`. 문서를 코드에 맞춘다(2026-08-03 오너 결정).
6. 통합은 재분류다 — 원문을 탭마다 붙여놓는 나열 금지, **내용 삭제·축약 금지** (BUSINESS_DIRECTION §9).
7. 이 지도를 동반 갱신한다 (`/HANDOFF.md` §0.8).

---

## 부록 A — 생성물 대응표 (원천 → PDF)

2026-09-17 정합화 시점 기준. PDF 는 로컬에서 재생성하며 생성물 커밋 금지 원칙에 따라 원본만 버전 관리한다 — 따라서 원본 커밋만으로 원격 PDF 가 갱신된 것은 아니다.

| 원천 HTML | PDF 경로 |
|---|---|
| `branding/ir-one-pager.html` | `branding/Concord-IR-OnePager.pdf` · `external/dist/Concord-IR-OnePager.pdf` · `../public/docs/Concord-IR-OnePager.pdf` |
| `branding/pitch-deck.html` | `branding/Concord-IR-Deck.pdf` · `external/dist/Concord-IR-Deck.pdf` · `../public/docs/Concord-IR-Deck.pdf` |
| `branding/brand-guidelines.html` | `branding/Concord-Brand-Guidelines.pdf` · `../public/docs/Concord-Brand-Guidelines.pdf` |
| `app-guide.html` · `ceo-proposal.html` · `proposal-ledger.html` | `branding/Concord-App-Guide.pdf` · `branding/Concord-CEO-Proposal.pdf` · `branding/Concord-Proposal-Ledger.pdf` 및 동명 `../public/docs/` 미러 |
| `external/business-plan-psst.html` · `external/consult-guide.html` | `external/dist/Concord-Business-Plan-PSST.pdf` · `external/dist/Concord-Consult-Guide.pdf` |

IR 피치덱(13장)·브랜드 가이드라인(v1.1)·제안 원장 컴펜디움(전 제안 ID 집대성 + 확장 제안 X-1~28, 76슬라이드)은 md 원본 없이 HTML 이 원천이다.

## 부록 B — 이 지도의 갱신 기록

문서 체계가 어떻게 변해왔는지의 기록이다. 각 문서의 상태·완료 표시는 그 문서 작성 시점 기준임을 전제한다.

- **2026-09-30 · 전면 정리 (이 판)** — 지도를 "읽는 순서 + 성격별 분류"로 재작성. ADR 0002(디자인 v3) 신설, BUSINESS_DIRECTION §7 개서, `HANDOFF_2026-08-03` 을 `/HANDOFF.md` 로 흡수, 07-14 감사 3종·07-02 구현 계획 2종·v2 디자인 패키지를 `archive/` 하위 분류로 이동, `archive/README.md`·`design/README.md` 신설, "이동 금지 경로" 표 신설.
- **2026-09-17 · 사업 소개 정합화** — 사업 정의(큐레이션·학습관리)를 정본 기준으로 전 문서 정합화. 기술 문서의 웹·모바일 플랫폼 용어는 사업 유형과 구분. CEO 제안 HTML·제안 원장은 과거 원안임을 표지에서 구분. 분당 기준 시장 추산을 동탄에 전용하지 않음. 과거 재무·시장 가정은 실적으로 바꾸지 않으며, 4주 고객 요금의 연 13주기 환산은 별도 재검증 대상.
- **2026-07-14 · 파편 정리(B안)** — superseded PLAN·루트 사업계획서·`.hermes` 잔재를 `archive/` 로, `strategy-rounds/` 를 캠페인별 서브폴더로 분리, 미등재 문서 전량 지도 편입.
- **2026-07-12 · 주제별 단권화 재편** — 시간순 누적 문서 15종을 주제별 단권 6종으로 병합(전문 무손실), 원본은 `archive/` 로.
- **2026-07-08 · 수락 버튼 정책 개정** — 학생 수락은 형식적 절차. 마케팅 카피·UI 에서 강조 금지. **이 개정 이전 문서의 수락 강조 서술은 구버전 규범이다** (`20-마케팅.md` 의 수락 버튼 소재화, `external/*` 의 "동의 기반 매칭" 강조 등).
