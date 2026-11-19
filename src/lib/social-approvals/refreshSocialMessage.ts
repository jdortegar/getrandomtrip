import { lockSocialApproval } from "@/lib/db/socialApprovals";
import { prisma } from "@/lib/prisma";
import {
  approvalConfig,
  approvalMessage,
  type ApprovalContent,
} from "./slackApproval";
import { socialSourceConfig } from "./socialAccounts";
import { getSourcePreview } from "./sourceMedia";
import { sourceMessage, type SourceContent } from "./sourceMessage";
export async function refreshSocialMessage(
  row: ApprovalContent & { messageTs: string | null },
  status = row.status,
  options: { permalink?: string | null } = {},
) {
  const config = approvalConfig();
  if (!config || !row.messageTs) return;
  try {
    const response = await fetch("https://slack.com/api/chat.update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: config.channel,
        ts: row.messageTs,
        ...approvalMessage({ ...row, status }, options),
      }),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { ok?: boolean };
    if (!response.ok || !result.ok) throw new Error("refresh");
  } catch {
    console.error(
      "[social-approvals] status refresh failed; database remains authoritative",
    );
  }
}

/** Updates the Spanish post card with a fresh preview URL from Instagram. */
export async function refreshSourceMessage(
  source: SourceContent & { messageTs: string | null; igMediaId: string },
  _status: string,
  actor?: string | null,
  options: { onlyIfAnnounced?: boolean } = {},
) {
  const config = approvalConfig();
  if (!config || !source.messageTs) return;
  const account = socialSourceConfig();
  const previewUrl = account
    ? await getSourcePreview(account.token, source.igMediaId).catch(() => null)
    : null;
  try {
    await prisma.$transaction(
      async (tx) => {
        // Every source-card writer takes this distinct lock. Queue transactions
        // stay network-free; their later card refresh waits and reads latest state.
        await lockSocialApproval(tx, `source-card:${source.id}`);
        const current = await tx.socialSource.findUnique({
          where: { id: source.id },
        });
        if (
          !current ||
          current.messageTs !== source.messageTs ||
          (options.onlyIfAnnounced && current.status !== "ANNOUNCED")
        )
          return;
        const response = await fetch("https://slack.com/api/chat.update", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: config.channel,
            ts: source.messageTs,
            ...sourceMessage(current, previewUrl, actor),
          }),
          signal: AbortSignal.timeout(5000),
        });
        const result = (await response.json()) as { ok?: boolean };
        if (!response.ok || !result.ok) throw new Error("refresh");
      },
      { maxWait: 5000, timeout: 15000 },
    );
  } catch {
    console.error(
      "[social-approvals] source card refresh failed; database remains authoritative",
    );
  }
}
