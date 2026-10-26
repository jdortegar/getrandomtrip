import { parseCopyLocks } from "@/lib/ai/socialBrandPolicy";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  slideUrls,
  type ApprovalAction,
} from "@/lib/social-approvals/slackApproval";

interface NewApproval {
  reviewKey: string;
  requestId: string;
  caption: string;
  imageUrl: string;
  /** Every slide in order; imageUrl must equal the first entry when present. */
  imageUrls?: string[];
  sourceId?: string;
  copyLocks?: Prisma.InputJsonValue;
  createdBy: string;
}

// A shared database lock serializes revisions and decisions across instances.
export async function lockSocialApproval(
  tx: Prisma.TransactionClient,
  key: string,
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`social-approval:${key}`}, 0))::text`;
}

export async function createSocialApproval(input: NewApproval) {
  return prisma.$transaction(async (tx) => {
    await lockSocialApproval(tx, input.reviewKey);
    const existing = await tx.socialApproval.findUnique({
      where: { requestId: input.requestId },
    });
    if (existing) {
      const oldLocks = parseCopyLocks(existing.copyLocks);
      const newLocks = parseCopyLocks(input.copyLocks);
      if (
        oldLocks.caption !== newLocks.caption ||
        oldLocks.artworkHeadline !== newLocks.artworkHeadline ||
        existing.reviewKey !== input.reviewKey ||
        existing.caption !== input.caption ||
        existing.imageUrl !== input.imageUrl ||
        slideUrls(existing).join("\n") !== slideUrls(input).join("\n")
      )
        throw new Error("REQUEST_ID_CONFLICT");
      return { row: existing, created: false };
    }
    const latest = await tx.socialApproval.findFirst({
      where: { reviewKey: input.reviewKey },
      orderBy: { revision: "desc" },
    });
    await tx.socialApproval.updateMany({
      where: { reviewKey: input.reviewKey },
      data: { status: "SUPERSEDED" },
    });
    return {
      row: await tx.socialApproval.create({
        data: { ...input, revision: (latest?.revision ?? 0) + 1 },
      }),
      created: true,
    };
  });
}

export async function decideSocialApproval(action: ApprovalAction) {
  return prisma.$transaction(
    async (tx) => {
      const ref = await tx.socialApproval.findUnique({
        where: { id: action.id },
      });
      if (!ref) return null;
      await lockSocialApproval(tx, ref.reviewKey);
      const row = await tx.socialApproval.findUnique({
        where: { id: action.id },
      });
      if (
        !row ||
        row.messageTs !== action.messageTs ||
        !["PENDING", "APPROVED", "CHANGES_REQUESTED"].includes(row.status)
      )
        return null;
      // First decision wins. Duplicate or competing clicks replay authoritative state.
      if (row.status !== "PENDING") return row;
      return tx.socialApproval.update({
        where: { id: row.id },
        data: {
          status: action.status,
          decision: action.status,
          decidedBy: action.user,
          decidedAt: new Date(),
        },
      });
    },
    { maxWait: 500, timeout: 1500 },
  );
}

export async function recordSocialMessage(id: string, messageTs: string) {
  // A newer revision may have superseded this review while Slack was posting.
  await prisma.socialApproval.updateMany({
    where: { id, status: "POSTING" },
    data: { messageTs, status: "PENDING" },
  });
}
