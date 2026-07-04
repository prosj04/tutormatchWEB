-- ─────────────────────────────────────────────────────────────────────────────
-- SatisfactionCheckin hard dedup: enforce one check-in per (studentId, trigger).
--
-- Rationale: check-in creation in run-alert-checks.ts dedups in application code
-- via `satisfactionCheckins: { none: {} }`, but concurrent cron passes could race
-- and double-insert. This unique index makes the invariant DB-enforced; the
-- creation path now catches P2002 and skips gracefully.
--
-- Safety: we first collapse any pre-existing duplicates (keep the earliest
-- requestedAt per group) so the CREATE UNIQUE INDEX cannot fail on legacy data.
-- Under normal operation there should be zero duplicates, making the DELETE a
-- no-op.
-- ─────────────────────────────────────────────────────────────────────────────

-- Collapse duplicates, keeping the earliest requested row per (studentId, trigger).
DELETE FROM "SatisfactionCheckin" a
USING "SatisfactionCheckin" b
WHERE a."studentId" = b."studentId"
  AND a."trigger" = b."trigger"
  AND (
    a."requestedAt" > b."requestedAt"
    OR (a."requestedAt" = b."requestedAt" AND a."id" > b."id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionCheckin_studentId_trigger_key" ON "SatisfactionCheckin"("studentId", "trigger");
