import type {
  DailyRecap,
  Ga4Config,
  RecapRankedItem,
  RecapTotals,
} from "@/types/analyticsRecap";
import {
  getGa4AccessToken,
  runGa4BatchReports,
  type Ga4Report,
  type Ga4Row,
} from "./ga4Client";

const YESTERDAY = { startDate: "yesterday", endDate: "yesterday" };
const LAST_WEEK = { startDate: "8daysAgo", endDate: "8daysAgo" };
const TOP_N = 5;
const EVENTS = ["sign_up", "generate_lead", "waitlist_join", "purchase"];
const DAY_MS = 86_400_000;

const top = (dimension: string, metric: string) => ({
  dateRanges: [YESTERDAY],
  dimensions: [{ name: dimension }],
  metrics: [{ name: metric }],
  orderBys: [{ metric: { metricName: metric }, desc: true }],
  limit: TOP_N,
});

function buildRequests(): object[] {
  return [
    {
      // No `date` dimension: GA4 crosses it with every range and emits zero
      // rows (last week's date under the current range) that clobber totals.
      dateRanges: [
        { ...YESTERDAY, name: "current" },
        { ...LAST_WEEK, name: "previous" },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    },
    top("country", "activeUsers"),
    top("sessionDefaultChannelGroup", "sessions"),
    top("pagePath", "screenPageViews"),
    {
      dateRanges: [YESTERDAY],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: EVENTS },
        },
      },
    },
  ];
}

const num = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const dim = (row: Ga4Row, i = 0) => row.dimensionValues?.[i]?.value ?? "";
const metric = (row: Ga4Row, i = 0) => num(row.metricValues?.[i]?.value);

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const ranked = (report: Ga4Report): RecapRankedItem[] =>
  (report.rows ?? [])
    .slice(0, TOP_N)
    .map((row) => ({ label: dim(row) || "(not set)", value: metric(row) }));

const emptyTotals = (): RecapTotals => ({
  activeUsers: 0,
  newUsers: 0,
  sessions: 0,
  pageViews: 0,
});

/**
 * Reads yesterday vs the same weekday last week. GA4 resolves the relative
 * ranges in the property timezone (Argentina, UTC-3, no DST); header dates are
 * derived from `now` in the same offset.
 */
export async function fetchDailyRecap(
  config: Ga4Config,
  now: Date = new Date(),
): Promise<DailyRecap> {
  const accessToken = await getGa4AccessToken(config);
  const requests = buildRequests();
  const reports = await runGa4BatchReports(config, accessToken, requests);
  if (reports.length < requests.length) throw new Error("ga4_report_failed");
  const [totalsReport, countries, channels, pages, events] = reports;

  const current = emptyTotals();
  const previous = emptyTotals();
  for (const row of totalsReport.rows ?? []) {
    const range = dim(row);
    const target =
      range === "current" ? current : range === "previous" ? previous : null;
    if (!target) continue;
    target.activeUsers = metric(row, 0);
    target.newUsers = metric(row, 1);
    target.sessions = metric(row, 2);
    target.pageViews = metric(row, 3);
  }
  const localNow = now.getTime() - 3 * 3_600_000;
  const date = isoDay(localNow - DAY_MS);
  const compareDate = isoDay(localNow - 8 * DAY_MS);

  const counts = new Map(
    (events.rows ?? []).map((row) => [dim(row), metric(row)] as const),
  );
  return {
    date,
    compareDate,
    current,
    previous,
    countries: ranked(countries),
    channels: ranked(channels),
    pages: ranked(pages),
    actions: {
      signUps: counts.get("sign_up") ?? 0,
      leads: counts.get("generate_lead") ?? 0,
      waitlist: counts.get("waitlist_join") ?? 0,
      purchases: counts.get("purchase") ?? 0,
    },
  };
}
