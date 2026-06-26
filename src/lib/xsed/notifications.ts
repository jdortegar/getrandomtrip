import { hasLocale } from "@/lib/i18n/config";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface XsedNotificationInput {
  email: string;
  locale: string | null;
  timezone: string | null;
}

export function parseXsedNotificationBody(
  body: unknown,
): XsedNotificationInput | null {
  if (
    !body ||
    typeof body !== "object" ||
    !("email" in body) ||
    typeof (body as { email?: unknown }).email !== "string"
  ) {
    return null;
  }

  const { email, locale, timezone } = body as {
    email: string;
    locale?: unknown;
    timezone?: unknown;
  };
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) return null;

  const normalizedLocale =
    typeof locale === "string" && hasLocale(locale) ? locale : null;

  const normalizedTimezone =
    typeof timezone === "string" && timezone.length > 0 ? timezone : null;

  return {
    email: normalizedEmail,
    locale: normalizedLocale,
    timezone: normalizedTimezone,
  };
}
