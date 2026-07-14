You are Claude Code implementing one small P0 mobile auth/session flow fix.

Project root: /Users/mac/Documents/premium-tutoring

Read first:
- AGENTS.md
- CLAUDE.md
- mobile/AGENTS.md

Context:
- Login/signup now route through `/` so `mobile/app/index.tsx` decides journey-based destination.
- `mobile/lib/api.ts` clears tokens only in some refresh-failure cases. If the root journey request fails because credentials are stale/unauthorized, `mobile/app/index.tsx` currently catches and routes to tabs, which can put a logged-out/invalid session user into protected screens.

Task:
Make the mobile root/session flow robust for expired or invalid tokens.

Required behavior:
1. In `mobile/lib/api.ts`, if the final API response is 401 after any refresh attempt, clear stored tokens before throwing.
2. In `mobile/app/index.tsx`, when `/api/mobile/me/journey` fails, check whether an access token still exists after the failure:
   - if no token remains, route to `/(auth)/onboarding`.
   - if a token remains, keep the current resilient fallback to tabs.
3. Preserve the existing journey-stage redirect behavior and splash hiding.

Allowed files to edit only:
- mobile/lib/api.ts
- mobile/app/index.tsx

Do not edit any other file. Do not commit. Do not install packages.

Verification:
- Run `cd mobile && npx tsc --noEmit` and report the actual result.
