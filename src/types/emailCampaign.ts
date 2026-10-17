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
