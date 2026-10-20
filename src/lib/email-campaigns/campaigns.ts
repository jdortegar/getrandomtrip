/**
 * Server-only campaign repository (odd/tasks/email-campaigns.md, decisions
 * 3–5). Campaigns are editable only while DRAFT; the conditional writes keep
 * a campaign that started sending from being changed or deleted. Campaigns
 * target segments (odd/tasks/email-campaign-segments.md, decisions 4–5);
 * `segmentSources` is only kept as a mirror of the targeted system segments.
 */
import type { Campaign as CampaignRow, ContactSource } from "@prisma/client";

import { isProductionDeployment } from "@/lib/deployment";
import { sendMail } from "@/lib/helpers/sendMail";
import { prisma } from "@/lib/prisma";
import { lookupPromotionCode, toEmailPromo } from "@/lib/email-campaigns/promo";
import { renderCampaignEmail } from "@/lib/email-campaigns/render";
import { buildUnsubscribePageUrl } from "@/lib/email-campaigns/unsubscribeToken";
import { toContactLocale } from "@/lib/email-campaigns/contactRules";
import { normalizeSegmentIds } from "@/lib/email-campaigns/segmentRules";
import { SEGMENT_REFS_INCLUDE, toSegmentRefs } from "@/lib/email-campaigns/segments";
import type {
  Campaign,
  CampaignEmailPromo,
  CampaignErrorCode,
  CampaignInput,
  CampaignUpdateInput,
  SegmentRef,
} from "@/types/emailCampaign";

export class CampaignError extends Error {
  constructor(readonly code: CampaignErrorCode) {
    super(code);
    this.name = "CampaignError";
  }
}

/** HTTP status for each repository failure, shared by the admin routes. */
export const CAMPAIGN_ERROR_STATUS: Record<CampaignErrorCode, number> = {
  not_found: 404,
  campaign_not_editable: 409,
  invalid_promo_code: 400,
  admin_email_missing: 400,
  campaign_not_sendable: 409,
  campaign_empty_audience: 400,
  invalid_segment: 400,
};

/** Every query returning a `Campaign` loads its segments with this include. */
export const CAMPAIGN_INCLUDE = { segments: SEGMENT_REFS_INCLUDE } as const;

type CampaignRowWithSegments = CampaignRow & {
  segments?: { segment: SegmentRef }[];
};

/** sendMail already prefixes this outside production. */
const TEST_SUBJECT_PREFIX = "[TEST] ";

export function toCampaign(row: CampaignRowWithSegments): Campaign {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    preheader: row.preheader,
    title: row.title,
    bodyMarkdown: row.bodyMarkdown,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    locale: toContactLocale(row.locale),
    segments: toSegmentRefs(row.segments),
    stripePromotionCodeId: row.stripePromotionCodeId,
    promoCode: row.promoCode,
    status: row.status,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Stripe id + canonical code of an active promo, or `invalid_promo_code`. */
async function resolvePromo(code: string | null) {
  if (!code) return { stripePromotionCodeId: null, promoCode: null };
  const summary = await lookupPromotionCode(code);
  if (!summary?.active) throw new CampaignError("invalid_promo_code");
  return { stripePromotionCodeId: summary.id, promoCode: summary.code };
}

/**
 * De-duplicated segment ids plus the `segmentSources` mirror of the system
 * ones, or `invalid_segment` when any id is unknown.
 */
async function resolveSegments(ids: string[]) {
  const segmentIds = normalizeSegmentIds(ids);
  if (segmentIds.length === 0) throw new CampaignError("invalid_segment");
  const rows = await prisma.segment.findMany({
    select: { id: true, systemKey: true },
    where: { id: { in: segmentIds } },
  });
  if (rows.length !== segmentIds.length) throw new CampaignError("invalid_segment");
  const segmentSources = rows
    .map((row) => row.systemKey)
    .filter((key): key is ContactSource => key !== null);
  return { segmentIds, segmentSources };
}

/** Distinguishes a refused conditional write: missing vs no longer DRAFT. */
async function refusalFor(id: string): Promise<CampaignError> {
  const existing = await prisma.campaign.findUnique({
    select: { status: true },
    where: { id },
  });
  return new CampaignError(existing ? "campaign_not_editable" : "not_found");
}

export async function listCampaigns(): Promise<Campaign[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: CAMPAIGN_INCLUDE,
  });
  return rows.map(toCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const row = await prisma.campaign.findUnique({
    where: { id },
    include: CAMPAIGN_INCLUDE,
  });
  return row ? toCampaign(row) : null;
}

export async function createCampaign(
  input: CampaignInput,
  adminId: string,
): Promise<Campaign> {
  const { promoCode, segmentIds: requestedIds, ...fields } = input;
  const { segmentIds, segmentSources } = await resolveSegments(requestedIds);
  const promo = await resolvePromo(promoCode);
  const row = await prisma.campaign.create({
    data: {
      ...fields,
      ...promo,
      segmentSources,
      segments: { create: segmentIds.map((segmentId) => ({ segmentId })) },
      status: "DRAFT",
      createdById: adminId,
    },
    include: CAMPAIGN_INCLUDE,
  });
  return toCampaign(row);
}

export async function updateCampaign(
  id: string,
  input: CampaignUpdateInput,
): Promise<Campaign> {
  const { promoCode, segmentIds: requestedIds, ...fields } = input;
  const segments =
    requestedIds === undefined ? null : await resolveSegments(requestedIds);
  const withPromo =
    promoCode === undefined
      ? fields
      : { ...fields, ...(await resolvePromo(promoCode)) };

  if (!segments) {
    const { count } = await prisma.campaign.updateMany({
      where: { id, status: "DRAFT" },
      data: withPromo,
    });
    if (count === 0) throw await refusalFor(id);
  } else {
    // The DRAFT row lock taken by updateMany holds off a concurrent send
    // claim until the new targets are committed.
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.campaign.updateMany({
        where: { id, status: "DRAFT" },
        data: { ...withPromo, segmentSources: segments.segmentSources },
      });
      if (count === 0) throw await refusalFor(id);
      await tx.campaignSegment.deleteMany({
        where: { campaignId: id, segmentId: { notIn: segments.segmentIds } },
      });
      await tx.campaignSegment.createMany({
        data: segments.segmentIds.map((segmentId) => ({ campaignId: id, segmentId })),
        skipDuplicates: true,
      });
    });
  }

  const row = await prisma.campaign.findUnique({
    where: { id },
    include: CAMPAIGN_INCLUDE,
  });
  if (!row) throw new CampaignError("not_found");
  return toCampaign(row);
}

export async function deleteCampaign(id: string): Promise<void> {
  const { count } = await prisma.campaign.deleteMany({
    where: { id, status: "DRAFT" },
  });
  if (count === 0) throw await refusalFor(id);
}

/**
 * Current promo block for a campaign, re-read from Stripe so the discount and
 * expiry match what checkout enforces. Omitted when the code no longer
 * resolves to the stored promotion code id.
 */
export async function loadCampaignEmailPromo(
  campaign: Pick<Campaign, "promoCode" | "stripePromotionCodeId" | "locale">,
): Promise<CampaignEmailPromo | null> {
  if (!campaign.promoCode || !campaign.stripePromotionCodeId) return null;
  const summary = await lookupPromotionCode(campaign.promoCode);
  if (!summary || summary.id !== campaign.stripePromotionCodeId) return null;
  return toEmailPromo(summary, campaign.locale);
}

async function renderWithoutRecipient(campaign: Campaign) {
  return renderCampaignEmail(campaign, {
    unsubscribeUrl: buildUnsubscribePageUrl(campaign.locale),
    promo: await loadCampaignEmailPromo(campaign),
  });
}

async function requireCampaign(id: string): Promise<Campaign> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new CampaignError("not_found");
  return campaign;
}

export async function renderCampaignPreview(id: string): Promise<string> {
  const { html } = await renderWithoutRecipient(await requireCampaign(id));
  return html;
}

/**
 * Sends the campaign to the requesting admin only. Creates no Contact or
 * CampaignSend rows, so tests never count toward campaign metrics.
 */
export async function sendCampaignTest(
  id: string,
  adminId: string,
): Promise<{ to: string }> {
  const campaign = await requireCampaign(id);
  const admin = await prisma.user.findUnique({
    select: { email: true },
    where: { id: adminId },
  });
  if (!admin?.email) throw new CampaignError("admin_email_missing");

  const { subject, html, text } = await renderWithoutRecipient(campaign);
  await sendMail({
    to: admin.email,
    subject: isProductionDeployment() ? `${TEST_SUBJECT_PREFIX}${subject}` : subject,
    content: { html, text },
  });
  return { to: admin.email };
}
