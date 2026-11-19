import {
  logSocialFailure,
  type SocialDiagnosticStage,
} from "./socialDiagnostics";
import { recordSocialMessage } from "@/lib/db/socialApprovals";
import {
  approvalConfig,
  approvalMessage,
  type ApprovalContent,
} from "./slackApproval";

/**
 * Posts a pending review card and records its Slack timestamp. Throws
 * SLACK_DELIVERY_UNCONFIRMED when Slack does not confirm the message; callers
 * must not repeat the post automatically.
 */
export async function postSocialReview(
  config: NonNullable<ReturnType<typeof approvalConfig>>,
  row: ApprovalContent,
  jobId?: string,
) {
  let stage: SocialDiagnosticStage = "slack.post";
  let httpStatus: number | undefined;
  let slackCode: unknown;
  try {
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
    httpStatus = response.status;
    stage = "slack.parse";
    const result = (await response.json()) as {
      ok?: boolean;
      ts?: string;
      error?: unknown;
    };
    stage = "slack.accept";
    slackCode = result?.error;
    if (!response.ok || !result.ok || !result.ts)
      throw new Error("SLACK_DELIVERY_UNCONFIRMED");
    stage = "slack.record";
    await recordSocialMessage(row.id, result.ts);
    return result.ts;
  } catch (error) {
    logSocialFailure(stage, error, {
      jobId,
      reviewId: row.id,
      httpStatus,
      slackCode,
    });
    throw error;
  }
}
