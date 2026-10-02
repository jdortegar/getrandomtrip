import type { AnalyticsRecapConfig } from "@/types/analyticsRecap";
import { fetchDailyRecap } from "./fetchDailyRecap";
import { formatRecapMessage } from "./formatRecapMessage";
import { postToSlack } from "./postToSlack";

/** Fetch first, post once: a GA4 failure never produces a partial Slack post. */
export async function runAnalyticsRecap(
  config: AnalyticsRecapConfig,
): Promise<void> {
  const recap = await fetchDailyRecap(config.ga4);
  await postToSlack(config.webhookUrl, formatRecapMessage(recap));
}
