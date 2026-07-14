# Premium Tutoring Production Readiness Next Steps

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** close the remaining gaps in the student-payment → manager assignment → teacher match → first lesson → homework reuse flow, then make the current implementation safe for production rollout.

**Architecture:** Keep the current flow structure and make only targeted additions. First, harden payment completion so web/mobile use the same verified server-side path and remain idempotent. Second, improve homework reuse UX without introducing a new persistence model unless we can prove it is needed. Third, run a production-parity smoke test and fix only what blocks deploy parity.

**Tech Stack:** Next.js App Router, Prisma, React/TypeScript, existing mobile app screens, existing teacher portal components, local dev server smoke tests.

---

## Task 1: Harden payment completion into a real server-verified flow

**Objective:** make payment completion safe to run more than once and ensure both web and mobile use the same verified path.

**Files likely to change:**
- Modify: `src/lib/student-payment.ts`
- Modify: `src/app/api/payments/complete/route.ts`
- Modify: `src/app/api/mobile/payments/complete/route.ts`
- Modify: `mobile/app/checkout.tsx`
- Optional: `src/lib/payment-verify.ts` if we need a dedicated helper

**Step 1: Define the contract**
- A completed payment must always:
  - create or update exactly one active subscription for the student
  - assign the student to `chief_manager`
  - return the normalized plan and subscription status
- Repeated requests with the same `orderId` must not create duplicate subscriptions or duplicate assignments.

**Step 2: Implement idempotency checks**
- Use a lookup by `orderId` or a stable payment reference before creating new records.
- If the provider confirmation is not available yet, keep the existing completion path but isolate it behind a single helper so the real confirm call can be inserted without changing the routes again.

**Step 3: Wire both routes to the same helper**
- Ensure `src/app/api/payments/complete/route.ts` and `src/app/api/mobile/payments/complete/route.ts` call the same shared function.
- Return the same response shape from both routes as much as possible.

**Step 4: Update mobile checkout behavior**
- Keep the current UX, but make sure the screen handles the verified completion response and shows the true subscription result rather than only a success redirect.

**Verification:**
- `npm run lint`
- `npx tsc --noEmit`
- `npx next build`
- Ad-hoc smoke test: hit both payment-complete endpoints once and again with the same payload; confirm no duplicate subscription/assignment is created.

---

## Task 2: Decide whether homework reuse needs persistence or stays UX-only

**Objective:** validate whether the new “지난 주 숙제 불러오기” button is enough or whether a reusable template model is actually needed.

**Files likely to change:**
- Modify: `src/components/teacher-portal/TeacherStudentPlanTab.tsx`
- Modify: `src/app/api/teacher/students/[id]/plans/route.ts`
- Optional create: `src/lib/homework-template.ts`
- Optional create: Prisma migration/model only if we confirm persistence is required

**Step 1: Keep the current lightweight UX if it is sufficient**
- The current behavior already rehydrates last week’s tasks into the textarea.
- Validate whether teachers need a real saved template or just quick reuse.

**Step 2: If persistence is needed, model the minimum viable template**
- Persist only the template source date, task list, and optional repeat settings.
- Avoid a large generic templating system.

**Step 3: Make the UI reflect the actual state**
- If the template is ephemeral, rename labels so they describe “불러오기/복사” rather than “저장된 템플릿”.
- If persistence is added, show the saved template source clearly.

**Verification:**
- `npm run lint`
- `npx tsc --noEmit`
- Manual teacher-portal smoke test:
  - create a plan
  - click “지난 주 숙제 불러오기”
  - confirm textarea is populated
  - run auto-distribution and confirm generated dates/tasks are correct

---

## Task 3: Production parity smoke test on the deployed app

**Objective:** make sure the deployed Vercel app matches the local flow we verified.

**Files likely to change:**
- Only if deploy parity reveals a bug
- Otherwise none; this is a verification and fix loop

**Step 1: Compare deployed vs local behavior**
- Check the deployed site for:
  - student registration/apply
  - manager assignment state
  - student match acceptance
  - first lesson scheduling
  - homework distribution/reuse
  - payment completion

**Step 2: Fix only the production-only mismatch**
- Typical causes to look for:
  - missing route deployment
  - stale build artifacts
  - environment variable mismatch
  - auth/cookie scope mismatch
  - response shape mismatch between web and mobile

**Step 3: Re-run the smallest possible smoke test**
- Confirm the exact path that failed now passes.

**Verification:**
- `npm run lint`
- `npx tsc --noEmit`
- `npx next build`
- Production smoke test against `https://tutormatch-web.vercel.app/`

---

## Recommended execution order

1. Finish payment hardening first.
2. Keep homework reuse UX-only unless persistence is clearly needed.
3. Deploy parity smoke test last, because it will tell us which gaps are still real in production.

## Risks and tradeoffs

- Adding a real payment-confirmation step may require provider-specific env vars and payload fields.
- A persistence model for homework templates may be unnecessary if teachers only need quick reuse.
- Production parity may surface stale deployment or environment problems that do not exist locally.

## Done when

- Payment completion is idempotent and uses one shared path.
- Homework reuse is either clearly UX-only or minimally persisted with a justified model.
- The deployed app matches the verified local student → manager → teacher → first lesson → homework flow.
- `npm run lint`, `npx tsc --noEmit`, and `npx next build` all pass after the chosen changes.
