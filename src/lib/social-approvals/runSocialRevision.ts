import { refreshSocialMessage } from "./refreshSocialMessage";
import { prisma } from "@/lib/prisma";
import {
  claimSocialRevision,
  finishGeneratedSocialRevision,
} from "@/lib/db/socialRevisionJobs";
import { recordSocialMessage } from "@/lib/db/socialApprovals";
import {
  reviseSocialCaption,
  reviseSocialArtwork,
} from "@/lib/ai/socialRevision";
import { approvalConfig, approvalMessage } from "./slackApproval";
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
    generatedImageUrl?: string;
  }) {
    const result = await prisma.socialRevisionJob.updateMany({
      where: { ...where, leaseUntil: { gt: new Date() } },
      data,
    });
    if (!result.count) throw new Error("LEASE_LOST");
  }
  try {
    const current = await prisma.socialApproval.findUnique({
      where: { id: job.reviewId },
    });
    if (current?.status !== "CHANGES_REQUESTED")
      throw new Error("STALE_SOURCE");
    if (job.target !== "caption" && !process.env.OPENAI_SOCIAL_IMAGE_MODEL)
      throw new Error("AI_IMAGE_UNCONFIGURED");
    let caption = job.generatedCaption ?? job.review.caption;
    let imageUrl = job.generatedImageUrl ?? job.review.imageUrl;
    if (!job.generatedCaption && job.target !== "image") {
      caption = await reviseSocialCaption(caption, job.feedback);
      await checkpoint({ generatedCaption: caption });
    }
    if (!job.generatedImageUrl && job.target !== "caption") {
      const source = await loadSocialArtwork(job.review.imageUrl);
      const bytes = await reviseSocialArtwork(
        source.bytes,
        source.type,
        job.feedback,
      );
      imageUrl = await saveSocialArtwork(job.id, bytes);
      await checkpoint({ generatedImageUrl: imageUrl });
    }
    const row = await finishGeneratedSocialRevision(
      job.id,
      leaseToken,
      caption,
      imageUrl,
    );
    if (!row) throw new Error("STALE_SOURCE");
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: config.channel,
        ...approvalMessage({ ...row, status: "PENDING" }),
        unfurl_links: false,
        unfurl_media: false,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { ok?: boolean; ts?: string };
    if (!response.ok || !result.ok || !result.ts)
      throw new Error("SLACK_DELIVERY_UNCONFIRMED");
    await recordSocialMessage(row.id, result.ts);
    await refreshSocialMessage(job.review, "SUPERSEDED");
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
    if (code !== "STALE_SOURCE")
      await refreshSocialMessage(job.review, "REVISION_FAILED");
  }
}
