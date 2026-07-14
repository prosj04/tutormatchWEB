You are Claude Code implementing one small P0 mobile app flow fix.

Project root: /Users/mac/Documents/premium-tutoring

Read first:
- AGENTS.md
- CLAUDE.md
- mobile/AGENTS.md

Task:
Fix the mobile auth post-login/post-signup navigation so it passes Expo Router typed routes and respects the app's root journey redirect policy.

Known current failure:
- In /Users/mac/Documents/premium-tutoring/mobile, `npx tsc --noEmit` fails:
  hooks/useAuth.ts(21,20): Argument of type '"/(tabs)/"' is not assignable...

Required behavior:
- After login, save tokens and register push as before, then route through the root index route (`/`) so `mobile/app/index.tsx` can decide between `/consult/status`, `/consult/match`, or tabs based on journey stage.
- After signup with attached/pending consultation, keep routing to `/consult/status`.
- After signup without consultation, route through `/` instead of directly to tabs, for the same journey policy.

Allowed files to edit only:
- mobile/hooks/useAuth.ts
- mobile/app/(auth)/signup.tsx

Do not edit any other file. Do not commit. Do not install packages.

Verification:
- Run `cd mobile && npx tsc --noEmit` and report the actual result.
- If typecheck exposes unrelated errors, do not broaden scope without reporting them.
