import { after, NextRequest, NextResponse } from "next/server";
import {
  refreshSocialMessage,
  refreshSourceMessage,
} from "@/lib/social-approvals/refreshSocialMessage";
import { prisma } from "@/lib/prisma";
import {
  queueSocialPublish,
  queueSocialRevision,
  queueSocialTranslation,
} from "@/lib/db/socialRevisionJobs";
import {
  feedbackModal,
  parseSocialFeedback,
} from "@/lib/social-approvals/feedbackModal";
import { dispatchSocialWorker } from "@/lib/social-approvals/dispatchSocialWorker";
import { decideSocialApproval } from "@/lib/db/socialApprovals";
import {
  approvalConfig,
  approvalMessage,
  parseApprovalAction,
  validSlackSignature,
  type ApprovalAction,
} from "@/lib/social-approvals/slackApproval";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const config = approvalConfig();
  if (!config) return new NextResponse(null, { status: 503 });
  const raw = await request.text();
  if (raw.length > 100000) return new NextResponse(null, { status: 413 });
  if (
    !validSlackSignature(
      raw,
      request.headers.get("x-slack-request-timestamp"),
      request.headers.get("x-slack-signature"),
      config.secret,
    )
  )
    return new NextResponse(null, { status: 401 });
  try {
    const payload = JSON.parse(
      new URLSearchParams(raw).get("payload") ?? "null",
    );
    if (payload?.type === "view_submission") {
      const feedback = parseSocialFeedback(payload, config);
      if (!feedback || process.env.SLACK_SOCIAL_AI_ENABLED !== "true")
        return NextResponse.json({
          response_action: "errors",
          errors: {
            feedback:
              "Feedback is invalid, expired, or AI revisions are disabled. Close and reopen this review.",
          },
        });
      const result = await queueSocialRevision(feedback);
      if (result !== "queued")
        return NextResponse.json({
          response_action: "errors",
          errors: {
            feedback:
              result === "budget"
                ? "Daily AI revision limit reached. Please contact an admin."
                : "This revision is no longer pending, or reached the revision limit. Use the latest review.",
          },
        });
      after(async () => {
        const source = await prisma.socialApproval.findUnique({
          where: { id: feedback.id },
        });
        if (source?.status === "CHANGES_REQUESTED")
          await refreshSocialMessage(source, "REVISION_QUEUED");
        try {
          await dispatchSocialWorker();
        } catch {
          console.error(
            "[social-approvals] dispatch deferred to durable recovery",
          );
        }
      });
      return NextResponse.json({ response_action: "clear" });
    }
    const action = parseApprovalAction(payload, config);
    if (!action) return new NextResponse(null, { status: 400 });
    if (action.status === "TRANSLATE") return translate(action);
    if (action.status === "PUBLISH") return publish(action);
    if (
      action.status === "CHANGES_REQUESTED" &&
      process.env.SLACK_SOCIAL_AI_ENABLED === "true"
    ) {
      const source = await prisma.socialApproval.findUnique({
        where: { id: action.id },
      });
      if (
        !source ||
        source.status !== "PENDING" ||
        source.messageTs !== action.messageTs
      )
        return new NextResponse(null, { status: 409 });
      if (typeof payload.trigger_id !== "string")
        return new NextResponse(null, { status: 400 });
      const response = await fetch("https://slack.com/api/views.open", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trigger_id: payload.trigger_id,
          view: feedbackModal(action, config.secret),
        }),
        signal: AbortSignal.timeout(1500),
      });
      const opened = (await response.json()) as { ok?: boolean };
      return new NextResponse(null, {
        status: response.ok && opened.ok ? 200 : 503,
      });
    }
    const row = await decideSocialApproval(action);
    // Acknowledge first; message responses use Slack's response_url, not the ACK body.
    after(async () => {
      try {
        const response = await fetch(action.responseUrl, {
          method: "POST",
          redirect: "error",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            row
              ? { replace_original: true, ...approvalMessage(row) }
              : {
                  response_type: "ephemeral",
                  text: "This review is stale or unavailable. Use the latest revision in the channel.",
                },
          ),
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok)
          console.error(
            "[social-approvals] Slack message refresh failed; click again to retry",
          );
      } catch {
        // Never log payloads or secret response URLs. DB remains authoritative.
        console.error(
          "[social-approvals] Slack message refresh failed; click again to retry",
        );
      }
    });
    return new NextResponse(null, { status: 200 });
  } catch {
    // Non-200 makes the failure visible in Slack. Retrying cannot change a prior decision.
    return new NextResponse(null, { status: 503 });
  }
}

/** "Publish to @getrandomtrip.en": queue one publication of an approved review. */
async function publish(action: ApprovalAction) {
  const result =
    process.env.SLACK_SOCIAL_PUBLISH_ENABLED === "true"
      ? await queueSocialPublish({
          reviewId: action.id,
          user: action.user,
          messageTs: action.messageTs,
        })
      : "disabled";
  after(async () => {
    if (result === "queued") {
      const review = await prisma.socialApproval.findUnique({
        where: { id: action.id },
      });
      if (review?.status === "PUBLISHING")
        await refreshSocialMessage(review, "PUBLISHING");
      try {
        await dispatchSocialWorker();
      } catch {
        console.error(
          "[social-approvals] dispatch deferred to durable recovery",
        );
      }
      return;
    }
    await notifyClicker(
      action,
      result === "disabled"
        ? "Publishing is disabled. Contact an admin."
        : "Only the latest approved revision can be published.",
    );
  });
  return new NextResponse(null, { status: 200 });
}

/** Ephemeral notice to the person who clicked. Best effort. */
async function notifyClicker(action: ApprovalAction, text: string) {
  try {
    await fetch(action.responseUrl, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_type: "ephemeral", text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.error("[social-approvals] notice not delivered");
  }
}

/** "Translate this post": queue one paid translation, then hand off to the worker. */
async function translate(action: ApprovalAction) {
  const result =
    process.env.SLACK_SOCIAL_AI_ENABLED === "true"
      ? await queueSocialTranslation({
          sourceId: action.id,
          user: action.user,
          messageTs: action.messageTs,
        })
      : "disabled";
  after(async () => {
    if (result === "queued") {
      const source = await prisma.socialSource.findUnique({
        where: { id: action.id },
      });
      if (source?.status === "TRANSLATION_QUEUED")
        await refreshSourceMessage(source, "TRANSLATION_QUEUED", action.user);
      try {
        await dispatchSocialWorker();
      } catch {
        console.error(
          "[social-approvals] dispatch deferred to durable recovery",
        );
      }
      return;
    }
    const text =
      result === "budget"
        ? "Daily AI limit reached. Try again tomorrow or contact an admin."
        : result === "disabled"
          ? "AI translation is disabled. Contact an admin."
          : "This post was already handled or is unavailable.";
    await notifyClicker(action, text);
  });
  return new NextResponse(null, { status: 200 });
}
