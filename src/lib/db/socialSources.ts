import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lockSocialApproval } from "./socialApprovals";
import type { SourceMedia } from "@/lib/social-approvals/sourceMedia";

/**
 * Records a Spanish post the first time it is seen. Returns null when it was
 * already recorded, so a post is announced in Slack at most once.
 */
export async function recordNewSource(media: SourceMedia) {
  try {
    return await prisma.socialSource.create({
      data: {
        igMediaId: media.id,
        permalink: media.permalink,
        caption: media.caption,
        mediaType: media.mediaType,
        postedAt: media.postedAt,
        status: media.mediaType === "VIDEO" ? "UNSUPPORTED" : "ANNOUNCING",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return null;
    throw error;
  }
}

export async function recordSourceMessage(id: string, messageTs: string) {
  await prisma.socialSource.update({ where: { id }, data: { messageTs } });
  await prisma.socialSource.updateMany({
    where: { id, status: "ANNOUNCING" },
    data: { status: "ANNOUNCED" },
  });
}

/** A source is mirrored once published by the app or marked as posted manually. */
export const MIRRORED_STATUSES = ["PUBLISHED", "SYNCED"];

export async function listSourceRows() {
  return prisma.socialSource.findMany({
    where: { accountUsername: "getrandomtrip.es" },
    select: {
      id: true,
      igMediaId: true,
      status: true,
      postedAt: true,
      caption: true,
      permalink: true,
      mediaType: true,
      messageTs: true,
      createdAt: true,
    },
  });
}

/** Records posts already on @getrandomtrip.en (the sync starting point). */
export async function markSyncedThrough(media: SourceMedia[]) {
  const result = await prisma.socialSource.createMany({
    data: media.map((m) => ({
      igMediaId: m.id,
      permalink: m.permalink,
      caption: m.caption,
      mediaType: m.mediaType,
      postedAt: m.postedAt,
      status: "SYNCED",
    })),
    skipDuplicates: true,
  });
  return result.count;
}

/**
 * "Mark as posted manually": the post is already on @getrandomtrip.en, so the
 * queue may move on. Not allowed while the app itself is publishing it.
 */
export async function markSourcePosted(input: {
  sourceId: string;
  messageTs: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      // Same lock as queueSocialPublish: never mark while the app publishes it.
      await lockSocialApproval(tx, `source:${input.sourceId}`);
      const source = await tx.socialSource.findUnique({
        where: { id: input.sourceId },
      });
      if (
        !source ||
        source.messageTs !== input.messageTs ||
        !MARKABLE.includes(source.status) ||
        (await tx.socialApproval.count({
          where: {
            sourceId: source.id,
            status: { in: ["PUBLISHING", "PUBLISHED", "PUBLISH_FAILED"] },
          },
        }))
      )
        return null;
      return tx.socialSource.update({
        where: { id: source.id },
        data: { status: "SYNCED" },
      });
    },
    { maxWait: 500, timeout: 1500 },
  );
}

const MARKABLE = [
  "ANNOUNCED",
  "UNSUPPORTED",
  "TRANSLATION_FAILED",
  "TRANSLATED",
];
