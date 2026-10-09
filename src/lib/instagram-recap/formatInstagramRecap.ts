import type {
  InstagramMediaKind,
  InstagramPostStats,
  InstagramRecap,
  InstagramRecapWindow,
} from "@/types/instagramRecap";
import type { SlackRecapPayload } from "@/types/analyticsRecap";
import { formatWeekOverWeek } from "@/lib/analytics-recap/formatRecapMessage";

// Internal ops copy posted to Slack, not site UI: intentionally English-only
// and outside the es/en dictionaries (same as the GA4 recap).
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CAPTION_MAX = 60;
const KIND_LABEL: Record<InstagramMediaKind, string> = {
  REELS: "reel",
  FEED: "post",
  STORY: "story",
  AD: "ad",
};

function formatDay(isoDate: string): string {
  const day = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return isoDate;
  return `${WEEKDAYS[day.getUTCDay()]} ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`;
}

const formatWindow = (w: InstagramRecapWindow) =>
  w.start === w.end
    ? formatDay(w.start)
    : `${formatDay(w.start)} – ${formatDay(w.end)}`;

/** Slack mrkdwn control characters must be escaped in Instagram-provided text. */
const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function captionPreview(caption: string): string {
  const line = caption.replace(/[⁣\s]+/g, " ").trim();
  if (!line) return "(no caption)";
  const chars = Array.from(line);
  return chars.length <= CAPTION_MAX
    ? line
    : `${chars
        .slice(0, CAPTION_MAX - 1)
        .join("")
        .trimEnd()}…`;
}

function postLink(post: InstagramPostStats): string {
  const label = escapeSlack(captionPreview(post.caption)).replace(/\|/g, "¦");
  return post.permalink.startsWith("https://")
    ? `<${post.permalink}|${label}>`
    : label;
}

function summarizePublished(posts: InstagramPostStats[]): string {
  if (posts.length === 0) return "nothing new";
  const counts = new Map<string, number>();
  for (const p of posts) {
    const label = KIND_LABEL[p.kind];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return `${posts.length} (${[...counts].map(([k, n]) => `${n} ${k}${n > 1 ? "s" : ""}`).join(", ")})`;
}

export function formatInstagramRecap(recap: InstagramRecap): SlackRecapPayload {
  const { totals: c, previousTotals: p } = recap;
  const metric = (label: string, now: number, before: number) =>
    `${label} ${now} (${formatWeekOverWeek(now, before)})`;
  const delta = recap.followerDelta;
  const followers = delta
    ? `👥 Followers ${recap.followers} (${delta.change >= 0 ? "+" : ""}${delta.change} since ${formatDay(delta.since)})`
    : `👥 Followers ${recap.followers}`;
  const tapRate =
    c.profileViews > 0
      ? `${Math.round((c.linkTaps / c.profileViews) * 100)}% of profile visits tapped the bio link`
      : "no profile visits";
  const top = recap.topPost;
  const lines = [
    `📸 *Instagram @${escapeSlack(recap.username)}* — ${formatWindow(recap.current)} (vs ${formatWindow(recap.previous)})`,
    [
      metric("Views", c.views, p.views),
      metric("Reach", c.reach, p.reach),
      metric("Engaged", c.accountsEngaged, p.accountsEngaged),
      metric("Interactions", c.interactions, p.interactions),
    ].join(" · "),
    [
      metric("Profile visits", c.profileViews, p.profileViews),
      metric("Link taps", c.linkTaps, p.linkTaps),
    ].join(" · ") + ` — ${tapRate}`,
    followers,
    `📝 Published: ${summarizePublished(recap.published)}`,
    top
      ? `🏆 Top of last 7 days: ${postLink(top)} — ${KIND_LABEL[top.kind]} · views ${top.views} · reach ${top.reach} · likes ${top.likes} · comments ${top.comments} · saves ${top.saves} · shares ${top.shares}`
      : "🏆 Top of last 7 days: no posts",
    "⚠️ Instagram can take up to 48h to finalize these numbers",
  ];
  const text = lines.join("\n");
  return {
    text,
    blocks: [{ type: "section", text: { type: "mrkdwn", text } }],
    unfurl_links: false,
    unfurl_media: false,
  };
}
