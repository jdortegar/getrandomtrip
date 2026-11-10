import sharp from "sharp";
import { parseCopyLocks } from "@/lib/ai/socialBrandPolicy";
import type { Prisma } from "@prisma/client";
import {
  refreshSocialMessage,
  refreshSourceMessage,
} from "./refreshSocialMessage";
import { prisma } from "@/lib/prisma";
import {
  claimSocialRevision,
  enabledJobKinds,
  finishGeneratedSocialRevision,
  SOCIAL_JOB_LEASE_MS,
} from "@/lib/db/socialRevisionJobs";
import { getProfile } from "@/lib/instagram-recap/instagramClient";
import { createSocialApproval } from "@/lib/db/socialApprovals";
import {
  reviseSocialCaption,
  reviseSocialArtwork,
} from "@/lib/ai/socialRevision";
import {
  transcreatePost,
  translateSlideArtwork,
  type Transcreation,
} from "@/lib/ai/socialTranscreation";
import { approvalConfig, slideUrls } from "./slackApproval";
import { postSocialReview } from "./postSocialReview";
import { loadSocialArtwork, saveSocialArtwork } from "./socialAssets";
import {
  socialImportConfig,
  socialSourceConfig,
  socialTargetConfig,
} from "./socialAccounts";
import { announceNextSourcePost } from "./runSourceCheck";
import {
  createMediaContainer,
  getPermalink,
  publishContainer,
  waitForContainer,
} from "./instagramPublish";
import {
  downloadSourceImage,
  getSourceSlides,
  shortcodeOf,
} from "./sourceMedia";

type ClaimedJob = NonNullable<Awaited<ReturnType<typeof claimSocialRevision>>>;
type SlackConfig = NonNullable<ReturnType<typeof approvalConfig>>;
type Checkpoint = (data: {
  generatedCaption?: string;
  generatedImageUrls?: string[];
  transcreation?: Prisma.InputJsonValue;
  /** Set explicitly by fences so the conditional update always writes a field. */
  updatedAt?: Date;
  publishAttemptedAt?: Date;
}) => Promise<void>;

const ERROR_CODES = new Set([
  "STALE_SOURCE",
  "LEASE_LOST",
  "AI_IMAGE_UNCONFIGURED",
  "SLACK_DELIVERY_UNCONFIRMED",
  "SLIDES_INVALID",
  "SOURCE_UNCONFIGURED",
  "SOURCE_VIDEO_UNSUPPORTED",
  "SOURCE_MEDIA_INVALID",
  "AI_TRANSCREATION_INVALID",
  "PUBLISH_DISABLED",
  "TARGET_ACCOUNT_MISMATCH",
  "PUBLISH_FAILED",
  "PUBLISH_UNCONFIRMED",
]);

export async function runSocialRevision() {
  const config = approvalConfig();
  // AI jobs also need the OpenAI key; publishing does not.
  const kinds = enabledJobKinds().filter(
    (kind) => kind === "PUBLISH" || !!process.env.OPENAI_API_KEY,
  );
  if (!config || !kinds.length) return;
  const job = await claimSocialRevision(kinds);
  if (!job?.leaseToken) return;
  const leaseToken = job.leaseToken;
  const where = { id: job.id, status: "RUNNING", leaseToken };
  const checkpoint: Checkpoint = async (data) => {
    const result = await prisma.socialRevisionJob.updateMany({
      where: { ...where, leaseUntil: { gt: new Date() } },
      data: {
        ...data,
        leaseUntil: new Date(Date.now() + SOCIAL_JOB_LEASE_MS),
      },
    });
    if (!result.count) throw new Error("LEASE_LOST");
  };
  try {
    if (job.kind === "TRANSLATE")
      await translateJob(job, config, checkpoint, leaseToken);
    else if (job.kind === "PUBLISH") await publishJob(job, checkpoint);
    else await reviseJob(job, config, checkpoint, leaseToken);
    await prisma.socialRevisionJob.updateMany({
      where,
      data: { status: "COMPLETE", leaseToken: null, leaseUntil: null },
    });
  } catch (error) {
    // Every uncertain paid/delivery attempt requires explicit admin recovery, never blind retries.
    const code =
      error instanceof Error && ERROR_CODES.has(error.message)
        ? error.message
        : "GENERATION_OR_DELIVERY_UNCONFIRMED";
    await prisma.socialRevisionJob.updateMany({
      where,
      data: {
        status: code === "STALE_SOURCE" ? "CANCELLED" : "MANUAL_RECOVERY",
        errorCode: code,
        leaseToken: null,
        leaseUntil: null,
      },
    });
    if (code === "STALE_SOURCE") return;
    if (job.kind === "PUBLISH" && job.review) {
      await prisma.socialApproval.updateMany({
        where: { id: job.review.id, status: "PUBLISHING" },
        data: { status: "PUBLISH_FAILED" },
      });
      await refreshSocialMessage(job.review, "PUBLISH_FAILED");
    } else if (job.kind === "TRANSLATE" && job.source) {
      await prisma.socialSource.updateMany({
        where: { id: job.source.id, status: "TRANSLATION_QUEUED" },
        data: { status: "TRANSLATION_FAILED" },
      });
      await refreshSourceMessage(job.source, "TRANSLATION_FAILED", job.actor);
    } else if (job.review)
      await refreshSocialMessage(job.review, "REVISION_FAILED");
  }
}

async function reviseJob(
  job: ClaimedJob,
  config: SlackConfig,
  checkpoint: Checkpoint,
  leaseToken: string,
) {
  const review = job.review;
  if (!review) throw new Error("STALE_SOURCE");
  const current = await prisma.socialApproval.findUnique({
    where: { id: review.id },
  });
  if (current?.status !== "CHANGES_REQUESTED") throw new Error("STALE_SOURCE");
  if (job.target !== "caption" && !process.env.OPENAI_SOCIAL_IMAGE_MODEL)
    throw new Error("AI_IMAGE_UNCONFIGURED");
  let caption = job.generatedCaption ?? review.caption;
  const slides = [...slideUrls(review)];
  const targets =
    job.target === "caption"
      ? []
      : job.slides.length
        ? job.slides.filter((n) => n <= slides.length).map((n) => n - 1)
        : slides.map((_, index) => index);
  if (job.target !== "caption" && !targets.length)
    throw new Error("SLIDES_INVALID");
  if (!job.generatedCaption && job.target !== "image") {
    caption = await reviseSocialCaption(
      caption,
      job.feedback,
      parseCopyLocks(review.copyLocks),
    );
    await checkpoint({ generatedCaption: caption });
  }
  // generatedImageUrls holds finished targets in order, so a resumed claim
  // continues after the last paid edit instead of repeating it.
  const done = [...job.generatedImageUrls];
  for (const [position, index] of targets.entries()) {
    if (position < done.length) {
      slides[index] = done[position];
      continue;
    }
    const source = await loadSocialArtwork(slides[index]);
    const bytes = await reviseSocialArtwork(
      source.bytes,
      source.type,
      job.feedback,
      parseCopyLocks(review.copyLocks),
    );
    slides[index] = await saveSocialArtwork(job.id, bytes, index + 1);
    done.push(slides[index]);
    await checkpoint({ generatedImageUrls: [...done] });
  }
  const row = await finishGeneratedSocialRevision(
    job.id,
    leaseToken,
    caption,
    slides,
  );
  if (!row) throw new Error("STALE_SOURCE");
  await postSocialReview(config, row);
  await refreshSocialMessage(review, "SUPERSEDED");
}

/**
 * First English draft of a Spanish post: transcreate caption and on-image copy
 * once, edit each slide that has Spanish text, then post one review for all
 * slides. Checkpoints keep a resumed claim from repeating paid calls.
 */
async function translateJob(
  job: ClaimedJob,
  config: SlackConfig,
  checkpoint: Checkpoint,
  leaseToken: string,
) {
  const source = job.source;
  if (!source) throw new Error("STALE_SOURCE");
  const imported = source.accountUsername === "getrandomtrip.en";
  const account = imported ? socialImportConfig() : socialSourceConfig();
  if (!account) throw new Error("SOURCE_UNCONFIGURED");
  if (!process.env.OPENAI_SOCIAL_IMAGE_MODEL)
    throw new Error("AI_IMAGE_UNCONFIGURED");
  if (imported) {
    const profile = await getProfile(account.token);
    if (profile.username !== account.username)
      throw new Error("SOURCE_UNCONFIGURED");
  }
  const locks = parseCopyLocks(source.copyLocks);
  const urls = await getSourceSlides(account.token, source.igMediaId);
  const images = await Promise.all(urls.map(downloadSourceImage));
  let plan = job.transcreation as Transcreation | null;
  let caption = job.generatedCaption;
  if (!plan || !caption || plan.slides?.length !== images.length) {
    const result = Object.keys(locks).length
      ? await transcreatePost(source.caption, images, locks)
      : await transcreatePost(source.caption, images);
    plan = result;
    caption = result.caption;
    await checkpoint({
      generatedCaption: caption,
      transcreation: {
        slides: result.slides.map((s) => ({
          replacements: s.replacements,
          ...(s.lockedHeadline ? { lockedHeadline: s.lockedHeadline } : {}),
        })),
        notes: result.notes,
      },
    });
  }
  const done = [...job.generatedImageUrls];
  for (let index = done.length; index < images.length; index += 1) {
    const image = images[index];
    const copy = plan.slides[index];
    // Slides without Spanish text keep the original, normalized to JPEG.
    const url =
      copy.replacements.length || copy.lockedHeadline
        ? await saveSocialArtwork(
            job.id,
            await translateSlideArtwork(image.bytes, image.type, copy),
            index + 1,
          )
        : await saveSocialArtwork(
            job.id,
            await sharp(image.bytes).jpeg({ quality: 92 }).toBuffer(),
            index + 1,
            "image/jpeg",
          );
    done.push(url);
    await checkpoint({ generatedImageUrls: [...done] });
  }
  // Fence the lease once more before creating the review.
  await checkpoint({ updatedAt: new Date() });
  const { row } = await createSocialApproval({
    reviewKey: `instagram-${shortcodeOf(source.permalink) ?? source.igMediaId}`,
    requestId: `translated-${job.id}`,
    caption: locks.caption ?? caption,
    imageUrl: done[0],
    imageUrls: done,
    ...(imported ? {} : { sourceId: source.id }),
    ...(Object.keys(locks).length
      ? { copyLocks: locks as Prisma.InputJsonValue }
      : {}),
    createdBy: job.actor,
  });
  await prisma.socialRevisionJob.updateMany({
    where: { id: job.id, status: "RUNNING", leaseToken },
    data: { newReviewId: row.id },
  });
  const messageTs = await postSocialReview(config, row);
  if (plan.notes?.length) await postReviewNotes(config, messageTs, plan.notes);
  await prisma.socialSource.updateMany({
    where: { id: source.id, status: "TRANSLATION_QUEUED" },
    data: { status: "TRANSLATED" },
  });
  await refreshSourceMessage(source, "TRANSLATED", job.actor);
}

/** Best effort: reviewer notes as a thread reply under the new review. */
async function postReviewNotes(
  config: SlackConfig,
  threadTs: string,
  notes: string[],
) {
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: config.channel,
        thread_ts: threadTs,
        text: `Review notes from the translation:\n${notes.map((n) => `• ${n}`).join("\n")}`,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.error("[social-approvals] review notes not posted");
  }
}

/**
 * Publishes an approved review on @getrandomtrip.en. Failures before
 * media_publish leave nothing public (PUBLISH_FAILED, safe to retry); any
 * doubt after it is PUBLISH_UNCONFIRMED and is never retried automatically.
 */
async function publishJob(job: ClaimedJob, checkpoint: Checkpoint) {
  const review = job.review;
  if (!review) throw new Error("STALE_SOURCE");
  const target = socialTargetConfig();
  if (!target) throw new Error("PUBLISH_DISABLED");
  const current = await prisma.socialApproval.findUnique({
    where: { id: review.id },
  });
  if (current?.status !== "PUBLISHING") throw new Error("STALE_SOURCE");
  let mediaId = job.publishedMediaId;
  // A previous claim reached media_publish without recording a result.
  if (!mediaId && job.publishAttemptedAt)
    throw new Error("PUBLISH_UNCONFIRMED");
  if (!mediaId) {
    let containerId: string;
    try {
      const profile = await getProfile(target.token);
      if (profile.username !== target.username)
        throw new Error("TARGET_ACCOUNT_MISMATCH");
      // Instagram only accepts public JPEGs, at most 1440px wide.
      const done = [...job.generatedImageUrls];
      const slides = slideUrls(review);
      for (let index = done.length; index < slides.length; index += 1) {
        const slide = await loadSocialArtwork(slides[index]);
        const jpeg = await sharp(slide.bytes)
          .resize({ width: 1440, withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
        done.push(
          await saveSocialArtwork(job.id, jpeg, index + 1, "image/jpeg"),
        );
        await checkpoint({ generatedImageUrls: [...done] });
      }
      await checkpoint({ updatedAt: new Date() });
      containerId = await createMediaContainer(
        target.token,
        profile.userId,
        done,
        review.caption,
      );
      await waitForContainer(target.token, containerId);
      // Fence the lease and record the attempt right before the irreversible
      // call; from here on the job is never retried.
      await checkpoint({
        updatedAt: new Date(),
        publishAttemptedAt: new Date(),
      });
      try {
        mediaId = await publishContainer(
          target.token,
          profile.userId,
          containerId,
        );
      } catch {
        throw new Error("PUBLISH_UNCONFIRMED");
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      throw new Error(
        [
          "TARGET_ACCOUNT_MISMATCH",
          "LEASE_LOST",
          "PUBLISH_UNCONFIRMED",
        ].includes(code)
          ? code
          : "PUBLISH_FAILED",
      );
    }
    // Recorded without the lease condition: the post is already public.
    await prisma.socialRevisionJob.update({
      where: { id: job.id },
      data: { publishedMediaId: mediaId },
    });
  }
  const permalink = await getPermalink(target.token, mediaId).catch(() => null);
  await prisma.socialRevisionJob.update({
    where: { id: job.id },
    data: { publishedPermalink: permalink },
  });
  await prisma.socialApproval.update({
    where: { id: review.id },
    data: { status: "PUBLISHED" },
  });
  await refreshSocialMessage(review, "PUBLISHED", { permalink });
  if (review.sourceId) {
    const source = await prisma.socialSource.update({
      where: { id: review.sourceId },
      data: { status: "PUBLISHED" },
    });
    await refreshSourceMessage(source, "PUBLISHED");
  }
  // Keep the mirror moving: offer the next Spanish post in order.
  await announceNextSourcePost();
}
