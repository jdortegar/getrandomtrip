import type { AnalyticsRecapConfig } from "@/types/analyticsRecap";
import { normalizePrivateKey } from "./ga4Client";

export function validWebhook(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      url.hostname === "hooks.slack.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(
        url.pathname,
      )
    );
  } catch {
    return false;
  }
}

/** Returns null when any value is missing or malformed; never echoes values. */
export function readAnalyticsRecapConfig(): AnalyticsRecapConfig | null {
  const webhookUrl = process.env.SLACK_ANALYTICS_WEBHOOK_URL?.trim() ?? "";
  const propertyId = process.env.GA4_PROPERTY_ID?.trim() ?? "";
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim() ?? "";
  const rawKey = process.env.GA4_PRIVATE_KEY ?? "";
  if (!rawKey.trim()) return null;
  const privateKey = normalizePrivateKey(rawKey);
  if (
    !validWebhook(webhookUrl) ||
    !/^\d{1,20}$/.test(propertyId) ||
    !clientEmail.includes("@") ||
    !privateKey.includes("-----BEGIN")
  )
    return null;
  return { webhookUrl, ga4: { propertyId, clientEmail, privateKey } };
}
