-- Test-only review state and durable AI revision work. No publication integration.
CREATE TABLE "social_approvals" (
  "id" TEXT NOT NULL, "reviewKey" TEXT NOT NULL, "revision" INTEGER NOT NULL,
  "requestId" TEXT NOT NULL, "caption" TEXT NOT NULL, "imageUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'POSTING', "messageTs" TEXT,
  "decidedBy" TEXT, "decidedAt" TIMESTAMP(3), "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "decision" TEXT,
  CONSTRAINT "social_approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "social_approvals_requestId_key" ON "social_approvals"("requestId");
CREATE UNIQUE INDEX "social_approvals_reviewKey_revision_key" ON "social_approvals"("reviewKey", "revision");
CREATE TABLE "social_revision_jobs" (
  "id" TEXT NOT NULL, "reviewId" TEXT NOT NULL, "actor" TEXT NOT NULL,
  "feedback" TEXT NOT NULL, "target" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "leaseToken" TEXT, "leaseUntil" TIMESTAMP(3), "attempts" INTEGER NOT NULL DEFAULT 0,
  "generatedCaption" TEXT, "generatedImageUrl" TEXT, "newReviewId" TEXT, "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "social_revision_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "social_revision_jobs_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "social_approvals"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "social_revision_jobs_reviewId_key" ON "social_revision_jobs"("reviewId");
CREATE INDEX "social_revision_jobs_status_createdAt_idx" ON "social_revision_jobs"("status", "createdAt");
