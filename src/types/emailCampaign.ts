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

/** Admin email campaigns secondary navigation views. */
export type EmailCampaignsAdminView = "campaigns" | "contacts";

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
  | "admin_email_missing"
  | "campaign_not_sendable"
  | "campaign_empty_audience";

/** Outcome of a send run. `failed` counts rows still QUEUED or FAILED. */
export interface CampaignSendSummary {
  status: Extract<CampaignStatus, "SENT" | "PARTIAL">;
  /** Rows accepted by the provider (SENT, DELIVERED or BOUNCED). */
  sent: number;
  failed: number;
  total: number;
}

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

/**
 * Settled payments made with a campaign's promotion code on or after its send.
 * `attributed` = the payer matches a recipient of the campaign (contact user
 * or email); `shared` = the code reached someone else.
 */
export interface CampaignConversionCounts {
  attributed: number;
  shared: number;
}

/** Campaign detail metrics. Counts are recipients (send rows), never raw events. */
export interface CampaignMetrics {
  /** Rows accepted by the provider (SENT, DELIVERED or BOUNCED). */
  sent: number;
  /** Rows DELIVERED, or with a DELIVERED event recorded before a later bounce. */
  delivered: number;
  bounced: number;
  /** Rows never accepted by the provider (FAILED or still QUEUED). */
  failed: number;
  /** Recipients with at least one OPENED event (inflated by Apple MPP). */
  uniqueOpens: number;
  /** Recipients with at least one CLICKED event. */
  uniqueClicks: number;
  conversions: CampaignConversionCounts;
  /**
   * Sum of `Payment.amount` (amount actually charged, after discount) of all
   * conversions in `currency`, in major units (e.g. `129.5` = USD 129.50).
   */
  revenue: number;
  /**
   * Sum of the checkout discount over all conversions, in major USD units:
   * `Payment.promoDiscountUsd`, or for older rows without it the
   * `discountAmountUsd` PaymentIntent metadata in the stored Stripe JSON.
   * `null` when no conversion has any discount data.
   */
  discountTotal: number | null;
  /** Uppercase ISO 4217 code of `revenue`. Checkout charges USD only. */
  currency: string;
  /** Conversions paid in another currency: counted, but left out of `revenue`. */
  otherCurrencyConversions: number;
}

/** One recipient row of a campaign detail. */
export interface CampaignRecipient {
  sendId: string;
  email: string;
  name: string | null;
  status: CampaignSendStatus;
  opened: boolean;
  clicked: boolean;
  /** True when the recipient has an attributed conversion. */
  purchased: boolean;
  /** ISO 8601 timestamp. */
  sentAt: string | null;
}

export interface CampaignReport {
  metrics: CampaignMetrics;
  /** Ordered by email. */
  recipients: CampaignRecipient[];
}

/** Per-campaign figures for the list / comparison view. */
export interface CampaignSummary {
  id: string;
  /** Rows accepted by the provider (SENT, DELIVERED or BOUNCED). */
  sent: number;
  uniqueOpens: number;
  uniqueClicks: number;
  /** Attributed + shared conversions. */
  conversions: number;
  /** Charged amount of conversions in `CampaignMetrics.currency` (USD), major units. */
  revenue: number;
}

export type CampaignListItem = Campaign & { summary: CampaignSummary };

/** Sortable columns of the campaigns list. `sentAt` falls back to `createdAt` for drafts. */
export type CampaignSortBy = "name" | "sentAt" | "conversions" | "revenue";

export type CampaignSortOrder = "asc" | "desc";

/** Client-side filters of the campaigns list; `""` means "all". */
export interface CampaignListFilters {
  /** Case-insensitive match over name and subject. */
  search: string;
  status: CampaignStatus | "";
  /** Matches campaigns whose `segmentSources` include it. */
  segment: ContactSource | "";
}

// Event metadata uses type aliases, not interfaces, so the values stay
// assignable to Prisma JSON input (interfaces lack an index signature).

/** Minimal metadata stored on a CLICKED event. */
export type ClickedEventMetadata = {
  link: string;
};

/** Minimal metadata stored on a BOUNCED event (Resend/SES bounce fields). */
export type BouncedEventMetadata = {
  /** e.g. `Permanent`, `Transient`, `Undetermined`. */
  bounceType: string | null;
  bounceSubType: string | null;
};

/** A Resend webhook event relevant to campaign tracking, already validated. */
export interface ResendTrackingEvent {
  type: EmailEventType;
  /** Resend message id (`data.email_id`), matched to `CampaignSend.resendMessageId`. */
  emailId: string;
  /**
   * `CampaignSend.id` from the `send_id` tag. Lets an event that arrives
   * before `resendMessageId` is persisted still find its send.
   */
  sendId?: string;
  occurredAt: Date;
  metadata: ClickedEventMetadata | BouncedEventMetadata | null;
}

/**
 * Outcome of handling one webhook delivery. Every outcome is acknowledged
 * with 200: `unknown_email` covers transactional emails sharing the endpoint,
 * `duplicate` a redelivery of an already recorded event.
 */
export type ResendEventOutcome = "recorded" | "duplicate" | "unknown_email";

/**
 * Admin campaign editor state. Text fields hold the raw input; they are
 * trimmed and blank optionals become `null` when building `CampaignInput`.
 */
export interface CampaignFormValues {
  name: string;
  subject: string;
  preheader: string;
  title: string;
  bodyMarkdown: string;
  ctaLabel: string;
  ctaUrl: string;
  locale: CampaignLocale;
  segmentSources: ContactSource[];
  promoCode: string;
}

export type CampaignFormField = keyof CampaignFormValues;

/** Client-side validation failure for one editor field. */
export type CampaignFormIssue =
  | { kind: "required" }
  | { kind: "tooLong"; max: number }
  | { kind: "ctaUrl" }
  | { kind: "ctaPair" }
  | { kind: "segment" };

export type CampaignFormIssues = Partial<Record<CampaignFormField, CampaignFormIssue>>;

/**
 * A failed admin campaign API call as the UI reports it: a known domain code,
 * a 400 payload validation failure, or anything else (`generic`).
 */
export type CampaignApiFailure = CampaignErrorCode | "validation" | "generic";

/** Result of the editor's promo code lookup. */
export type PromoLookupState =
  | { status: "idle" }
  | { status: "found"; promo: PromotionCodeSummary }
  | { status: "notFound" }
  | { status: "error" };
