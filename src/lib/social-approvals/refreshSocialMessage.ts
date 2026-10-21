import {
  approvalConfig,
  approvalMessage,
  type ApprovalContent,
} from "./slackApproval";
export async function refreshSocialMessage(
  row: ApprovalContent & { messageTs: string | null },
  status = row.status,
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
        ...approvalMessage({ ...row, status }),
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
