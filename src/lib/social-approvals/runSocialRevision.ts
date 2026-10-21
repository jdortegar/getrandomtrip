import { refreshSocialMessage } from "./refreshSocialMessage";
import { prisma } from "@/lib/prisma";
import {
  claimSocialRevision,
  finishGeneratedSocialRevision,
} from "@/lib/db/socialRevisionJobs";
import {
  reviseSocialCaption,
  reviseSocialArtwork,
} from "@/lib/ai/socialRevision";
import { approvalConfig, slideUrls } from "./slackApproval";
import { postSocialReview } from "./postSocialReview";
import { loadSocialArtwork, saveSocialArtwork } from "./socialAssets";

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
  async function checkpoint(data: {
    generatedCaption?: string;
    generatedImageUrls?: string[];
  }) {
    const result = await prisma.socialRevisionJob.updateMany({
      where: { ...where, leaseUntil: { gt: new Date() } },
      data,
    });
    if (!result.count) throw new Error("LEASE_LOST");
  }
  try {
    const review = job.review;
    if (!review) throw new Error("STALE_SOURCE");
    const current = await prisma.socialApproval.findUnique({
      where: { id: review.id },
    });
    if (current?.status !== "CHANGES_REQUESTED")
      throw new Error("STALE_SOURCE");
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
    await prisma.socialRevisionJob.updateMany({
      where,
      data: { status: "COMPLETE", leaseToken: null, leaseUntil: null },
    });
  } catch (error) {
    // Every uncertain paid/delivery attempt requires explicit admin recovery, never blind retries.
    const allowed = new Set([
      "STALE_SOURCE",
      "LEASE_LOST",
      "AI_IMAGE_UNCONFIGURED",
      "SLACK_DELIVERY_UNCONFIRMED",
      "SLIDES_INVALID",
    ]);
    const code =
      error instanceof Error && allowed.has(error.message)
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
    if (code !== "STALE_SOURCE" && job.review)
      await refreshSocialMessage(job.review, "REVISION_FAILED");
  }
}
