-- Additive only. Apply through the approved deployment database workflow before code rollout.
-- Email campaigns: marketing contacts (waitlist + friends & family), campaigns, per-recipient
-- sends and Resend webhook events. payments.promoCode / stripePromotionCodeId attribute a
-- settled payment to the Stripe promotion code a campaign distributed; payments.promoDiscountUsd
-- keeps the discount it granted (major USD units) for campaign metrics.
-- Idempotent: every statement is guarded so a partial or repeated apply is safe.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$ BEGIN
  CREATE TYPE "ContactSource" AS ENUM ('WAITLIST', 'FRIENDS_FAMILY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContactStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignSendStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailEventType" AS ENUM ('DELIVERED', 'BOUNCED', 'COMPLAINED', 'OPENED', 'CLICKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "promoCode" TEXT,
  ADD COLUMN IF NOT EXISTS "stripePromotionCodeId" TEXT,
  ADD COLUMN IF NOT EXISTS "promoDiscountUsd" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "payments_stripePromotionCodeId_idx"
  ON "payments"("stripePromotionCodeId");

-- Emails are stored lowercase by the application; the unique index is the dedupe key.
CREATE TABLE IF NOT EXISTS "contacts" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "source" "ContactSource" NOT NULL,
  "status" "ContactStatus" NOT NULL DEFAULT 'SUBSCRIBED',
  "locale" TEXT NOT NULL DEFAULT 'es',
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "userId" TEXT,
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contacts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_email_key" ON "contacts"("email");
CREATE INDEX IF NOT EXISTS "contacts_source_status_idx" ON "contacts"("source", "status");

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "preheader" TEXT,
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT NOT NULL,
  "ctaLabel" TEXT,
  "ctaUrl" TEXT,
  "locale" TEXT NOT NULL,
  "segmentSources" "ContactSource"[],
  "stripePromotionCodeId" TEXT,
  "promoCode" TEXT,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "campaigns_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- One row per (campaign, contact) makes sending idempotent; retries only resend failed rows.
CREATE TABLE IF NOT EXISTS "campaign_sends" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "resendMessageId" TEXT,
  "status" "CampaignSendStatus" NOT NULL DEFAULT 'QUEUED',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_sends_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "campaign_sends_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "campaign_sends_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_sends_resendMessageId_key"
  ON "campaign_sends"("resendMessageId");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_sends_campaignId_contactId_key"
  ON "campaign_sends"("campaignId", "contactId");

-- providerEventId is unique so redelivered webhooks are recorded once.
CREATE TABLE IF NOT EXISTS "email_events" (
  "id" TEXT NOT NULL,
  "sendId" TEXT NOT NULL,
  "type" "EmailEventType" NOT NULL,
  "metadata" JSONB,
  "providerEventId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_events_sendId_fkey"
    FOREIGN KEY ("sendId") REFERENCES "campaign_sends"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "email_events_providerEventId_key"
  ON "email_events"("providerEventId");
CREATE INDEX IF NOT EXISTS "email_events_sendId_type_idx"
  ON "email_events"("sendId", "type");

COMMIT;
