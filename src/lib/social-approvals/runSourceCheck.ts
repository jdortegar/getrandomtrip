import { getProfile } from "@/lib/instagram-recap/instagramClient";
import {
  MIRRORED_STATUSES,
  listSourceRows,
  markSyncedThrough,
  recordNewSource,
  recordSourceMessage,
} from "@/lib/db/socialSources";
import { approvalConfig } from "./slackApproval";
import { socialSourceConfig } from "./socialAccounts";
import { listSourceMedia, shortcodeOf, type SourceMedia } from "./sourceMedia";
import { sourceMessage } from "./sourceMessage";

async function readSourceFeed() {
  const config = approvalConfig();
  const source = socialSourceConfig();
  if (!config || !source) throw new Error("SOURCE_UNCONFIGURED");
  const profile = await getProfile(source.token);
  if (profile.username !== source.username)
    throw new Error("SOURCE_ACCOUNT_MISMATCH");
  return {
    config,
    media: await listSourceMedia(source.token, profile.userId),
  };
}

/**
 * @getrandomtrip.en mirrors @getrandomtrip.es post by post, in order, without
 * skipping. Announces the oldest Spanish post not yet mirrored, and only when
 * no earlier post is still in progress. Nothing happens until a sync starting
 * point exists (setSyncBaseline).
 */
export async function advanceSourceQueue() {
  const { config, media } = await readSourceFeed();
  const rows = await listSourceRows();
  if (!rows.length) return { announced: 0, reason: "BASELINE_REQUIRED" };
  if (rows.some((r) => !MIRRORED_STATUSES.includes(r.status)))
    return { announced: 0, reason: "IN_PROGRESS" };
  const known = new Set(rows.map((r) => r.igMediaId));
  // Never go back before the newest mirrored post.
  const latest = Math.max(...rows.map((r) => r.postedAt.getTime()));
  const waiting = media.filter(
    (m) => !known.has(m.id) && m.postedAt.getTime() > latest,
  );
  const next = waiting[0];
  if (!next) return { announced: 0, reason: "UP_TO_DATE" };
  // Unique igMediaId: a concurrent advance cannot announce it twice.
  const row = await recordNewSource(next);
  if (!row) return { announced: 0, reason: "IN_PROGRESS" };
  await announce(config, row, next, waiting.length - 1);
  return { announced: 1, behind: waiting.length - 1 };
}

async function announce(
  config: NonNullable<ReturnType<typeof approvalConfig>>,
  row: NonNullable<Awaited<ReturnType<typeof recordNewSource>>>,
  media: SourceMedia,
  behind: number,
) {
  // A failed post leaves the row ANNOUNCING; it is never re-posted automatically.
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: config.channel,
      ...sourceMessage(row, media.previewUrl, null, behind),
      unfurl_links: false,
      unfurl_media: false,
    }),
    signal: AbortSignal.timeout(5000),
  });
  const result = (await response.json()) as { ok?: boolean; ts?: string };
  if (!response.ok || !result.ok || !result.ts)
    throw new Error("SLACK_DELIVERY_UNCONFIRMED");
  await recordSourceMessage(row.id, result.ts);
}

/**
 * Sets the sync starting point: the Spanish post with this shortcode and every
 * earlier one are already on @getrandomtrip.en. Then announces the next post.
 */
export async function setSyncBaseline(shortcode: string) {
  const { media } = await readSourceFeed();
  const index = media.findIndex((m) => shortcodeOf(m.permalink) === shortcode);
  if (index < 0) throw new Error("BASELINE_NOT_FOUND");
  const marked = await markSyncedThrough(media.slice(0, index + 1));
  return { marked, ...(await advanceSourceQueue()) };
}

/**
 * Best effort for the weekday Instagram recap and after each publication or
 * manual mark. Skips quietly while Slack approvals are disabled; never throws.
 */
export async function announceNextSourcePost() {
  if (!approvalConfig()) return;
  try {
    await advanceSourceQueue();
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    console.error(`[social-sources] check failed: ${code.slice(0, 60)}`);
  }
}
