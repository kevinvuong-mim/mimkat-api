-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Backfill group admins (earliest joined participant per group)
UPDATE "conversation_participants" cp
SET "isAdmin" = true
FROM (
  SELECT DISTINCT ON (cp2."conversationId") cp2.id
  FROM "conversation_participants" cp2
  INNER JOIN "conversations" c ON c.id = cp2."conversationId"
  WHERE c.type = 'GROUP'
  ORDER BY cp2."conversationId", cp2."joinedAt" ASC
) earliest
WHERE cp.id = earliest.id;
