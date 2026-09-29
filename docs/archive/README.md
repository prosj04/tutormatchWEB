# 아카이브 (docs/archive/)

과거 기록의 보관소다. **원문 보존** — 여기 들어온 문서는 고치지 않는다. 낡았다는 사실 자체가 기록의 내용이다.

읽는 법: 현행 상태는 [`../00-현재상태.md`](../00-현재상태.md), 규칙은 [`../BUSINESS_DIRECTION.md`](../BUSINESS_DIRECTION.md)·`CLAUDE.md`, 문서 지도는 [`../README.md`](../README.md). 여기는 "왜 그렇게 됐는지"를 되짚을 때만 온다. 아카이브 문서의 서술이 현행 규칙과 어긋나면 **현행 규칙이 우선**한다.

## 1. 디자인 — `design-handoff-v2/`

2026-09-30 [ADR 0002](../adr/0002-editorial-redesign.md) 로 v3 "Editorial" 에 대체된 v2 그린/블루 핸드오프 패키지 전량(루트 `design handoff/` 에서 이동). 롤백 자산이므로 삭제하지 않는다. 구성 목록은 [`../design/README.md`](../design/README.md) 참조.

| 원래 경로 | 현재 경로 |
|---|---|
| `design handoff/**` (md 9 · 시안 html 20 · css/js 5 · reference png 16) | `docs/archive/design-handoff-v2/**` |

## 2. 핸드오프 — `handoff/`

| 원래 경로 | 현재 경로 | 내용 |
|---|---|---|
| `HANDOFF_2026-08-03.md` | `handoff/HANDOFF_2026-08-03.md` | 웹·앱 정합성 검토 세션 기록. 현행 결론(요금=코드 진실 / 강사 교체 요청 제거 / 모바일 API 복사 구조)은 루트 `HANDOFF.md` §0.11·§2.12·§3.5 로 흡수됨 |
| `HANDOFF.md` §5.2 세션 로그 + ⚡07-13 마감 요약 | `handoff/session-logs-2026-07.md` | 2026-07-04 ~ 07-14 세션 로그 7편 원문 |

루트에 남는 과거 핸드오프: `CLAUDE_HANDOFF.md`(§1~24 아카이브 성격 + §25~26 세션 로그·이연 스펙 원본). `.claude/agents/` 4종이 섹션 번호로 직접 참조하므로 **이동 불가** — 루트에 두고 아카이브로 취급한다.

## 3. 감사 기록 — `audits-2026-07/`

1회성 감사 결과. 후속 조치는 당시 커밋으로 끝났고 기록만 남는다.

| 원래 경로 | 현재 경로 | 내용 |
|---|---|---|
| `docs/SECURITY_AUDIT_2026-07-14.md` | `audits-2026-07/SECURITY_AUDIT_2026-07-14.md` | 인증·결제·입력·시크릿 4도메인 보안 감사, 7커밋 |
| `docs/CLEANUP_AUDIT_2026-07-14.md` | `audits-2026-07/CLEANUP_AUDIT_2026-07-14.md` | 오버엔지니어링·죽은 코드 감사 |
| `docs/CONTENT_AUDIT_2026-07-14.md` | `audits-2026-07/CONTENT_AUDIT_2026-07-14.md` | 문서 내용 파편 감사 — 헌법 충돌 격리·삭제 결정 기록 |
| (기존) `VULNERABILITY_AUDIT_2026-07.md` | `VULNERABILITY_AUDIT_2026-07.md` | 취약점 50·개선점 50. 전문은 [`../11-사업리뷰·취약점.md`](../11-사업리뷰·취약점.md) Part B 에 수록 |

## 4. 구현 계획 — `implementation-2026-07/`

2026-07-02 작성 계획서. 대상 기능은 그 후 구현·변경됐고(수락 버튼 정책 개정, v2 요금제, 수업 확인 제도) 현행 백로그는 루트 `HANDOFF.md` Part 4 다.

| 원래 경로 | 현재 경로 |
|---|---|
| `docs/IMPLEMENTATION_PLAN_2026-07.md` | `implementation-2026-07/IMPLEMENTATION_PLAN_2026-07.md` |
| `docs/IMPLEMENTATION_SESSIONS_REVISED.md` | `implementation-2026-07/IMPLEMENTATION_SESSIONS_REVISED.md` |

## 5. 2026-07-12 단권화로 이동한 원본 15종

주제별 단권 6종이 **전문 무손실 수록**했고 원본은 여기 남는다. 대응표:

| 아카이브 원본 | 수록 위치 |
|---|---|
| `BM_EVOLUTION_V4_2026-07.md` · `BM_EVOLUTION.md` | [`../10-사업전략.md`](../10-사업전략.md) Part A · Part B |
| `BUSINESS_REVIEW.md` · `VULNERABILITY_AUDIT_2026-07.md` | [`../11-사업리뷰·취약점.md`](../11-사업리뷰·취약점.md) Part A · Part B |
| `MARKETING_PLAN.md` · `copy-proposals.md` · `seoltab-teardown.md` · `benchmark-seoltab.md` | [`../20-마케팅.md`](../20-마케팅.md) Part A~D |
| `PRODUCT_DESIGN_TRACKER.md` · `design-direction.md` · `design-review-2026-07.md` · `ux-audit-handoff.md` · `HOMEPAGE_REDESIGN_2026-07.md` | [`../30-제품·디자인.md`](../30-제품·디자인.md) Part A~E |
| `PILOT_SIM_2026-07.md` | [`../40-파일럿.md`](../40-파일럿.md) Part A |
| `project-goals.md` | 초기 목표 메모 (단권 편입 없음, 원문만 보존) |

## 6. 구버전 사업계획서

`Concord_사업계획서_2026.md` · `Concord_사업계획서_2026.docx` · `concord_bizplan.docx` — [`../external/BUSINESS_PLAN_PSST.md`](../external/BUSINESS_PLAN_PSST.md)(PSST)가 계승. docx 는 `biz-improver` 에이전트가 경로로 직접 참조하므로 **이동·개명 금지** (`textutil -convert txt -stdout <file>` 로 추출).

## 7. superseded 중간본 · 프로세스 잔재

| 경로 | 내용 |
|---|---|
| `BUSINESS_IMPROVEMENT_PLAN_2026-07.md` | [`../BUSINESS_IMPROVEMENT_MASTER_2026-07.md`](../BUSINESS_IMPROVEMENT_MASTER_2026-07.md) 가 계승한 중간본 |
| `hermes/plans/*` (3) · `hermes/prompts/*` (4) | 2026-07-01·02 `.hermes` 오케스트레이션 계획·프롬프트 잔재 |

라운드 원본(`../strategy-rounds/improvement/` R1~R6 · `../strategy-rounds/expansion/` R1~R3)도 성격은 프로세스 잔재이나, `biz-rounds` 스킬이 이 경로를 출력 대상으로 쓰므로 **아카이브로 내리지 않고 제자리**에 둔다.

## 8. 이동 원칙

- 이동은 `git mv` 로 한다 — 히스토리를 끊지 않는다.
- 이동한 문서를 참조하던 현행 문서에는 "📁 경로 이동 고지" 한 줄을 머리에 추가한다(본문 수정 아님).
- `.claude/skills/**`·`.claude/agents/**`·`src/**`·`docs/build-html.mjs` 가 경로로 참조하는 문서는 낡았더라도 **이동하지 않는다.** 고정 목록은 [`../README.md`](../README.md) 하단 "이동 금지 경로" 표.
- 생성물(PDF·`docs/_html/`·`docs/branding/` 일부)은 기록이 아니라 산출물이다 — 아카이브 대상이 아니고 원본에서 재생성한다.
