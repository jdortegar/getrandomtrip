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
) {
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
  return result.ts;
}
