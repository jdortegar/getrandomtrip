import type {
  DailyRecap,
  RecapRankedItem,
  SlackRecapPayload,
} from "@/types/analyticsRecap";

// Internal ops copy posted to Slack, not site UI: intentionally English-only
// and outside the es/en dictionaries.
const TOP_N = 5;
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

/** Week-over-week change as an integer percent; never NaN/Infinity. */
export function formatWeekOverWeek(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new" : "–";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function formatDay(isoDate: string): string {
  const day = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return isoDate;
  return `${WEEKDAYS[day.getUTCDay()]} ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`;
}

/** Slack mrkdwn control characters must be escaped in GA4-provided text. */
function escapeSlack(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatList(items: RecapRankedItem[]): string {
  if (items.length === 0) return "none";
  return items
    .slice(0, TOP_N)
    .map((item) => `${escapeSlack(item.label)} ${item.value}`)
    .join(" · ");
}

export function formatRecapMessage(recap: DailyRecap): SlackRecapPayload {
  const { current: c, previous: p, actions: a } = recap;
  const metric = (label: string, now: number, before: number) =>
    `${label} ${now} (${formatWeekOverWeek(now, before)})`;
  const text = [
    `📊 *Randomtrip* — ${formatDay(recap.date)} (vs ${formatDay(recap.compareDate)})`,
    [
      metric("Visitors", c.activeUsers, p.activeUsers),
      metric("New", c.newUsers, p.newUsers),
      metric("Sessions", c.sessions, p.sessions),
      metric("Page views", c.pageViews, p.pageViews),
    ].join(" · "),
    `🌎 Countries: ${formatList(recap.countries)}`,
    `🔗 Sources: ${formatList(recap.channels)}`,
    `📄 Top pages: ${formatList(recap.pages)}`,
    `🎯 Actions: sign-ups ${a.signUps} · leads ${a.leads} · waitlist ${a.waitlist} · purchases ${a.purchases}`,
    "⚠️ Only counts visitors who accepted cookies",
  ].join("\n");
  return {
    text,
    blocks: [{ type: "section", text: { type: "mrkdwn", text } }],
    unfurl_links: false,
    unfurl_media: false,
  };
}
