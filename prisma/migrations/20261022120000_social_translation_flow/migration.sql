-- Multi-slide reviews, Spanish source posts and TRANSLATE/REVISE/PUBLISH job kinds.
-- Additive only: existing reviews keep imageUrl; empty imageUrls falls back to it in code.
-- AlterTable
ALTER TABLE "social_approvals" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sourceId" TEXT;
-- AlterTable
ALTER TABLE "social_revision_jobs" ADD COLUMN     "generatedImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'REVISE',
ADD COLUMN     "publishedMediaId" TEXT,
ADD COLUMN     "publishedPermalink" TEXT,
ADD COLUMN     "slides" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "sourceId" TEXT,
ALTER COLUMN "reviewId" DROP NOT NULL;
-- CreateTable
CREATE TABLE "social_sources" (
    "id" TEXT NOT NULL,
    "igMediaId" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ANNOUNCING',
    "messageTs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_sources_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "social_sources_igMediaId_key" ON "social_sources"("igMediaId");
-- CreateIndex
CREATE UNIQUE INDEX "social_revision_jobs_sourceId_key" ON "social_revision_jobs"("sourceId");
-- AddForeignKey
ALTER TABLE "social_approvals" ADD CONSTRAINT "social_approvals_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "social_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "social_revision_jobs" ADD CONSTRAINT "social_revision_jobs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "social_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
