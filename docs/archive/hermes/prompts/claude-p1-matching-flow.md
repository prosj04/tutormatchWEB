You are Claude Code implementing a small P1 student mobile journey UX fix.

Project root: /Users/mac/Documents/premium-tutoring

Read first:
- AGENTS.md
- CLAUDE.md
- mobile/AGENTS.md
- design handoff/USER_FLOW.md
- design handoff/QA_CHECKLIST.md

Context:
- Student journey stages are defined in `mobile/lib/student-journey.ts` and backend `src/lib/student-journey.ts`.
- Current `mobile/app/index.tsx` has a special case `MATCHING && activeTeacherCount > 0` before routing to `/consult/match`. But backend stage resolution returns `ACTIVE` when activeTeacherCount > 0, so that condition is effectively unreachable.
- `design handoff/QA_CHECKLIST.md` expects MATCHING/recommended-teacher flow to guide the user toward `/consult/match`.
- `mobile/app/consult/match.tsx` already has an empty state if there are no teachers, but it currently treats API failure as empty state instead of ErrorState.

Task:
Improve MATCHING-stage UX and match screen error handling.

Required behavior:
1. In `mobile/app/index.tsx`, route `journey.stage === "MATCHING"` to `/consult/match` directly. Keep WAITING/ASSIGNED using status tracking and keep ACTIVE using tabs.
2. In `mobile/app/consult/status.tsx`, for `MATCHING`, show a clear CTA to `/consult/match` without requiring `activeTeacherCount > 0`. Keep ONBOARDED CTA to `/consult` and ACTIVE CTA to home.
3. In `mobile/app/consult/match.tsx`, add explicit API error state using the existing `ErrorState` component and a retry handler. Do not show the empty state for network/API failures.

Allowed files to edit only:
- mobile/app/index.tsx
- mobile/app/consult/status.tsx
- mobile/app/consult/match.tsx

Do not edit any other file. Do not commit. Do not install packages.

Verification:
- Run `cd mobile && npx tsc --noEmit` and report the actual result.
