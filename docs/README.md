# 문서 지도 (docs/)

> 갱신: 2026-07-12 · **주제별 단권화 재편** — 시간순으로 누적되던 전략·리뷰 문서 15종을 주제별 단권 6종으로 병합(전문 무손실)하고 원본은 `archive/`로 이동.
> **사람이 읽을 때**: [`00-현재상태.md`](00-현재상태.md)부터. **AI 세션**: 루트 [`/HANDOFF.md`](../HANDOFF.md)부터 (운영 하네스 Part 0 필독).
> ⚠️ **수락 버튼 정책 (2026-07-08 개정)**: 학생 수락은 형식적 절차 — 마케팅 카피·UI에서 강조 금지 (`CLAUDE.md`). 개정 이전 문서의 수락 강조 서술은 구버전 규범.

## 주제별 단권 (2026-07-12 재편 — 여기부터 읽는다)

| 문서 | 내용 | 수록 원본 |
|---|---|---|
| [00-현재상태.md](00-현재상태.md) | **제품·사업 현황 한눈에** — 상태·수치·블로커·다음 할 일 | (신규 작성) |
| [10-사업전략.md](10-사업전략.md) | BM 설계 통합 — Part A: v4.1 최신판(NX-1~53·EXP-1~8) / Part B: v3 전문(F-·BM-·M-·W-·RR-) | BM_EVOLUTION_V4 + BM_EVOLUTION |
| [11-사업리뷰·취약점.md](11-사업리뷰·취약점.md) | Part A: 사업·마케팅·리스크·성장 리뷰(BR-·MK-) / Part B: 취약점 50·개선점 50 | BUSINESS_REVIEW + VULNERABILITY_AUDIT |
| [20-마케팅.md](20-마케팅.md) | Part A: 실행 계획 v3(4트랙·V-1~13·AD-1~14) / B: 카피 제안 / C: 설탭 티어다운 / D: 설탭 벤치마크 | MARKETING_PLAN + copy-proposals + seoltab 2종 |
| [30-제품·디자인.md](30-제품·디자인.md) | Part A: 제품·디자인 트래커(FI-·EC-) / B: 방향 정의서 / C: CRO 리뷰 / D: UX 감사 M-1~17 / E: 홈 개선안 / **F: 사용자 흐름 UX 감사 75건 (07-12)** | PRODUCT_DESIGN_TRACKER + design 3종 + HOMEPAGE_REDESIGN + 신규 |
| [40-파일럿.md](40-파일럿.md) | 파일럿 1차 기록(종결). 2차는 아래 활성 문서 참조 | PILOT_SIM |

## 활성 문서 (다른 세션·스킬이 직접 사용 — 이동·구조 변경 금지)

| 문서 | 내용 | 사용처 |
|---|---|---|
| [PILOT_SIM2_2026-07.md](PILOT_SIM2_2026-07.md) | 파일럿 2차 — 11라운드까지 기록, 라운드 계속 append | `pilot-verify` 스킬이 `docs/PILOT_SIM2_*.md` 글롭 참조 |
| [IMPLEMENTATION_PLAN_2026-07.md](IMPLEMENTATION_PLAN_2026-07.md) | 2026-07 구현 계획 | 타 세션 활성 |
| [IMPLEMENTATION_SESSIONS_REVISED.md](IMPLEMENTATION_SESSIONS_REVISED.md) | 세션별 구현 기록 | 타 세션 활성 |
| [MANAGER_GUIDELINES.md](MANAGER_GUIDELINES.md) | 매니저 운영 가이드 | 운영 |
| [REFACTORING_PLAN.md](REFACTORING_PLAN.md) | 리팩토링 제안 R-1~16 (P0 보안~P2 파일 분할) | 기술 부채 추적 |
| [PHOTO_SHOOT_LIST.md](PHOTO_SHOOT_LIST.md) · [PHOTO_GENERATION_PROMPT.md](PHOTO_GENERATION_PROMPT.md) | 촬영 리스트 / 이미지 생성 프롬프트(보류) | 콘텐츠 |
| [FRONTEND_BUILD_SPEC.md](FRONTEND_BUILD_SPEC.md) | 포인터 스텁 → 원본 `design handoff/FRONTEND_BUILD_SPEC.md` | 디자인 패키지 |
| `app-guide.html` · `ceo-proposal.html` · `proposal-ledger.html` | 덱 PDF 소스 (headless Chrome `--print-to-pdf`로 재생성) | `branding/*.pdf` |

## 외부 문서 (제출·전달용) — `docs/external/`

| 문서 | 용도 | 상태 |
|---|---|---|
| [BUSINESS_PLAN_PSST.md](external/BUSINESS_PLAN_PSST.md) | 창업지원사업 제출용 사업계획서 (PSST) | 초안 — [기재 필요] 채우면 제출 가능 |
| [FINANCIAL_PLAN.md](external/FINANCIAL_PLAN.md) | 3개년 재무계획 (V2 요금제 단가, 3시나리오) | 초안 — 파일럿 실측치로 갱신 예정 |
| [IR_ONE_PAGER.md](external/IR_ONE_PAGER.md) | IR 원페이저 (PDF: `branding/Concord-IR-OnePager.pdf`) | 완료 — 대표자 정보 [기재 필요] · ⚠️수락 서술 수정 후 배포 |
| [APP_GUIDE.md](external/APP_GUIDE.md) | 앱 상세 설명 (PDF: `branding/Concord-App-Guide.pdf`, 32슬라이드) | 완료 · ⚠️수락 서술 수정 후 배포 |
| [CEO_PROPOSAL.md](external/CEO_PROPOSAL.md) | 경영자 제안 (PDF: `branding/Concord-CEO-Proposal.pdf`, 13슬라이드) | 완료 — 대표자 정보 [기재 필요] · ⚠️수락 서술 수정 후 배포 |
| IR 피치덱 — `branding/Concord-IR-Deck.pdf` (소스 `branding/pitch-deck.html`) | 발표·투자 미팅용 13장 덱 | 완료 — 대표자 정보 [기재 필요] |
| 브랜드 가이드라인 — `branding/Concord-Brand-Guidelines.pdf` (소스 `branding/brand-guidelines.html`) | 로고·컬러·타이포·보이스 v1.1 | 완료 |
| 제안 원장 컴펜디움 — `branding/Concord-Proposal-Ledger.pdf` (소스 `docs/proposal-ledger.html`) | 전 제안 ID 단위 집대성 + 확장 제안 X-1~28, 76슬라이드 | 완료 |

**미작성 — 투자·지원사업 대비 권고 (우선순위순)**: ① 대표자 프로필·이력 상세([기재 필요] 원천) ② 데모 시나리오 문서 ③ 정부 양식별 변환본(공고 확정 후) ④ 트랙션 리포트 템플릿(파일럿 후) ⑤ 투자용 데이터룸 체크리스트(Pre-A 전)

## 내부 문서 — `docs/internal/`

| 문서 | 용도 | 상태 |
|---|---|---|
| [TECH_OVERVIEW.md](internal/TECH_OVERVIEW.md) | 기술 아키텍처 (스택·인증·DB·결제·배포) | 완료 (07-04 실측 — API 수 등은 `HANDOFF.md` 3.4가 최신) |
| [API_REFERENCE.md](internal/API_REFERENCE.md) | API 전수 레퍼런스 | ⚠️ 07-04 기준 110 라우트 — **07-12 실측 166**, 재실측 필요 |
| [LEGAL_DOCS_STATUS.md](internal/LEGAL_DOCS_STATUS.md) | 법률 문서 현황 + 필요 7종(L-1~7) | 완료 (체크리스트) |
| [contracts/TUITION_CONTRACT_DRAFT.md](internal/contracts/TUITION_CONTRACT_DRAFT.md) | L-1 수강 계약서 | ⚠️ 초안 — 변호사 검토 필수 |
| [contracts/TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md](internal/contracts/TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md) | L-2 강사 위촉 계약서 | ⚠️ 초안 — 변호사·노무 검토 필수 |
| [LEGAL_ADVISORY_MEMO.md](internal/LEGAL_ADVISORY_MEMO.md) | 임시 법률 자문 메모 (A-1~4) | ⚠️ AI 임시 — 정식 자문 대체 필요 |

미작성 (LEGAL_DOCS_STATUS 우선순위): 개인정보 내부관리계획(L-3), 신원확인 동의서(L-4)

## 아카이브 — `docs/archive/` (전량 보존, 참조용)

2026-07-12 재편으로 이동한 원본 15종(위 단권에 전문 수록) + 루트에서 이동한 구버전 사업계획서 산출물 4종(`concord_bizplan.*`, `Concord_사업계획서_2026.docx`). 아카이브 내 문서 간 상호 참조는 같은 폴더라 유효. `Concord_사업계획서_2026.md`(원본 소스)는 루트 유지, PSST가 계승.

## 다른 위치의 문서

| 위치 | 내용 |
|---|---|
| 루트 `HANDOFF.md` | **AI 마스터 핸드오프** — 운영 하네스 Part 0 · 상태 스냅샷(3.4 최신) · 백로그 |
| 루트 `CLAUDE_HANDOFF.md` | 과거 세션 로그·이연 스펙 원본 (역사 보존) |
| 루트 `design handoff/` | 디자인 패키지 — HTML 시안 20종, DESIGN_SYSTEM, ROUTE_MAP, IMPLEMENTATION_CONTRACT, MOBILE_HANDOFF. **신 디자인은 로그인 후 화면만, 공개 페이지 수정 금지** |
| `public/docs/` | 웹 자료실 배포본 (PDF·HTML — `DocsLibrary.tsx`가 참조, md 이동과 무관) |

> PDF 재생성: 소스 HTML 수정 후 headless Chrome `--print-to-pdf` (원페이저·덱·가이드라인 공통).
> 문서 갱신 시 이 지도를 동반 갱신한다 (HANDOFF.md §0.8).
