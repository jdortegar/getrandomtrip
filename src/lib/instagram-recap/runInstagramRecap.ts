import type { InstagramRecapConfig } from "@/types/instagramRecap";
import { postToSlack } from "@/lib/analytics-recap/postToSlack";
import { fetchInstagramRecap } from "./fetchInstagramRecap";
import { formatInstagramRecap } from "./formatInstagramRecap";
import { getRecapStore, type RecapBlobStore } from "./recapStore";

/** Fetch first, post once: an Instagram failure never produces a partial Slack post. */
export async function runInstagramRecap(
  config: InstagramRecapConfig,
  store: RecapBlobStore = getRecapStore(),
  now: Date = new Date(),
): Promise<void> {
  const recap = await fetchInstagramRecap(config.pageToken, store, now);
  await postToSlack(config.webhookUrl, formatInstagramRecap(recap));
}
