import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
