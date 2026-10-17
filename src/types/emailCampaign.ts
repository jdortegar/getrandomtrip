/**
 * Email campaigns domain types. String unions mirror the Prisma enums so UI
 * code never imports `@prisma/client`.
 */

/** How a marketing contact entered the list. Mirrors Prisma `ContactSource`. */
export type ContactSource = "WAITLIST" | "FRIENDS_FAMILY";

/** Whether a contact can receive campaigns. Mirrors Prisma `ContactStatus`. */
export type ContactStatus = "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED";

/** Campaign lifecycle: DRAFT → SENDING → SENT | PARTIAL. Mirrors Prisma `CampaignStatus`. */
export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "PARTIAL";

/** Per-recipient delivery state. Mirrors Prisma `CampaignSendStatus`. */
export type CampaignSendStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "FAILED";

/** Resend webhook event recorded against a send. Mirrors Prisma `EmailEventType`. */
export type EmailEventType =
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "OPENED"
  | "CLICKED";

/** A campaign is written in exactly one locale. */
export type CampaignLocale = "es" | "en";

export interface Contact {
  id: string;
  /** Always lowercase. */
  email: string;
  name?: string | null;
  source: ContactSource;
  status: ContactStatus;
  locale: CampaignLocale;
  tags: string[];
  userId?: string | null;
  /** ISO 8601 timestamp. */
  unsubscribedAt?: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Admin contacts list filters. `page` is 1-based; `limit` is capped at 100. */
export interface ContactListQuery {
  page: number;
  limit: number;
  source?: ContactSource;
  status?: ContactStatus;
  /** Case-insensitive match on email or name. */
  q?: string;
}

export interface ContactListResult {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface WaitlistContactInput {
  email: string;
  name?: string | null;
}

export interface FriendsFamilyContactInput {
  email: string;
  name?: string | null;
  locale?: CampaignLocale;
  tags?: string[];
}

/** Admin edit. `status` may only be `SUBSCRIBED` (manual resubscribe). */
export interface ContactUpdateInput {
  name?: string | null;
  locale?: CampaignLocale;
  tags?: string[];
  status?: ContactStatus;
}

/** Contact operation failures the admin API maps to 409 / 404 / 400. */
/**
 * Outcome of a recipient unsubscribe. `unchanged` covers contacts already
 * UNSUBSCRIBED or BOUNCED; neither is an error for the recipient.
 */
export type UnsubscribeResult = "unsubscribed" | "unchanged" | "not_found";

export type ContactErrorCode =
  | "duplicate_email"
  | "not_found"
  | "invalid_status_change";

export interface Campaign {
  id: string;
  /** Internal admin label, never shown to recipients. */
  name: string;
  subject: string;
  preheader?: string | null;
  title: string;
  bodyMarkdown: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  locale: CampaignLocale;
  segmentSources: ContactSource[];
  /** Stripe promotion code id (`promo_...`) used for conversion attribution. */
  stripePromotionCodeId?: string | null;
  /** Customer-facing code, e.g. `FUNDADOR30`. */
  promoCode?: string | null;
  status: CampaignStatus;
  /** ISO 8601 timestamp. */
  sentAt?: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

export interface CampaignSend {
  id: string;
  campaignId: string;
  contactId: string;
  /** Recipient snapshot at send time. */
  email: string;
  resendMessageId?: string | null;
  status: CampaignSendStatus;
  error?: string | null;
  /** ISO 8601 timestamp. */
  sentAt?: string | null;
}

/** Admin create payload. Empty optional strings are normalized to `null`. */
export interface CampaignInput {
  name: string;
  subject: string;
  preheader: string | null;
  title: string;
  bodyMarkdown: string;
  ctaLabel: string | null;
  /** Absolute https URL; present iff `ctaLabel` is. */
  ctaUrl: string | null;
  locale: CampaignLocale;
  segmentSources: ContactSource[];
  /** Customer-facing code typed by the admin; `null` means no promo. */
  promoCode: string | null;
}

/** Admin edit of a DRAFT. `promoCode: null` clears the promo. */
export type CampaignUpdateInput = Partial<CampaignInput>;

/** Campaign operation failures the admin API maps to 404 / 409 / 400. */
export type CampaignErrorCode =
  | "not_found"
  | "campaign_not_editable"
  | "invalid_promo_code"
  | "admin_email_missing";

/** Admin-facing view of a Stripe promotion code and its redemption rules. */
export interface PromotionCodeSummary {
  /** Stripe promotion code id (`promo_...`). */
  id: string;
  code: string;
  /** False when the promotion code or its coupon can no longer be redeemed. */
  active: boolean;
  /** Percentage, e.g. `30` for 30% off. */
  percentOff: number | null;
  /** Fixed discount in minor units of `currency`. */
  amountOffCents: number | null;
  /** Lowercase ISO 4217 code of `amountOffCents`. */
  currency: string | null;
  /** ISO 8601; earliest of the code expiry and the coupon `redeem_by`. */
  expiresAt: string | null;
  maxRedemptions: number | null;
  /** Settled payments on our side that used this promotion code. */
  redemptionsUsed: number;
  firstTimeOnly: boolean;
  /** Minimum order amount in minor units (USD checkout). */
  minimumAmountCents: number | null;
}

/** Promo block props for the campaign email template. */
export interface CampaignEmailPromo {
  code: string;
  /** Localized, e.g. `30% off` / `30% de descuento`. */
  discountLabel: string;
  /** ISO 8601. */
  expiresAt?: string | null;
}

/** Fields the campaign email template is rendered from. */
export type CampaignEmailContent = Pick<
  Campaign,
  | "subject"
  | "preheader"
  | "title"
  | "bodyMarkdown"
  | "ctaLabel"
  | "ctaUrl"
  | "locale"
>;

export interface RenderedCampaignEmail {
  subject: string;
  html: string;
  text: string;
}
