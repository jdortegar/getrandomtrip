import { getProfile } from "@/lib/instagram-recap/instagramClient";
import { recordNewSource, recordSourceMessage } from "@/lib/db/socialSources";
import { approvalConfig } from "./slackApproval";
import { socialSourceConfig } from "./socialAccounts";
import { listSourceMedia, shortcodeOf } from "./sourceMedia";
import { sourceMessage } from "./sourceMessage";

/** The daily check only announces recent posts so older ones never flood Slack. */
export const SOURCE_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Announces new @getrandomtrip.es posts in Slack, at most once each. With a
 * shortcode it announces that one post regardless of age (backlog catch-up).
 */
export async function runSourceCheck(
  options: { shortcode?: string; now?: number } = {},
) {
  const config = approvalConfig();
  const source = socialSourceConfig();
  if (!config || !source) throw new Error("SOURCE_UNCONFIGURED");
  const profile = await getProfile(source.token);
  if (profile.username !== source.username)
    throw new Error("SOURCE_ACCOUNT_MISMATCH");
  const media = await listSourceMedia(source.token, profile.userId);
  const since = (options.now ?? Date.now()) - SOURCE_WINDOW_MS;
  const candidates = options.shortcode
    ? media.filter((m) => shortcodeOf(m.permalink) === options.shortcode)
    : media.filter((m) => m.postedAt.getTime() >= since);
  let announced = 0;
  for (const item of candidates.reverse()) {
    const row = await recordNewSource(item);
    if (!row) continue;
    // A failed post leaves the row ANNOUNCING; it is never re-posted automatically.
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: config.channel,
        ...sourceMessage(row, item.previewUrl),
        unfurl_links: false,
        unfurl_media: false,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { ok?: boolean; ts?: string };
    if (!response.ok || !result.ok || !result.ts)
      throw new Error("SLACK_DELIVERY_UNCONFIRMED");
    await recordSourceMessage(row.id, result.ts);
    announced += 1;
  }
  return { announced, matched: candidates.length };
}
