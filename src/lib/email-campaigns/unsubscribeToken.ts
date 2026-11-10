/**
 * Server-only unsubscribe tokens (odd/tasks/email-campaigns.md, decision 6).
 * A token is `base64url(contactId).base64url(HMAC-SHA256(payload))`, signed
 * with `EMAIL_UNSUBSCRIBE_SECRET`. Tokens never expire: an unsubscribe link
 * in an old campaign must keep working.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import type { Locale } from "@/lib/i18n/config";
import { getApplicationOrigin } from "@/lib/deployment";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null;
}

function sign(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function createUnsubscribeToken(contactId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not configured");
  }
  const payload = Buffer.from(contactId, "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret).toString("base64url")}`;
}

/** Returns the signed contact id, or `null` for any invalid token. */
export function verifyUnsubscribeToken(token: string): string | null {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  const contactId = Buffer.from(payload, "base64url").toString("utf8");
  return contactId || null;
}

/**
 * Token-less confirmation page, for admin previews and test sends where no
 * contact exists. The page shows its invalid-link state if opened.
 */
export function buildUnsubscribePageUrl(locale: Locale): string {
  return `${getApplicationOrigin()}${pathForLocale(locale, "/unsubscribe")}`;
}

/** Absolute link to the localized confirmation page, for email bodies. */
export function buildUnsubscribeUrl(contactId: string, locale: Locale): string {
  const token = encodeURIComponent(createUnsubscribeToken(contactId));
  return `${buildUnsubscribePageUrl(locale)}?token=${token}`;
}

/**
 * RFC 8058 one-click headers. Mail providers POST
 * `List-Unsubscribe=One-Click` to this URL, so it targets the API endpoint
 * rather than the page.
 */
export function buildUnsubscribeHeaders(
  contactId: string,
): Record<"List-Unsubscribe" | "List-Unsubscribe-Post", string> {
  const token = encodeURIComponent(createUnsubscribeToken(contactId));
  return {
    "List-Unsubscribe": `<${getApplicationOrigin()}/api/email/unsubscribe?token=${token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
