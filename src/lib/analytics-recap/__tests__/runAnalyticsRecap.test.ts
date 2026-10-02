// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const { fetchRecap, post } = vi.hoisted(() => ({
  fetchRecap: vi.fn(),
  post: vi.fn(),
}));
vi.mock("../fetchDailyRecap", () => ({ fetchDailyRecap: fetchRecap }));
vi.mock("../postToSlack", () => ({ postToSlack: post }));
import { runAnalyticsRecap } from "../runAnalyticsRecap";

const config = {
  webhookUrl: "https://hooks.slack.com/services/T/B/x",
  ga4: { propertyId: "1", clientEmail: "a@b.c", privateKey: "k" },
};
const recap = {
  date: "2026-10-01",
  compareDate: "2026-09-24",
  current: { activeUsers: 1, newUsers: 1, sessions: 1, pageViews: 1 },
  previous: { activeUsers: 1, newUsers: 1, sessions: 1, pageViews: 1 },
  countries: [],
  channels: [],
  pages: [],
  actions: { signUps: 0, leads: 0, waitlist: 0, purchases: 0 },
};
beforeEach(() => {
  fetchRecap.mockReset().mockResolvedValue(recap);
  post.mockReset().mockResolvedValue(undefined);
});

it("fetches, formats and posts once", async () => {
  await runAnalyticsRecap(config);
  expect(fetchRecap).toHaveBeenCalledWith(config.ga4);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][0]).toBe(config.webhookUrl);
  expect(post.mock.calls[0][1].text).toContain("Visitors 1 (+0%)");
});

it("does not post when GA4 fails", async () => {
  fetchRecap.mockRejectedValue(new Error("ga4_report_failed"));
  await expect(runAnalyticsRecap(config)).rejects.toThrow("ga4_report_failed");
  expect(post).not.toHaveBeenCalled();
});

it("propagates Slack failures", async () => {
  post.mockRejectedValue(new Error("slack_post_failed"));
  await expect(runAnalyticsRecap(config)).rejects.toThrow("slack_post_failed");
});
