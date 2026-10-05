// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const { token, batch } = vi.hoisted(() => ({
  token: vi.fn(),
  batch: vi.fn(),
}));
vi.mock("../ga4Client", () => ({
  getGa4AccessToken: token,
  runGa4BatchReports: batch,
}));
import { fetchDailyRecap } from "../fetchDailyRecap";

const config = { propertyId: "1", clientEmail: "a@b.c", privateKey: "k" };
const row = (dims: string[], metrics: number[]) => ({
  dimensionValues: dims.map((value) => ({ value })),
  metricValues: metrics.map((value) => ({ value: String(value) })),
});
const reports = () => [
  {
    rows: [
      // Order is not guaranteed; mapping must key on the range name.
      row(["previous"], [100, 80, 150, 500]),
      row(["current"], [142, 120, 168, 610]),
    ],
  },
  { rows: [row(["Argentina"], [61]), row(["Spain"], [28])] },
  { rows: [row(["Organic Search"], [70])] },
  { rows: [row(["/"], [200]), row(["/journey"], [90])] },
  { rows: [row(["sign_up"], [4]), row(["purchase"], [1])] },
];
beforeEach(() => {
  token.mockReset().mockResolvedValue("tok");
  batch.mockReset().mockResolvedValue(reports());
});

it("maps GA4 reports into a DailyRecap with missing events as 0", async () => {
  const recap = await fetchDailyRecap(
    config,
    new Date("2026-10-02T12:00:00Z"), // 09:00 on 2 Oct in UTC-3
  );
  expect(recap).toEqual({
    date: "2026-10-01",
    compareDate: "2026-09-24",
    current: { activeUsers: 142, newUsers: 120, sessions: 168, pageViews: 610 },
    previous: { activeUsers: 100, newUsers: 80, sessions: 150, pageViews: 500 },
    countries: [
      { label: "Argentina", value: 61 },
      { label: "Spain", value: 28 },
    ],
    channels: [{ label: "Organic Search", value: 70 }],
    pages: [
      { label: "/", value: 200 },
      { label: "/journey", value: 90 },
    ],
    actions: { signUps: 4, leads: 0, waitlist: 0, purchases: 1 },
  });
});

it("sends one authenticated batch with the five expected reports", async () => {
  await fetchDailyRecap(config);
  expect(token).toHaveBeenCalledWith(config);
  const [, accessToken, requests] = batch.mock.calls[0];
  expect(accessToken).toBe("tok");
  expect(requests).toHaveLength(5);
  const [totals, countries, channels, pages, events] = requests;
  // No `date` dimension: GA4 crosses it with both ranges and emits zero rows
  // (e.g. last week's date under the current range) that overwrote totals.
  expect(totals.dateRanges).toEqual([
    { startDate: "yesterday", endDate: "yesterday", name: "current" },
    { startDate: "8daysAgo", endDate: "8daysAgo", name: "previous" },
  ]);
  expect(totals.dimensions).toBeUndefined();
  expect(totals.metrics.map((m: { name: string }) => m.name)).toEqual([
    "activeUsers",
    "newUsers",
    "sessions",
    "screenPageViews",
  ]);
  expect(countries.dimensions).toEqual([{ name: "country" }]);
  expect(countries.limit).toBe(5);
  expect(countries.orderBys[0].metric.metricName).toBe("activeUsers");
  expect(channels.dimensions).toEqual([{ name: "sessionDefaultChannelGroup" }]);
  expect(channels.orderBys[0].metric.metricName).toBe("sessions");
  expect(pages.dimensions).toEqual([{ name: "pagePath" }]);
  expect(pages.orderBys[0].metric.metricName).toBe("screenPageViews");
  expect(events.dimensionFilter.filter.inListFilter.values).toEqual([
    "sign_up",
    "generate_lead",
    "waitlist_join",
    "purchase",
  ]);
  for (const r of [countries, channels, pages, events])
    expect(r.dateRanges).toEqual([
      { startDate: "yesterday", endDate: "yesterday" },
    ]);
});

it("handles a zero-traffic day with empty reports and computes UTC-3 dates", async () => {
  batch.mockResolvedValue([{}, {}, {}, {}, {}]);
  const recap = await fetchDailyRecap(
    config,
    new Date("2026-10-02T02:00:00Z"), // 23:00 on 1 Oct in UTC-3
  );
  expect(recap.date).toBe("2026-09-30");
  expect(recap.compareDate).toBe("2026-09-23");
  expect(recap.current.activeUsers).toBe(0);
  expect(recap.countries).toEqual([]);
  expect(recap.actions).toEqual({
    signUps: 0,
    leads: 0,
    waitlist: 0,
    purchases: 0,
  });
});

it("treats non-numeric metric values as 0", async () => {
  const r = reports();
  r[1] = { rows: [row(["Chile"], [Number.NaN])] };
  batch.mockResolvedValue(r);
  expect((await fetchDailyRecap(config)).countries).toEqual([
    { label: "Chile", value: 0 },
  ]);
});

it("rejects when GA4 returns fewer reports than requested", async () => {
  batch.mockResolvedValue(reports().slice(0, 3));
  await expect(fetchDailyRecap(config)).rejects.toThrow("ga4_report_failed");
});

it("propagates token failures", async () => {
  token.mockRejectedValue(new Error("ga4_token_failed"));
  await expect(fetchDailyRecap(config)).rejects.toThrow("ga4_token_failed");
  expect(batch).not.toHaveBeenCalled();
});
