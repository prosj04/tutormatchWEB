# 문서 지도 (docs/)

> 갱신: 2026-07-04 · 리뷰 문서 6개를 2개로 통합하고 내부/외부 문서 체계를 신설.
> **신규 AI 세션은 루트 [`/HANDOFF.md`](../HANDOFF.md)부터 읽을 것** — 운영 하네스(Part 0)와 현재 상태·백로그가 담긴 마스터 핸드오프. `CLAUDE_HANDOFF.md`는 세션 로그·이연 스펙 원본으로 보존.

## 외부 문서 (제출·전달용) — `docs/external/`

| 문서 | 용도 | 상태 |
|---|---|---|
| [BUSINESS_PLAN_PSST.md](external/BUSINESS_PLAN_PSST.md) | 창업지원사업 제출용 사업계획서 (PSST 구조) | 초안 — [기재 필요] 항목 채우면 제출 가능 |
| [FINANCIAL_PLAN.md](external/FINANCIAL_PLAN.md) | 3개년 재무계획 (실제 V2 요금제 단가 기반, 3시나리오) | 초안 — 파일럿 실측치로 갱신 예정 |
| [../docs/PHOTO_GENERATION_PROMPT.md](PHOTO_GENERATION_PROMPT.md) | 이미지 생성 AI 전달용 프롬프트 (인물 사진 6종×5장) | 완료 (작업 보류 중) |

미작성 (필요 시): IR 원페이저, 정부 양식별 변환본(HWP 등)

## 내부 문서 — `docs/internal/`

| 문서 | 용도 | 상태 |
|---|---|---|
| [TECH_OVERVIEW.md](internal/TECH_OVERVIEW.md) | 기술 아키텍처 (스택·인증·DB·결제·배포·기술부채) | 완료 (코드 실측) |
| [API_REFERENCE.md](internal/API_REFERENCE.md) | API 전수 레퍼런스 (110개 라우트, 권한·파라미터) | 완료 (코드 실측) |
| [LEGAL_DOCS_STATUS.md](internal/LEGAL_DOCS_STATUS.md) | 법률 문서 현황 + 필요 문서 7종(L-1~7) + 행정 절차 | 완료 (체크리스트) |
| [contracts/TUITION_CONTRACT_DRAFT.md](internal/contracts/TUITION_CONTRACT_DRAFT.md) | L-1 수강 계약서 | ⚠️ 초안 — 변호사 검토 필수 |
| [contracts/TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md](internal/contracts/TUTOR_ENGAGEMENT_CONTRACT_DRAFT.md) | L-2 강사 위촉 계약서 (직거래 금지·시급 30,000원 정산 반영) | ⚠️ 초안 — 변호사·노무 검토 필수 |
| [LEGAL_ADVISORY_MEMO.md](internal/LEGAL_ADVISORY_MEMO.md) | 임시 법률 자문 메모 (A-1~4: 위약금·신원조회·학원법 지위·원천징수) + 정식 자문 질문 리스트 | ⚠️ AI 임시 자문 — 정식 자문으로 대체 필요 |

미작성 (LEGAL_DOCS_STATUS 우선순위 따름): 개인정보 내부관리계획(L-3), 신원확인 동의서(L-4)

## 전략·리뷰

| 문서 | 내용 |
|---|---|
| [BUSINESS_REVIEW.md](BUSINESS_REVIEW.md) | 사업·마케팅·리스크·성장 통합 (Part 1: BR-1~6/MK-1~8 · Part 2: BR-7~23 법률·재무 · Part 3: 성장 제안 §1~9) |
| [PRODUCT_DESIGN_TRACKER.md](PRODUCT_DESIGN_TRACKER.md) | 제품·디자인 개선 트래커 (기능 FI-* · 디자인 §1~8 구현 현황 · 플로우 엣지케이스 EC-*) |
| [project-goals.md](project-goals.md) | 프로젝트 목표 |

## 실행·운영 (다른 세션 활성 사용 — 이 구조 변경 금지)

| 문서 | 내용 |
|---|---|
| [IMPLEMENTATION_PLAN_2026-07.md](IMPLEMENTATION_PLAN_2026-07.md) | 2026-07 구현 계획 |
| [IMPLEMENTATION_SESSIONS_REVISED.md](IMPLEMENTATION_SESSIONS_REVISED.md) | 세션별 구현 기록 |
| [MANAGER_GUIDELINES.md](MANAGER_GUIDELINES.md) | 매니저 운영 가이드 |
| `../CLAUDE_HANDOFF.md` (루트) | 세션 간 핸드오프 — 최신 상태의 진실의 원천 |

## 루트 정리 권고 (미실행 — 사용자 결정 필요)

`concord_bizplan.docx`, `concord_bizplan.docx.bak`, `concord_bizplan.rtf`, `Concord_사업계획서_2026.docx`는 구버전 산출물로 보임. `Concord_사업계획서_2026.md`가 원본 소스이며 PSST 버전이 이를 계승하므로, 확인 후 삭제 또는 아카이브 폴더 이동 권장.
