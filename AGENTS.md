# AGENTS.md

Concord — 프리미엄 과외 큐레이션 서비스 (Next.js + Prisma 웹 + React Native 앱).

이 레포의 규칙은 [`CLAUDE.md`](CLAUDE.md)와 [`docs/BUSINESS_DIRECTION.md`](docs/BUSINESS_DIRECTION.md)가 단일 출처다. 여기서 규칙을 중복해 적지 않는다 — 아래 3줄을 지키고 그 두 문서를 읽을 것.

- **큐레이션이지 플랫폼이 아니다.** 학부모에게 비교·선택을 시키는 UX(수락/거절 강조·평점·비교·할인)를 추가하지 말 것.
- **빌드 검증 후 커밋.** `npm run build`(= `prisma migrate deploy && next build`) 통과 전 커밋 금지. 기능 하나 완성 = 커밋, 목표 하나 완료 = 푸시 + 보고. 상세는 `.claude/rules/build-and-commit.md`.
- **지시 범위 밖 "개선" 금지.** 실행 자율 100%, 제품 취향 판단 0%. 기능 임의 축소 금지. 의견은 제안으로만.

커밋 메시지는 Conventional Commits. 시크릿·생성물 커밋 금지. 소통·주석은 한국어.
