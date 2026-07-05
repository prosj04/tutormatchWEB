# 문서 지도 (docs/)

> 갱신: 2026-07-04 · 리뷰 문서 6개를 2개로 통합하고 내부/외부 문서 체계를 신설.
> **신규 AI 세션은 루트 [`/HANDOFF.md`](../HANDOFF.md)부터 읽을 것** — 운영 하네스(Part 0)와 현재 상태·백로그가 담긴 마스터 핸드오프. `CLAUDE_HANDOFF.md`는 세션 로그·이연 스펙 원본으로 보존.

## 외부 문서 (제출·전달용) — `docs/external/`

| 문서 | 용도 | 상태 |
|---|---|---|
| [BUSINESS_PLAN_PSST.md](external/BUSINESS_PLAN_PSST.md) | 창업지원사업 제출용 사업계획서 (PSST 구조) | 초안 — [기재 필요] 항목 채우면 제출 가능 |
| [FINANCIAL_PLAN.md](external/FINANCIAL_PLAN.md) | 3개년 재무계획 (실제 V2 요금제 단가 기반, 3시나리오) | 초안 — 파일럿 실측치로 갱신 예정 |
| [IR_ONE_PAGER.md](external/IR_ONE_PAGER.md) | 투자·지원사업 1페이지 요약 (PDF: `branding/Concord-IR-OnePager.pdf`) | 완료 — 대표자 정보 [기재 필요] |
| IR 피치덱 — `branding/Concord-IR-Deck.pdf` (소스 `branding/pitch-deck.html`) | 발표·투자 미팅용 13장 덱 (PSST·재무계획 수치 기반) | 완료 — 대표자 정보 [기재 필요] |
| 브랜드 가이드라인 — `branding/Concord-Brand-Guidelines.pdf` (소스 `branding/brand-guidelines.html`) | 로고·컬러·타이포·보이스 규정집 v1.1 (11p) | 완료 |
| [../docs/PHOTO_GENERATION_PROMPT.md](PHOTO_GENERATION_PROMPT.md) | 이미지 생성 AI 전달용 프롬프트 (인물 사진 6종×5장) | 완료 (작업 보류 중 — 실사 확보 시 폐기) |
| [../docs/PHOTO_SHOOT_LIST.md](PHOTO_SHOOT_LIST.md) | 실사 촬영 리스트 (A 사이트 필수 / B 마케팅 대비 / C IR — 컷별 자세·배경·조명 규격) | 완료 — 촬영 대기 |

> PDF 재생성: `branding/*.html` 수정 후 headless Chrome `--print-to-pdf` (원페이저·덱·가이드라인 공통).

**미작성 — 투자·지원사업 대비 권고 목록 (우선순위순)**

1. **대표자 프로필·이력 상세** — PSST·덱·원페이저의 [기재 필요]를 채울 원천. 이것만 있으면 3종 문서가 즉시 제출 가능 상태가 됨
2. **데모 시나리오 문서** — 심사 발표 시 라이브 시연 순서(상담 신청 → 매니저 배정 → 매칭 → 수락 → 플랜·AI 질답), 데모 계정·데이터 준비 체크리스트
3. **정부 양식별 변환본** — 지원사업 공고별 HWP/워드 양식으로 PSST 내용 이식 (공고 확정 후)
4. **트랙션 리포트 템플릿** — 파일럿 개시 후 월간 갱신용 (MAS·전환율·유지율·NPS 실측치). FINANCIAL_PLAN 가정 갱신의 근거 문서
5. **투자용 데이터룸 체크리스트** — Pre-A 단계 대비 (법인 등기·재무제표·계약서·IP·개인정보 준수 증빙 목록). 3차년도 전 착수면 충분

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
| [BM_EVOLUTION.md](BM_EVOLUTION.md) | 반드시 성공할 수 밖에 없는 비즈니스 설계 v3 — 실패모드 F-1~10 · 수익 제안 BM-A~Z(26건) · 민감도 테스트 · 해자 M-1~5 · Go/Fix/Kill 게이트 · 수요/공급 엔진 수학 · KPI 트리(QAS) · 워게임 W-1~4 · 리스크 레지스터 RR-1~10 · 90일+12개월 로드맵 |
| [BM_EVOLUTION_V4_2026-07.md](BM_EVOLUTION_V4_2026-07.md) | 4차 고도화 v4.1 — "결제 이후" 플라이휠 설계. 신규 53건 NX-1~53 + 기존 확장 8건 EXP-1~8(활성화·NRR·바이럴공학·증거자동화·데이터해자·강사도구·현금공학·커뮤니티·공급다변화·애셋라이트 확장) + 미해결 기존안 통합(코드 실측) + 실행 분담(Part D-0: 전 제안 항목별 분담 총괄표 🤖/🤝/👤 + 스프린트 1~4 / Part E: 경영자 직접 수행 E1~E4) |
| [MARKETING_PLAN.md](MARKETING_PLAN.md) | 마케팅 실행 계획 v3 — 4트랙 채널 매트릭스·예산·90일 캘린더 + 플레이북 §10~21 + **광고 상세 시나리오집 §22~28**(페르소나 4종·메시지 하우스·영상 콘티 3편 초단위·네이버 SA/메타/카카오/당근 소재 완성본·리타겟 5시나리오·월별 광고 타이밍 매트릭스) + 신규 제안 **AD-1~14** |
| [REFACTORING_PLAN.md](REFACTORING_PLAN.md) | 리팩토링 제안 R-1~11 (P0 보안: 웹훅 서명·RLS / P1 정합성: QnA 이중화·Journey 드리프트 / P2 대형 파일 분할) |
| [PRODUCT_DESIGN_TRACKER.md](PRODUCT_DESIGN_TRACKER.md) | 제품·디자인 개선 트래커 (기능 FI-* · 디자인 §1~8 구현 현황 · 플로우 엣지케이스 EC-*) |
| [HOMEPAGE_REDESIGN_2026-07.md](HOMEPAGE_REDESIGN_2026-07.md) | 설탭 티어다운 기반 홈 개선안 (불안 해소 서사 W-1~4 · 약속 섹션·케어 재설계·히어로 프루프 카드 — 2026-07-04 구현 완료) |
| [PILOT_SIM_2026-07.md](PILOT_SIM_2026-07.md) | 파일럿 시뮬레이션 결과 (학생·학부모·매니저 페르소나 실주행 — P0 7건·P1 7건·병목 3건, pilot- 테스트 계정 정리 목록) |
| [PILOT_SIM2_2026-07.md](PILOT_SIM2_2026-07.md) | 대규모 파일럿 2차 (opus 7팀 도메인별 — 크론 인증우회·매칭무결성 P0 3건·P1 10건·P2 21건, 소스분석 주도, pilot2- 정리 목록) |
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
