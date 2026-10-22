/**
 * Pure contact normalization shared by the contacts repository and the
 * waitlist backfill script. No database or environment imports here: scripts
 * import this module with a relative path.
 */
import type { CampaignLocale } from "../../types/emailCampaign";

export const DEFAULT_CONTACT_LOCALE: CampaignLocale = "es";

/** Contacts are keyed by trimmed, lowercased email. */
export function normalizeContactEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Trims and returns null for blank or missing names. */
export function normalizeContactName(name?: string | null): string | null {
  return name?.trim() || null;
}

/** `WaitlistEntry` keeps first and last name apart; a Contact has one name. */
export function waitlistDisplayName(
  name?: string | null,
  lastName?: string | null,
): string | null {
  return normalizeContactName(
    [name?.trim(), lastName?.trim()].filter(Boolean).join(" "),
  );
}

/** Trimmed, non-empty, de-duplicated tags in first-seen order. */
export function normalizeContactTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export function toContactLocale(locale: string): CampaignLocale {
  return locale === "en" ? "en" : DEFAULT_CONTACT_LOCALE;
}
