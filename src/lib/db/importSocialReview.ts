import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lockSocialApproval } from "./socialApprovals";
import { dailyBudgetLeft } from "./socialRevisionJobs";
import type { resolveOwnedInstagramPost } from "@/lib/social-approvals/importInstagram";
import {
  parseCopyLocks,
  type SocialCopyLocks,
} from "@/lib/ai/socialBrandPolicy";
export async function importSocialReview(
  media: Awaited<ReturnType<typeof resolveOwnedInstagramPost>>,
  actor: string,
  locks: SocialCopyLocks,
) {
  return prisma.$transaction(async (tx) => {
    await lockSocialApproval(tx, `import:${media.id}`);
    await lockSocialApproval(tx, "daily-ai-budget");
    const previous = await tx.socialSource.findUnique({
      where: { igMediaId: media.id },
      include: { job: true },
    });
    if (previous) {
      const previousLocks = parseCopyLocks(previous.copyLocks);
      if (
        previous.accountUsername !== media.accountUsername ||
        previousLocks.caption !== locks.caption ||
        previousLocks.artworkHeadline !== locks.artworkHeadline
      )
        throw new Error("IMPORT_ASSIGNMENT_CONFLICT");
      if (!previous.job) throw new Error("IMPORT_ASSIGNMENT_CONFLICT");
      return { sourceId: previous.id, jobId: previous.job.id, created: false };
    }
    if (!(await dailyBudgetLeft(tx))) throw new Error("IMPORT_DAILY_LIMIT");
    const source = await tx.socialSource.create({
      data: {
        igMediaId: media.id,
        permalink: media.permalink,
        caption: media.caption,
        mediaType: media.mediaType,
        postedAt: media.postedAt,
        status: "TRANSLATION_QUEUED",
        accountUsername: media.accountUsername,
        copyLocks: locks as Prisma.InputJsonValue,
      },
    });
    const job = await tx.socialRevisionJob.create({
      data: {
        kind: "TRANSLATE",
        sourceId: source.id,
        actor,
        feedback: "",
        target: "both",
      },
    });
    return { sourceId: source.id, jobId: job.id, created: true };
  });
}
