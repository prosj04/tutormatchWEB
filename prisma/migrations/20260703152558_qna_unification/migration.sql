-- ─────────────────────────────────────────────────────────────────────────────
-- QnA unification: extend QuestionMessage to be the single message store and
-- backfill from the (now deprecated) Question table.
--
-- Design:
--   • Root student message: sender="me", replyToId IS NULL, date=<YYYY-MM-DD>.
--   • AI/teacher reply:     sender="ai"|"tutor", replyToId=<root id>.
--   • Backfill reuses Question.id as the root QuestionMessage.id so any
--     existing references (Notification.relatedId, etc.) keep working, and
--     no id-mapping table is required.
--
-- Non-destructive: no DROP/RENAME. The Question table remains as a legacy read
-- source and rollback safety net; it is marked /// DEPRECATED in schema.prisma
-- and will be removed by a follow-up cleanup migration once verified in prod.
-- ─────────────────────────────────────────────────────────────────────────────

-- AlterTable
ALTER TABLE "QuestionMessage" ADD COLUMN     "date" TEXT,
ADD COLUMN     "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyToId" TEXT;

-- CreateIndex
CREATE INDEX "QuestionMessage_studentId_date_idx" ON "QuestionMessage"("studentId", "date");

-- CreateIndex
CREATE INDEX "QuestionMessage_replyToId_idx" ON "QuestionMessage"("replyToId");

-- CreateIndex
CREATE INDEX "QuestionMessage_studentId_replyToId_idx" ON "QuestionMessage"("studentId", "replyToId");

-- CreateIndex
CREATE INDEX "QuestionMessage_isResolved_idx" ON "QuestionMessage"("isResolved");

-- AddForeignKey
ALTER TABLE "QuestionMessage" ADD CONSTRAINT "QuestionMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "QuestionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill from Question → QuestionMessage.
--
-- Guard: skip rows already migrated (INSERT ... ON CONFLICT DO NOTHING against
-- QuestionMessage.id primary key). Safe to run repeatedly.
--
-- teacherId resolution for the student's root message:
--   1. Question.answeredBy if present.
--   2. Otherwise the student's active TeacherStudent (any active match).
--   3. Otherwise NULL (orphan — only visible in web card view, not per-tutor chat).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Student root messages. Reuse Question.id so replies can point at it.
INSERT INTO "QuestionMessage" (
    "id", "studentId", "teacherId", "sender", "body", "imageUrl",
    "tokenCost", "date", "isResolved", "replyToId", "createdAt"
)
SELECT
    q."id",
    q."studentId",
    COALESCE(
        q."answeredBy",
        (
            SELECT ts."teacherId"
            FROM "TeacherStudent" ts
            WHERE ts."studentId" = q."studentId" AND ts."isActive" = TRUE
            ORDER BY ts."createdAt" ASC
            LIMIT 1
        )
    ) AS "teacherId",
    'me'         AS "sender",
    q."content"  AS "body",
    q."imageUrl",
    0            AS "tokenCost",
    q."date",
    q."isResolved",
    NULL         AS "replyToId",
    q."createdAt"
FROM "Question" q
ON CONFLICT ("id") DO NOTHING;

-- 2) AI reply messages. Created 1ms after the root to preserve chat order.
INSERT INTO "QuestionMessage" (
    "id", "studentId", "teacherId", "sender", "body", "imageUrl",
    "tokenCost", "date", "isResolved", "replyToId", "createdAt"
)
SELECT
    gen_random_uuid()::text AS "id",
    q."studentId",
    NULL         AS "teacherId",
    'ai'         AS "sender",
    q."aiAnswer" AS "body",
    NULL         AS "imageUrl",
    0            AS "tokenCost",
    NULL         AS "date",
    FALSE        AS "isResolved",
    q."id"       AS "replyToId",
    q."createdAt" + INTERVAL '1 millisecond' AS "createdAt"
FROM "Question" q
WHERE q."aiAnswer" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "QuestionMessage" qm
      WHERE qm."replyToId" = q."id" AND qm."sender" = 'ai'
  );

-- 3) Teacher reply messages. Use teacherAnswerAt when present, else 2ms after root.
INSERT INTO "QuestionMessage" (
    "id", "studentId", "teacherId", "sender", "body", "imageUrl",
    "tokenCost", "date", "isResolved", "replyToId", "createdAt"
)
SELECT
    gen_random_uuid()::text AS "id",
    q."studentId",
    q."answeredBy"      AS "teacherId",
    'tutor'             AS "sender",
    q."teacherAnswer"   AS "body",
    NULL                AS "imageUrl",
    0                   AS "tokenCost",
    NULL                AS "date",
    FALSE               AS "isResolved",
    q."id"              AS "replyToId",
    COALESCE(q."teacherAnswerAt", q."createdAt" + INTERVAL '2 milliseconds') AS "createdAt"
FROM "Question" q
WHERE q."teacherAnswer" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "QuestionMessage" qm
      WHERE qm."replyToId" = q."id" AND qm."sender" = 'tutor'
  );
