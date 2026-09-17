# Concord

Concord는 전담 매니저가 학생에게 맞는 선생님을 배정하고, 수업 이후의 학습까지 관리하는 **프리미엄 1:1 방문 과외 큐레이션·학습관리 서비스**입니다. 서울·동탄의 중·고등학생과 학부모를 대상으로 합니다.

대표가 선생님을 직접 면접하고, 매니저가 방문 상담에서 학생의 성향과 공부 방식을 파악해 선생님을 배정합니다. 숙제·질문 답변·리포트·상담으로 관리가 이어집니다. 앱과 웹은 이 서비스를 운영하는 도구이며, 핵심 가치는 학부모가 선생님 탐색·검증·선택의 부담을 맡길 수 있다는 데 있습니다.

사업 정의·서비스 흐름·요금 원칙은 [사업 방향](docs/BUSINESS_DIRECTION.md), 문서별 적용 기준은 [문서 지도](docs/README.md)를 따릅니다.

Live: https://tutormatch-web.vercel.app

## Claude / Anthropic API features

Concord uses the Anthropic API (`@anthropic-ai/sdk`) in two places, both designed to degrade gracefully when the API is unavailable or unconfigured rather than fail the user-facing flow.

**AI tutor answers** (`src/lib/ai-answer.ts`, `src/lib/qna-ai-answer.ts`) — when a student posts a question (optionally with an attached image), Claude produces a step-by-step Korean explanation as an instant draft answer. The question is still routed to the student's assigned human teacher regardless of whether an AI draft was generated, so a missing or rate-limited AI response never blocks the student from getting a real answer — it just falls back to a placeholder string until the teacher replies.

**Monthly parent reports** (`src/lib/generate-monthly-report.ts`) — once a month, Claude reads a student's lesson completion, homework completion, question volume, and stated goals, and writes a short encouraging Korean summary for parents. If the API call fails or `ANTHROPIC_API_KEY` isn't set, the report still generates using a deterministic template built from the same stats — parents always get a report, AI just makes the wording warmer when available.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19, TypeScript
- [Prisma](https://www.prisma.io) 5 + PostgreSQL (Supabase)
- [NextAuth](https://authjs.dev) 5 (beta) for auth
- [Supabase](https://supabase.com) for storage
- [Toss Payments](https://www.tosspayments.com) widget SDK for billing
- Tailwind CSS, Framer Motion, dnd-kit
- `@anthropic-ai/sdk` for the AI features above

## Domain flow

1. **Application** — a parent submits an intake form.
2. **Payment** — Toss Payments checkout.
3. **Manager assignment** — a manager is assigned to the family (`ManagerStudent`).
4. **In-person consultation** — the manager books and runs a consultation, capturing goals and preferred times (`ConsultationBooking`, `ConsultationReport`).
5. **Teacher matching** — the manager matches a teacher to the student per subject (`TeacherStudent`).
6. **Lesson scheduling** — recurring lessons are scheduled and tracked (`Lesson`).
7. **Homework distribution** — teachers assign homework from templates, weighted and spread across the following days (`HomeworkTemplate`, `StudyPlan`/`StudyTask`); optional auto-distribution on first lesson date via `ENABLE_AUTO_HOMEWORK_DISTRIBUTION`.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, Supabase keys, etc.
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts: `npm run check-env` (validate required env vars), `npm run seed:sample` (seed sample data), `npm run seed:reviews` (seed reviews), `npm run build` (runs migrations then builds).
