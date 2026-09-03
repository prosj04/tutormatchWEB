# Concord

Concord is a tutoring **curation** service for Korean middle/high school students and their parents — not a marketplace where parents browse and compare tutors themselves. A manager interviews the family, runs an in-person consultation, and hand-matches a teacher. The product is not having to choose.

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
