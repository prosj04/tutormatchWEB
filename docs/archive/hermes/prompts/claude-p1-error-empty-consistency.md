You are Claude Code implementing a focused P1 mobile UX consistency batch.

Project root: /Users/mac/Documents/premium-tutoring

Read first:
- AGENTS.md
- CLAUDE.md
- mobile/AGENTS.md
- design handoff/QA_CHECKLIST.md

Goal:
Separate API/network error states from genuine empty-data states on key mobile subpages, using the existing `ErrorState` and `EmptyState` components consistently.

Target files only:
- mobile/app/teacher/[id].tsx
- mobile/app/notifications.tsx
- mobile/app/report/[id].tsx
- mobile/app/subscription.tsx

Required changes:
1. `mobile/app/teacher/[id].tsx`
- Replace the plain text fallback with `ErrorState` for API failures.
- Keep a distinct empty/not-found style fallback only if there is genuinely no tutor data without an API error.
- Add a retry handler.

2. `mobile/app/notifications.tsx`
- Add explicit `error` state.
- API failure should render `ErrorState`, not the same UI as “새 알림이 없어요”.
- Keep empty notifications as `EmptyState`.
- Add retry handler.

3. `mobile/app/report/[id].tsx`
- Add explicit `error` state.
- API failure should render `ErrorState`.
- Keep no report data as `EmptyState` using existing copy.
- Add retry handler.

4. `mobile/app/subscription.tsx`
- Add explicit `error` state.
- API failure should render `ErrorState` with retry.
- Keep “구독 없음” as the real no-subscription empty/business state.

Constraints:
- Do not change business logic beyond the error/empty split.
- Do not edit any file outside the 4 target files.
- Do not commit. Do not install packages.

Verification:
- Run `cd mobile && npx tsc --noEmit` and report the actual result.
- If there are unrelated type errors, stop and report them.
