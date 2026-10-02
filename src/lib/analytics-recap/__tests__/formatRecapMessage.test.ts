import { expect, it } from "vitest";
import type { DailyRecap } from "@/types/analyticsRecap";
import { formatRecapMessage, formatWeekOverWeek } from "../formatRecapMessage";

const base: DailyRecap = {
  date: "2026-10-01",
  compareDate: "2026-09-24",
  current: { activeUsers: 142, newUsers: 120, sessions: 168, pageViews: 610 },
  previous: { activeUsers: 120, newUsers: 98, sessions: 150, pageViews: 500 },
  countries: [
    { label: "Argentina", value: 61 },
    { label: "Spain", value: 28 },
  ],
  channels: [
    { label: "Organic Search", value: 70 },
    { label: "Direct", value: 40 },
  ],
  pages: [
    { label: "/", value: 200 },
    { label: "/journey", value: 90 },
  ],
  actions: { signUps: 4, leads: 9, waitlist: 3, purchases: 1 },
};

const body = (recap: DailyRecap) =>
  formatRecapMessage(recap).blocks[0].text.text;

it("renders the agreed layout for a normal day", () => {
  expect(body(base)).toBe(
    [
      "📊 *GetRandomTrip* — Thu 1 Oct (vs Thu 24 Sep)",
      "Visitors 142 (+18%) · New 120 (+22%) · Sessions 168 (+12%) · Page views 610 (+22%)",
      "🌎 Countries: Argentina 61 · Spain 28",
      "🔗 Sources: Organic Search 70 · Direct 40",
      "📄 Top pages: / 200 · /journey 90",
      "🎯 Actions: sign-ups 4 · leads 9 · waitlist 3 · purchases 1",
      "⚠️ Only counts visitors who accepted cookies",
    ].join("\n"),
  );
});

it("uses the same content as the plain-text fallback", () => {
  const payload = formatRecapMessage(base);
  expect(payload.text).toContain("Visitors 142 (+18%)");
  expect(payload.unfurl_links).toBe(false);
});

it("renders a zero-traffic day without NaN or Infinity", () => {
  const zero: DailyRecap = {
    ...base,
    current: { activeUsers: 0, newUsers: 0, sessions: 0, pageViews: 0 },
    previous: { activeUsers: 0, newUsers: 0, sessions: 0, pageViews: 0 },
    countries: [],
    channels: [],
    pages: [],
    actions: { signUps: 0, leads: 0, waitlist: 0, purchases: 0 },
  };
  const text = body(zero);
  expect(text).not.toMatch(/NaN|Infinity/);
  expect(text).toContain("Visitors 0 (–)");
  expect(text).toContain("🌎 Countries: none");
  expect(text).toContain("🔗 Sources: none");
  expect(text).toContain("📄 Top pages: none");
});

it("shows 'new' when last week was zero and today is not", () => {
  const text = body({
    ...base,
    previous: { activeUsers: 0, newUsers: 0, sessions: 0, pageViews: 0 },
  });
  expect(text).toContain("Visitors 142 (new)");
});

it("formats week-over-week deltas", () => {
  expect(formatWeekOverWeek(150, 100)).toBe("+50%");
  expect(formatWeekOverWeek(50, 100)).toBe("-50%");
  expect(formatWeekOverWeek(100, 100)).toBe("+0%");
  expect(formatWeekOverWeek(1, 3)).toBe("-67%");
  expect(formatWeekOverWeek(5, 0)).toBe("new");
  expect(formatWeekOverWeek(0, 0)).toBe("–");
  expect(formatWeekOverWeek(0, 10)).toBe("-100%");
});

it("keeps order and truncates each list to five entries", () => {
  const many = Array.from({ length: 7 }, (_, i) => ({
    label: `C${i}`,
    value: 10 - i,
  }));
  const text = body({ ...base, countries: many });
  expect(text).toContain("Countries: C0 10 · C1 9 · C2 8 · C3 7 · C4 6\n");
  expect(text).not.toContain("C5");
});

it("escapes Slack control characters in GA4-provided labels", () => {
  const text = body({
    ...base,
    pages: [{ label: "/<!channel>&x", value: 3 }],
  });
  expect(text).toContain("/&lt;!channel&gt;&amp;x 3");
  expect(text).not.toContain("<!channel>");
});
