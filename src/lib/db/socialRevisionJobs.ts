import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lockSocialApproval } from "./socialApprovals";
import type { SocialFeedback } from "@/lib/social-approvals/feedbackModal";

/** Accepted paid AI jobs (translations and revisions) per UTC day. */
export const DAILY_AI_JOBS = 10;

/** Call while holding the "daily-ai-budget" lock. */
async function dailyBudgetLeft(tx: Prisma.TransactionClient) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  return (
    (await tx.socialRevisionJob.count({
      where: { createdAt: { gte: since }, kind: { not: "PUBLISH" } },
    })) < DAILY_AI_JOBS
  );
}

export async function queueSocialRevision(input: SocialFeedback) {
  return prisma.$transaction(
    async (tx) => {
      const source = await tx.socialApproval.findUnique({
        where: { id: input.id },
      });
      if (!source || source.messageTs !== input.messageTs) return "stale";
      await lockSocialApproval(tx, source.reviewKey);
      await lockSocialApproval(tx, "daily-ai-budget");
      const row = await tx.socialApproval.findUnique({
        where: { id: input.id },
      });
      const existing = await tx.socialRevisionJob.findUnique({
        where: { reviewId: input.id },
      });
      if (existing) return "queued"; // Retry cannot create another paid job.
      if (!row || row.status !== "PENDING" || row.revision >= 5) return "stale";
      if (!(await dailyBudgetLeft(tx))) return "budget";
      await tx.socialApproval.update({
        where: { id: row.id },
        data: {
          status: "CHANGES_REQUESTED",
          decision: "CHANGES_REQUESTED",
          decidedBy: input.user,
          decidedAt: new Date(),
        },
      });
      await tx.socialRevisionJob.create({
        data: {
          reviewId: row.id,
          actor: input.user,
          feedback: input.feedback,
          target: input.target,
          slides: input.slides,
        },
      });
      return "queued";
    },
    { maxWait: 500, timeout: 1500 },
  );
}

/**
 * Queues the first translation of an announced Spanish post. One TRANSLATE job
 * per source: repeated clicks replay "queued" without another paid job.
 */
export async function queueSocialTranslation(input: {
  sourceId: string;
  user: string;
  messageTs: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockSocialApproval(tx, `source:${input.sourceId}`);
      await lockSocialApproval(tx, "daily-ai-budget");
      const source = await tx.socialSource.findUnique({
        where: { id: input.sourceId },
      });
      if (!source || source.messageTs !== input.messageTs) return "stale";
      if (
        await tx.socialRevisionJob.findUnique({
          where: { sourceId: source.id },
        })
      )
        return "queued";
      if (source.status !== "ANNOUNCED") return "stale";
      if (!(await dailyBudgetLeft(tx))) return "budget";
      await tx.socialSource.update({
        where: { id: source.id },
        data: { status: "TRANSLATION_QUEUED" },
      });
      await tx.socialRevisionJob.create({
        data: {
          kind: "TRANSLATE",
          sourceId: source.id,
          actor: input.user,
          feedback: "",
          target: "both",
        },
      });
      return "queued";
    },
    { maxWait: 500, timeout: 1500 },
  );
}

export async function claimSocialRevision() {
  return prisma.$transaction(async (tx) => {
    // Crashed/expired paid work is not replayed automatically: avoid duplicate spend.
    await tx.socialRevisionJob.updateMany({
      where: { status: "RUNNING", leaseUntil: { lt: new Date() } },
      data: { status: "MANUAL_RECOVERY", errorCode: "LEASE_EXPIRED" },
    });
    const candidate = await tx.socialRevisionJob.findFirst({
      where: { status: "QUEUED", attempts: { lt: 2 } },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const leaseToken = randomUUID();
    const result = await tx.socialRevisionJob.updateMany({
      where: { id: candidate.id, status: "QUEUED" },
      data: {
        status: "RUNNING",
        leaseToken,
        leaseUntil: new Date(Date.now() + 10 * 60_000),
        attempts: { increment: 1 },
      },
    });
    if (!result.count) return null;
    return tx.socialRevisionJob.findUnique({
      where: { id: candidate.id },
      include: { review: true, source: true },
    });
  });
}

export async function finishGeneratedSocialRevision(
  jobId: string,
  leaseToken: string,
  caption: string,
  imageUrls: string[],
) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.socialRevisionJob.findUnique({
      where: { id: jobId },
      include: { review: true },
    });
    if (
      !job?.review ||
      job.status !== "RUNNING" ||
      job.leaseToken !== leaseToken ||
      !imageUrls.length
    )
      return null;
    await lockSocialApproval(tx, job.review.reviewKey);
    // Fence after the potentially blocking source lock. Conditional UPDATE also
    // holds the job row lock through commit, excluding recovery/reclaim races.
    const owned = await tx.socialRevisionJob.updateMany({
      where: {
        id: job.id,
        status: "RUNNING",
        leaseToken,
        leaseUntil: { gt: new Date() },
      },
      data: { generatedCaption: caption, generatedImageUrls: imageUrls },
    });
    if (!owned.count) return null;
    const source = await tx.socialApproval.findUnique({
      where: { id: job.review.id },
    });
    if (source?.status !== "CHANGES_REQUESTED") return null;
    await tx.socialApproval.update({
      where: { id: source.id },
      data: { status: "SUPERSEDED" },
    });
    const row = await tx.socialApproval.create({
      data: {
        reviewKey: source.reviewKey,
        revision: source.revision + 1,
        requestId: `generated-${job.id}`,
        caption,
        imageUrl: imageUrls[0],
        imageUrls,
        sourceId: source.sourceId,
        createdBy: source.createdBy,
      },
    });
    await tx.socialRevisionJob.update({
      where: { id: job.id },
      data: { newReviewId: row.id },
    });
    return row;
  });
}
