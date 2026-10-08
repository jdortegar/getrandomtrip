// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const { fetchRecap, post } = vi.hoisted(() => ({
  fetchRecap: vi.fn(),
  post: vi.fn(),
}));
vi.mock("../fetchInstagramRecap", () => ({ fetchInstagramRecap: fetchRecap }));
vi.mock("@/lib/analytics-recap/postToSlack", () => ({ postToSlack: post }));
vi.mock("../recapStore", () => ({ getRecapStore: vi.fn() }));
import { runInstagramRecap } from "../runInstagramRecap";

const config = {
  webhookUrl: "https://hooks.slack.com/services/T/B/x",
  pageToken: "page-token",
};
const store = { get: vi.fn(), setJSON: vi.fn() };
const zero = {
  views: 0,
  reach: 0,
  accountsEngaged: 0,
  interactions: 0,
  profileViews: 0,
  linkTaps: 0,
};
const win = {
  start: "2026-10-07",
  end: "2026-10-07",
  sinceSec: 0,
  untilSec: 0,
};
const recap = {
  username: "getrandomtrip",
  current: win,
  previous: win,
  totals: zero,
  previousTotals: zero,
  followers: 154,
  followerDelta: null,
  published: [],
  topPost: null,
};

beforeEach(() => {
  fetchRecap.mockReset().mockResolvedValue(recap);
  post.mockReset().mockResolvedValue(undefined);
});

it("fetches with the Page token and posts once", async () => {
  await runInstagramRecap(config, store);
  expect(fetchRecap.mock.calls[0][0]).toBe("page-token");
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][0]).toBe(config.webhookUrl);
  expect(post.mock.calls[0][1].text).toContain("Instagram @getrandomtrip");
});

it("does not post when Instagram fails", async () => {
  fetchRecap.mockRejectedValue(new Error("instagram_request_failed"));
  await expect(runInstagramRecap(config, store)).rejects.toThrow(
    "instagram_request_failed",
  );
  expect(post).not.toHaveBeenCalled();
});
