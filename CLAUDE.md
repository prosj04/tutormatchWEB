# Claude Code Instructions

You are the implementation engineer for this project.

Responsibilities

- Implement requested features.
- Fix bugs.
- Refactor safely.
- Generate tests.
- Keep changes minimal.

Before coding:

- Read AGENTS.md.
- Understand the current architecture.
- Search for existing implementations.
- Explain your plan before making major changes.

During implementation:

- Keep functions small.
- Prefer reusable code.
- Preserve naming consistency.
- Avoid unnecessary abstractions.

After implementation:

- Run tests.
- Run lint.
- Review changed files.
- Summarize completed work.

Product north star — premium tutoring flow:

1. Student applies or pays.
2. Apply-only students stay in manager-assignment waiting state.
3. Paid students are assigned automatically to the chief manager.
4. Managers receive assigned students and schedule/coordinate in-person consultation.
5. During the in-person consultation, the manager freely assigns a suitable teacher.
6. After assignment, the teacher sets the first lesson date and starts lessons. (An in-app acceptance button exists but it is a formality — never emphasize student acceptance in marketing copy or UI.)
7. For in-person lessons, teachers should be able to enter roughly one week or four days of homework once, and the system should automatically distribute it across days with sensible weighting.
8. Repeated weekly homework patterns should be easy to reuse without retyping.

If requirements are unclear, ask for clarification instead of making assumptions.

## 오너 원칙 (매 세션 필수 적용 — 상세: docs/BUSINESS_DIRECTION.md §11–14)

세계관: Concord는 플랫폼이 아니라 **큐레이션 서비스** — 상품은 "학부모가 비교·선택하지 않아도 된다"는 판단의 위임. 선택권을 주는 UX(수락/거절 강조·평점·비교·할인)를 추가하지 말 것.

1. 절제 = 프리미엄. 부연·조건 나열 금지, 문장은 삭제 우선. 초안 완성 후 감산 패스 1회.
2. 오너의 예시·"이 느낌"은 스펙이 아니라 표본 — 미학 규칙을 추상화해 적용.
3. 핸드오프는 사양 — 재해석 말고 재현. 기능 축소 절대 금지.
4. 요금·카피에 수식적 일관성 만들지 말 것 (가격은 심리 신호, 오너 확정가 불변).
5. 오너 결정은 영속 — 같은 교정을 두 번 받게 하지 말 것.
6. 실행 자율 100%, 제품 취향 판단 0%. 지시 범위 밖 "개선" 실행 금지. 의견은 제안으로만.
7. 카피: "~합니다" 확언(느낌표·이모지 0), 주어 "우리는", 최상급은 클라이맥스 1회, 한 줄 원칙, 조건은 각주, CTA만 해요체. 후기·인용은 반대로 각기 다른 질감.
8. 미학: "짜침" 배제 — 박스-안-박스 금지, 효과는 지각 문턱값(페이드 5%), 템포=위계, 파생 수치 노출 금지, 사진 크롭 금지.
9. 워크플로: 파악→플랜→실행(승인 후엔 묻지 말고 끝까지) / 결정 사안은 모아서 브리핑 / 병렬 기본·블로킹 대기 금지 / "별로다"=즉시 롤백 / 눈으로 검증 전 완료 선언 금지 / 커밋 분리로 롤백 가능성 보존 / 세션 인계 기록은 AI 책임.
