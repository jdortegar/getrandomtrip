import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import {
  refreshSocialMessage,
  refreshSourceMessage,
} from "./refreshSocialMessage";
import { prisma } from "@/lib/prisma";
import {
  claimSocialRevision,
  finishGeneratedSocialRevision,
} from "@/lib/db/socialRevisionJobs";
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
import { socialSourceConfig } from "./socialAccounts";
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
]);

export async function runSocialRevision() {
  const config = approvalConfig();
  if (
    !config ||
    process.env.SLACK_SOCIAL_AI_ENABLED !== "true" ||
    !process.env.OPENAI_API_KEY
  )
    return;
  const job = await claimSocialRevision();
  if (!job?.leaseToken) return;
  const leaseToken = job.leaseToken;
  const where = { id: job.id, status: "RUNNING", leaseToken };
  const checkpoint: Checkpoint = async (data) => {
    const result = await prisma.socialRevisionJob.updateMany({
      where: { ...where, leaseUntil: { gt: new Date() } },
      data,
    });
    if (!result.count) throw new Error("LEASE_LOST");
  };
  try {
    if (job.kind === "TRANSLATE")
      await translateJob(job, config, checkpoint, leaseToken);
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
    if (job.kind === "TRANSLATE" && job.source) {
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
    caption = await reviseSocialCaption(caption, job.feedback);
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
  const account = socialSourceConfig();
  if (!account) throw new Error("SOURCE_UNCONFIGURED");
  if (!process.env.OPENAI_SOCIAL_IMAGE_MODEL)
    throw new Error("AI_IMAGE_UNCONFIGURED");
  const urls = await getSourceSlides(account.token, source.igMediaId);
  const images = await Promise.all(urls.map(downloadSourceImage));
  let plan = job.transcreation as Transcreation | null;
  let caption = job.generatedCaption;
  if (!plan || !caption || plan.slides?.length !== images.length) {
    const result = await transcreatePost(source.caption, images);
    plan = result;
    caption = result.caption;
    await checkpoint({
      generatedCaption: caption,
      transcreation: {
        slides: result.slides.map((s) => ({ replacements: s.replacements })),
        notes: result.notes,
      },
    });
  }
  const done = [...job.generatedImageUrls];
  for (let index = done.length; index < images.length; index += 1) {
    const image = images[index];
    const copy = plan.slides[index];
    // Slides without Spanish text keep the original, normalized to JPEG.
    const url = copy.replacements.length
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
  await checkpoint({});
  const { row } = await createSocialApproval({
    reviewKey: `instagram-${shortcodeOf(source.permalink) ?? source.igMediaId}`,
    requestId: `translated-${job.id}`,
    caption,
    imageUrl: done[0],
    imageUrls: done,
    sourceId: source.id,
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
