import { createHmac, timingSafeEqual } from "node:crypto";

export interface ApprovalContent {
  id: string;
  revision: number;
  caption: string;
  imageUrl: string;
  /** Every slide in order; empty for reviews created before multi-slide support. */
  imageUrls?: string[];
  status: string;
  decidedBy: string | null;
}

/** Slides of a review in order, falling back to the single legacy image. */
export function slideUrls(
  row: Pick<ApprovalContent, "imageUrl" | "imageUrls">,
) {
  return row.imageUrls?.length ? row.imageUrls : [row.imageUrl];
}

export function approvalConfig() {
  const token = process.env.SLACK_SOCIAL_BOT_TOKEN;
  const secret = process.env.SLACK_SOCIAL_SIGNING_SECRET;
  if (
    process.env.SLACK_SOCIAL_APPROVALS_ENABLED !== "true" ||
    !token ||
    !secret
  )
    return null;
  return {
    token,
    secret,
    team: "T0ATKF9157F",
    channel: "C0CAQS7HNH4",
    app: "A0CAR605CF8",
  };
}

export function validSlackSignature(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
) {
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signature ||
    !/^v0=[a-f0-9]{64}$/.test(signature) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300
  )
    return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${raw}`).digest("hex")}`;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function approvalMessage(row: ApprovalContent) {
  const pending = row.status === "PENDING";
  const status = pending
    ? "Awaiting approval"
    : row.status === "REVISION_QUEUED"
      ? "Changes requested. AI revision queued; the new draft will need approval."
      : row.status === "REVISION_FAILED"
        ? "Changes requested. Revision needs admin attention. Nothing published."
        : row.status === "APPROVED"
          ? "Approved"
          : row.status === "CHANGES_REQUESTED"
            ? "Changes requested. Please describe the changes in this thread."
            : "Superseded or unavailable";
  return {
    text: `TEST ONLY: @getrandomtrip.en, revision ${row.revision}. ${status}. No Instagram publication.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: `TEST ONLY · @getrandomtrip.en · Revision ${row.revision}\n${status}${row.decidedBy ? ` (${row.decidedBy})` : ""}\nNo Instagram publication.`,
        },
      },
      ...slideUrls(row).map((url, index, all) => ({
        type: "image",
        image_url: url,
        alt_text:
          all.length > 1
            ? `English artwork, slide ${index + 1} of ${all.length}, revision ${row.revision}`
            : `English artwork, revision ${row.revision}`,
      })),
      { type: "section", text: { type: "plain_text", text: row.caption } },
      ...(pending
        ? [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  action_id: "social_approve",
                  text: { type: "plain_text", text: "Approve" },
                  style: "primary",
                  value: row.id,
                },
                {
                  type: "button",
                  action_id: "social_changes",
                  text: { type: "plain_text", text: "Request changes" },
                  value: row.id,
                },
              ],
            },
          ]
        : []),
    ],
  };
}

export interface ApprovalAction {
  id: string;
  user: string;
  messageTs: string;
  status: "APPROVED" | "CHANGES_REQUESTED";
  responseUrl: string;
}

export function parseApprovalAction(
  payload: unknown,
  config: NonNullable<ReturnType<typeof approvalConfig>>,
): ApprovalAction | null {
  const p = payload as {
    type?: string;
    response_url?: string;
    api_app_id?: string;
    team?: { id?: string };
    channel?: { id?: string };
    user?: { id?: string; team_id?: string };
    container?: { type?: string; message_ts?: string; channel_id?: string };
    message?: { ts?: string };
    actions?: { action_id?: string; value?: string }[];
  };
  const a = p?.actions?.[0];
  if (
    p?.type !== "block_actions" ||
    p.api_app_id !== config.app ||
    p.team?.id !== config.team ||
    p.channel?.id !== config.channel ||
    p.container?.type !== "message" ||
    p.container.channel_id !== config.channel ||
    !p.user?.id ||
    (p.user.team_id && p.user.team_id !== config.team) ||
    p.actions?.length !== 1 ||
    !a?.value ||
    a.value.length > 100 ||
    !p.message?.ts ||
    p.message.ts !== p.container.message_ts
  )
    return null;
  if (a.action_id !== "social_approve" && a.action_id !== "social_changes")
    return null;
  if (
    typeof p.response_url !== "string" ||
    !/^https:\/\/hooks\.slack\.com\/actions\/[A-Za-z0-9_/-]+$/.test(
      p.response_url,
    )
  )
    return null;
  return {
    responseUrl: p.response_url,
    id: a.value,
    user: p.user.id,
    messageTs: p.message.ts,
    status: a.action_id === "social_approve" ? "APPROVED" : "CHANGES_REQUESTED",
  };
}
