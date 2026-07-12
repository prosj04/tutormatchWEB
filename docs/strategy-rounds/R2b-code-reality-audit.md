# R2b — 코드-현실 정합 검수 (reviewer, 2026-07-13)

전략 라운드 문서(R1×2, R2)의 코드 관련 전제를 코드베이스와 대조 검증. 읽기 전용 감사.

## 판정 요약: 오류 3 · 과장 2 · 정확 5

| # | 주장 (출처) | 코드 근거 | 판정 | 전략 영향 |
|---|---|---|---|---|
| 1 | "/admin/metrics 구현됨" (S-6) | `src/app/admin/metrics/page.tsx`, `src/app/api/admin/metrics/route.ts` — 코호트 재결제율·환불율·리드타임·매니저별 지표 기 계산 | 정확 | S-6은 "확장"이 맞음, 신규 구축 아님 |
| 2 | AI 질답 prod 미설정 모순 (S-15) | `src/lib/ai-answer.ts:6` — `ANTHROPIC_API_KEY` 없으면 MOCK 응답. pricing은 "AI 질답 2배" 광고(`pricing-plans.ts:213`) | 정확 (뉘앙스: 미구현 아닌 **키 게이트 비활성**) | 표시광고 리스크 유효 |
| 3 | "정산-환불 무연동 과지급 버그 상존" (S-22/I-25) | `src/app/api/teacher/settlements/route.ts:63-95` — REFUNDED 기간 회차 payout 제외 필터 실존 | **오류** (이미 해소) | 코어 시퀀스에서 제외, 회귀검증 항목으로 격하 |
| 4 | 숙제 자동분배 실존 (S-21/I-24) | `src/lib/homework-distribution-core.ts` 외 웹/모바일 라우트 | 정확 | "UX 검증 필요" 스탠스 유지 |
| 5 | 요금제 v2 코드값 | `pricing-plans.ts:75-84` — 중38·55·76·106/고43·58·78·112 완전 일치 | 정확 | — |
| 6 | "리텐션 인프라 부재/미설계" | `run-alert-checks.ts` D+7(391-512), 만족도 체크인 라우트, 만료 3단계(1048~), dunning 멱등(`renewal-{subId}-{yyyymmdd}`), ManagerCareLog 전부 실존 | **오류** (상당수 기 구현) | "부재" 전제 제안은 "활용·계측"으로 재프레이밍 |
| 7 | "계측 제로, GA4 반나절 신규" (S-12) | `src/app/layout.tsx:90-129` gtag 조건부 삽입, `analytics-client.ts` purchase/begin_checkout, `analytics.ts` DB 적재 | **과장** | 남은 일 = GA ID 발급 + `NEXT_PUBLIC_GA_MEASUREMENT_ID` env 주입. 오프라인 스티칭만 미구현 |
| 8 | "학부모모드 최대 갭" (S-32) | `mobile/parent/` register·link·children·payments·profile·consultation·reports + 웹 `src/app/parent` 실존 | **오류** (07-10 PARENT 신설로 해소) | "완성도 점검"으로 하향 |
| 9 | "언제든 해지" 셀프 해지 | `src/app/api/billing/autorenew/route.ts` — 학생 본인 토글, 다음 결제일부터 중단 | 정확 | 클레임 코드 뒷받침 |

## 전략 문서 수정 필요 목록
- S-22/I-25: 과지급 버그 → 존재하지 않음. 회귀검증만.
- S-12: 계측 제로 → GA4 코드 기존, env 주입만 필요.
- S-32: 학부모 갭 → 완성도 점검으로 하향.
- S-6: 대시보드 신규 → 확장.
- 리텐션 부재 전제 → 기 구현 자산 활용으로 전환.
- S-15: "미구현" → "키 게이트 비활성"으로 표현 정정.
