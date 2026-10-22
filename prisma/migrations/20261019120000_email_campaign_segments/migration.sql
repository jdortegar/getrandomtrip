-- Additive only. Apply through the approved deployment database workflow before code rollout.
-- Email campaign segments: admin-managed contact groups (many-to-many with contacts) that
-- campaigns target. The two system segments mirror ContactSource and are seeded here with
-- fixed ids (the app references them by id); current contacts and campaign targets are
-- backfilled from contacts.source and campaigns."segmentSources", which stays as a
-- deprecated column until a later contract migration.
-- Idempotent: every statement is guarded so a partial or repeated apply is safe. A repeated
-- apply re-adds system memberships derived from contacts.source.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- Names are unique case-insensitively in the application; the index is the exact-match guard.
CREATE TABLE IF NOT EXISTS "segments" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "systemKey" "ContactSource",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "segments_name_key" ON "segments"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "segments_systemKey_key" ON "segments"("systemKey");

CREATE TABLE IF NOT EXISTS "contact_segments" (
  "contactId" TEXT NOT NULL,
  "segmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_segments_pkey" PRIMARY KEY ("contactId", "segmentId"),
  CONSTRAINT "contact_segments_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contact_segments_segmentId_fkey"
    FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "contact_segments_segmentId_idx" ON "contact_segments"("segmentId");

-- RESTRICT: a segment targeted by any campaign cannot be deleted.
CREATE TABLE IF NOT EXISTS "campaign_segments" (
  "campaignId" TEXT NOT NULL,
  "segmentId" TEXT NOT NULL,
  CONSTRAINT "campaign_segments_pkey" PRIMARY KEY ("campaignId", "segmentId"),
  CONSTRAINT "campaign_segments_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "campaign_segments_segmentId_fkey"
    FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- System segments. Ids must match SYSTEM_SEGMENT_IDS in src/lib/email-campaigns/segmentRules.ts.
-- A renamed system segment keeps its name on a repeated apply.
INSERT INTO "segments" ("id", "name", "systemKey", "updatedAt")
VALUES
  ('seg_waitlist', 'Lista de espera', 'WAITLIST', CURRENT_TIMESTAMP),
  ('seg_friends_family', 'Amigos y familia', 'FRIENDS_FAMILY', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "contact_segments" ("contactId", "segmentId")
SELECT "contacts"."id", "segments"."id"
FROM "contacts"
JOIN "segments" ON "segments"."systemKey" = "contacts"."source"
ON CONFLICT DO NOTHING;

INSERT INTO "campaign_segments" ("campaignId", "segmentId")
SELECT "campaigns"."id", "segments"."id"
FROM "campaigns"
JOIN "segments" ON "segments"."systemKey" = ANY("campaigns"."segmentSources")
ON CONFLICT DO NOTHING;

COMMIT;
