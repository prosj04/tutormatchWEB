# 오버엔지니어링 감사·정리 (2026-07-14)

레포 전량 감사(웹+모바일) 후 죽은 코드·미사용 export·중복을 항목별 커밋으로 정리.
검증: `tsc --noEmit`(웹·모바일)·`next lint`·`next build` 전부 통과. 디자인에 닿을 수 있는 항목은 오너 확인 대기로 revert 보류.

## 적용 완료 (main 로컬, push 대기)

| 커밋 | 내용 | 규모 |
|------|------|------|
| 779cb19 | 미사용 lib 4종 삭제 — public-teachers-cache·manager-student-stats·faq-defaults·slot-times (참조 0) | ~230줄 |
| f009075 | 미사용 컴포넌트 18종 삭제 — landing 구버전(Hero·HowItWorks·Philosophy·TrustBar·FinalCTA·TutorShowcase·ServiceCompareSection·HomeConsultationCtaSection), teacher-portal 사장 탭(TeacherStudentPlanTab·TeacherStudentQuestionsTab·TeacherDashboardContent), FloatingConsultationCue·PricingTierToggle·TestimonialCard·KakaoConsultButton·PaymentsPageHeader·DefaultAvatar·SuccessPageActions | ~1,700줄 |
| 8961af3 | 모바일 Expo 템플릿 잔재 App.tsx·index.ts 삭제 (main은 expo-router/entry) | 28줄 |
| 4f5e091 | 미사용 export 정리 — deprecated v1 pricing exports, CMS 중복 alias, analytics-journey→analytics 통합, 내부 전용 함수 unexport, orderId `crypto.randomUUID`, formatKRW `toLocaleString("ko-KR")` | ~340줄 |
| 8f6dad7 | auth 가드 공통화 — `src/lib/require-role.ts` 신설, 6개 auth 헬퍼(admin·student·teacher·parent-page·manager·manager-page)는 동작 동일 래퍼로. 상태코드·리다이렉트 대상·deletedAt/role 재검증 정책 불변 | ~130줄 |
| 81f7681 | 모바일 죽은 코드 — 미참조 UI 4종(Button·Card·Avatar·SectionTitle), subscription-label.ts, app-styles 사장 블록 9종, onboarding 핸드오프 주석 | ~530줄 |
| 03c014c | docx 의존성 제거 (소스 참조 0) | dep 1 |
| a4a6e56 | 모바일 비시각 재적용 — api.ts 401 갱신 블록 공통화·디버그 로그 제거, 미사용 blue 테마 플러밍 제거 | ~80줄 |

순 삭제 약 −3,300줄 (lockfile 제외).

## 보류 — 디자인 영향 가능, 오너 눈확인 후 재적용

revert로 되돌려 놓음. 재적용 = 아래 원본 커밋을 다시 revert(revert-of-revert)하거나 cherry-pick.

| 원본 커밋 | 내용 | 보류 사유 |
|-----------|------|-----------|
| 9f48207 | NEXT_PUBLIC_PORTAL_DESIGN legacy 플래그 제거 (~520줄). Vercel prod env 미설정 확인 완료 | layout.tsx 인라인 스크립트(테마 초기화) 수정 — 포털 화면 렌더 경로 |
| fe45a90 | PortalShell로 대체된 사장 셸 4종 삭제 (411줄, 참조 0) | 9f48207에 종속 (같이 재적용) |
| 8410a59 중 아이콘·won | 모바일 아이콘 중복 통합(Parent 아이콘을 Manager 변형으로 교체, 12개 화면), won() 공통 헬퍼 | 아이콘 시각 차이 가능성 — 화면 확인 필요 |

확인 절차: 관리자 패널·강사 포털·학생 대시보드·모바일 학부모 탭 눈확인 → 이상 없으면 재적용.

## 의도적 제외 (수정 안 함)

- `ENABLE_AUTO_HOMEWORK_DISTRIBUTION` 플래그 — 제품 노스스타 기능(숙제 자동 배분), 플래그 활성화는 제품 결정
- `mobile/app/checkout.tsx` — 외부 딥링크 대상 가능성
- `mobile/lib/student-journey.ts` — 웹 서버 파일과 동일 유지 필수(주석 명시), 통합은 API 응답 전환 필요한 별도 과제
- `TEACHER_HOURLY_RATE_PRESETS_KRW` — 차등시급 기능(32/34/40k)의 선언 상수
- RN peer deps(reanimated·worklets·screens·expo-constants·expo-linking) — import 0이지만 expo-router 런타임 peer
- `expo-status-bar` — 미사용이나 npm ERESOLVE 충돌, 제거 실익 없음
- `scripts/` 수동 원오프 5종(enrich-demo·update-marketing-copy 등) — npm script 미연결, 의도 불명

## 남은 관찰 사항 (작업 아님, 기록만)

- 웹↔모바일 최대 drift 위험: `student-journey.ts` 스테이지 카피 수동 복제 — 서버가 stageCopy를 이미 반환하므로 장기적으로 API 일원화 검토 가치
- `portal-design.css`·`dark-mode-bridge.css`의 legacy 셀렉터 — 9f48207 재적용 시 함께 정리 가능
