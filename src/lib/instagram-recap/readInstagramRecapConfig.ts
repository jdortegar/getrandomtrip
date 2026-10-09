import type { InstagramRecapConfig } from "@/types/instagramRecap";
import { validWebhook } from "@/lib/analytics-recap/readAnalyticsRecapConfig";

/**
 * Posts to the same #analytics webhook as the GA4 recap. Returns null when any
 * value is missing or malformed; never echoes values.
 */
export function readInstagramRecapConfig(): InstagramRecapConfig | null {
  const webhookUrl = process.env.SLACK_ANALYTICS_WEBHOOK_URL?.trim() ?? "";
  const pageToken = (process.env.INSTAGRAM_PAGE_ACCESS_TOKEN ?? "")
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
  if (!validWebhook(webhookUrl) || !/^[A-Za-z0-9_\-.]{20,}$/.test(pageToken))
    return null;
  return { webhookUrl, pageToken };
}
