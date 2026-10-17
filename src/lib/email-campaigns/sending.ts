/**
 * Server-only campaign sending (odd/tasks/email-campaigns.md, decision 8).
 * DRAFT → SENDING → SENT | PARTIAL. Send rows are unique per
 * (campaign, contact); a retry resends only QUEUED / FAILED rows and never
 * adds contacts that joined after the first send.
 */
import { createHash } from "node:crypto";

import type { CampaignSendStatus, Prisma } from "@prisma/client";

import {
  MAX_BATCH_SIZE,
  sendMailBatch,
  type BatchMailMessage,
  type BatchMailResult,
} from "@/lib/helpers/sendMail";
import { isProductionDeployment } from "@/lib/deployment";
import { prisma } from "@/lib/prisma";
import { CampaignError, toCampaign } from "@/lib/email-campaigns/campaigns";
import { lookupPromotionCode, toEmailPromo } from "@/lib/email-campaigns/promo";
import { renderCampaignEmail } from "@/lib/email-campaigns/render";
import {
  buildUnsubscribeHeaders,
  buildUnsubscribeUrl,
} from "@/lib/email-campaigns/unsubscribeToken";
import type {
  Campaign,
  CampaignEmailPromo,
  CampaignSendSummary,
} from "@/types/emailCampaign";

/** A SENDING campaign untouched this long is treated as a crashed run. */
export const STALE_SENDING_MS = 10 * 60 * 1000;

const PENDING_STATUSES: CampaignSendStatus[] = ["QUEUED", "FAILED"];
/** Accepted by the provider; DELIVERED / BOUNCED are set later by webhooks. */
const ACCEPTED_STATUSES: CampaignSendStatus[] = ["SENT", "DELIVERED", "BOUNCED"];
const MAX_ERROR_LENGTH = 500;

type PendingSend = { id: string; contactId: string; email: string };

/**
 * Develop and previews share a database that can hold real addresses, and
 * `sendMail` does not restrict recipients there. Outside production a campaign
 * only reaches `EMAIL_TEST_RECIPIENTS` (comma-separated); unset reaches nobody.
 * Returns `null` in production, where no address filter applies.
 */
function nonproductionRecipients(): string[] | null {
  if (isProductionDeployment()) return null;
  return (process.env.EMAIL_TEST_RECIPIENTS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function audienceWhere(
  campaign: Pick<Campaign, "segmentSources" | "locale">,
): Prisma.ContactWhereInput {
  const allowed = nonproductionRecipients();
  return {
    source: { in: campaign.segmentSources },
    locale: campaign.locale,
    status: "SUBSCRIBED",
    ...(allowed ? { email: { in: allowed } } : {}),
  };
}

/** Pending rows that must not be sent: unsubscribed, or outside the test allowlist. */
function unsendableWhere(): Prisma.CampaignSendWhereInput {
  const unsubscribed = { contact: { status: { not: "SUBSCRIBED" as const } } };
  const allowed = nonproductionRecipients();
  return allowed
    ? { OR: [unsubscribed, { email: { notIn: allowed } }] }
    : unsubscribed;
}

/** Subscribed contacts the campaign would reach, for the confirm dialog. */
export async function getCampaignAudienceCount(campaignId: string): Promise<number> {
  const row = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!row) throw new CampaignError("not_found");
  return prisma.contact.count({ where: audienceWhere(toCampaign(row)) });
}

/** Resend tag values allow only ASCII letters, digits, `_` and `-`. */
function tagValue(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256);
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return (message || "Failed to send email").slice(0, MAX_ERROR_LENGTH);
}

/**
 * Same campaign + same rows → same key, so a reclaimed crashed run does not
 * deliver a chunk Resend already accepted (keys live 24h on Resend's side).
 */
function chunkIdempotencyKey(campaignId: string, rows: PendingSend[]): string {
  const digest = createHash("sha256")
    .update(rows.map((row) => row.id).join(","))
    .digest("hex")
    .slice(0, 32);
  return `campaign-${tagValue(campaignId).slice(0, 64)}-${digest}`;
}

/**
 * Promo block loaded once per send. A configured code that no longer
 * resolves, or is inactive, blocks the send rather than mailing without it.
 */
async function loadSendablePromo(
  campaign: Campaign,
): Promise<CampaignEmailPromo | null> {
  if (!campaign.promoCode || !campaign.stripePromotionCodeId) return null;
  const summary = await lookupPromotionCode(campaign.promoCode);
  if (!summary?.active || summary.id !== campaign.stripePromotionCodeId) {
    throw new CampaignError("invalid_promo_code");
  }
  return toEmailPromo(summary, campaign.locale);
}

/**
 * Atomically moves the campaign to SENDING. `first` when claimed from DRAFT;
 * `retry` from PARTIAL or a stale (crashed) SENDING run.
 */
async function claimCampaign(campaignId: string): Promise<"first" | "retry"> {
  const fromDraft = await prisma.campaign.updateMany({
    where: { id: campaignId, status: "DRAFT" },
    data: { status: "SENDING" },
  });
  if (fromDraft.count > 0) return "first";

  const staleBefore = new Date(Date.now() - STALE_SENDING_MS);
  const retry = await prisma.campaign.updateMany({
    where: {
      id: campaignId,
      OR: [
        { status: "PARTIAL" },
        { status: "SENDING", updatedAt: { lt: staleBefore } },
      ],
    },
    data: { status: "SENDING" },
  });
  if (retry.count > 0) return "retry";
  throw new CampaignError("campaign_not_sendable");
}

/** Snapshots the audience into QUEUED rows; returns the audience size. */
async function createSendRows(campaign: Campaign): Promise<number> {
  const contacts = await prisma.contact.findMany({
    select: { id: true, email: true },
    where: audienceWhere(campaign),
    orderBy: { id: "asc" },
  });
  if (contacts.length === 0) return 0;
  await prisma.campaignSend.createMany({
    data: contacts.map((contact) => ({
      campaignId: campaign.id,
      contactId: contact.id,
      email: contact.email,
      status: "QUEUED" as const,
    })),
    skipDuplicates: true,
  });
  return contacts.length;
}

async function sendChunk(
  campaign: Campaign,
  promo: CampaignEmailPromo | null,
  rows: PendingSend[],
): Promise<void> {
  let results: BatchMailResult[];
  try {
    const messages: BatchMailMessage[] = await Promise.all(
      rows.map(async (row) => {
        const { subject, html, text } = await renderCampaignEmail(campaign, {
          promo,
          unsubscribeUrl: buildUnsubscribeUrl(row.contactId, campaign.locale),
        });
        return {
          to: row.email,
          subject,
          html,
          text,
          headers: buildUnsubscribeHeaders(row.contactId),
          tags: [
            { name: "campaign_id", value: tagValue(campaign.id) },
            { name: "send_id", value: tagValue(row.id) },
          ],
        };
      }),
    );
    results = await sendMailBatch(messages, {
      idempotencyKey: chunkIdempotencyKey(campaign.id, rows),
    });
  } catch (error) {
    // Disabled delivery, missing config or a render failure fails the chunk.
    const message = shortError(error);
    results = rows.map(() => ({ ok: false, error: message }));
  }

  const sentAt = new Date();
  await prisma.$transaction(
    rows.map((row, index) => {
      const result = results[index];
      return prisma.campaignSend.update({
        where: { id: row.id },
        data: result?.ok
          ? { status: "SENT", resendMessageId: result.id, sentAt, error: null }
          : {
              status: "FAILED",
              error: shortError(result?.error ?? "Missing send result"),
            },
      });
    }),
  );
}

/** Recounts rows and settles the campaign as SENT or PARTIAL. */
async function finalizeCampaign(campaignId: string): Promise<CampaignSendSummary> {
  const groups = await prisma.campaignSend.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { _all: true },
  });
  let sent = 0;
  let total = 0;
  for (const group of groups) {
    total += group._count._all;
    if (ACCEPTED_STATUSES.includes(group.status)) sent += group._count._all;
  }
  const failed = total - sent;
  const status = failed === 0 ? "SENT" : "PARTIAL";
  await prisma.campaign.updateMany({
    where: { id: campaignId, status: "SENDING" },
    data: status === "SENT" ? { status, sentAt: new Date() } : { status },
  });
  return { status, sent, failed, total };
}

export async function sendCampaign(campaignId: string): Promise<CampaignSendSummary> {
  const row = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!row) throw new CampaignError("not_found");
  const campaign = toCampaign(row);
  const promo = await loadSendablePromo(campaign);

  const mode = await claimCampaign(campaignId);
  const releaseStatus = mode === "first" ? "DRAFT" : "PARTIAL";
  try {
    // A run that crashed between claim and row creation has no rows yet.
    const needsRows =
      mode === "first" ||
      (await prisma.campaignSend.count({ where: { campaignId } })) === 0;
    if (needsRows && (await createSendRows(campaign)) === 0) {
      throw new CampaignError("campaign_empty_audience");
    }
  } catch (error) {
    await prisma.campaign.updateMany({
      where: { id: campaignId, status: "SENDING" },
      data: { status: needsDraft(error) ? "DRAFT" : releaseStatus },
    });
    throw error;
  }

  try {
    await prisma.campaignSend.deleteMany({
      where: {
        campaignId,
        status: { in: PENDING_STATUSES },
        ...unsendableWhere(),
      },
    });
    const pending = await prisma.campaignSend.findMany({
      select: { id: true, contactId: true, email: true },
      where: { campaignId, status: { in: PENDING_STATUSES } },
      orderBy: { id: "asc" },
    });

    for (let start = 0; start < pending.length; start += MAX_BATCH_SIZE) {
      await sendChunk(campaign, promo, pending.slice(start, start + MAX_BATCH_SIZE));
      // Heartbeat so a long run is not mistaken for a crashed one.
      await prisma.campaign.updateMany({
        where: { id: campaignId, status: "SENDING" },
        data: { updatedAt: new Date() },
      });
    }
  } catch (error) {
    // Release the claim so the admin can retry without waiting for staleness.
    await finalizeCampaign(campaignId).catch(() => undefined);
    throw error;
  }

  return finalizeCampaign(campaignId);
}

/** An empty audience always returns the campaign to an editable DRAFT. */
function needsDraft(error: unknown): boolean {
  return error instanceof CampaignError && error.code === "campaign_empty_audience";
}
