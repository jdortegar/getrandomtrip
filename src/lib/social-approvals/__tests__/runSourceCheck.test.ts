// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  rows: vi.fn(),
  record: vi.fn(),
  recordTs: vi.fn(),
  synced: vi.fn(),
}));
vi.mock("@/lib/instagram-recap/instagramClient", () => ({
  getProfile: m.profile,
}));
vi.mock("../sourceMedia", async (original) => ({
  ...(await original<typeof import("../sourceMedia")>()),
  listSourceMedia: m.list,
}));
vi.mock("@/lib/db/socialSources", () => ({
  MIRRORED_STATUSES: ["PUBLISHED", "SYNCED"],
  listSourceRows: m.rows,
  markSyncedThrough: m.synced,
  recordNewSource: m.record,
  recordSourceMessage: m.recordTs,
}));
import {
  advanceSourceQueue,
  announceNextSourcePost,
  setSyncBaseline,
} from "../runSourceCheck";

const day = (n: number) => new Date(Date.UTC(2026, 3, n));
const post = (code: string, n: number) => ({
  id: `ig-${code}`,
  caption: `Caption ${code}`,
  mediaType: "CAROUSEL_ALBUM",
  permalink: `https://www.instagram.com/p/${code}/`,
  postedAt: day(n),
  previewUrl: "https://cdn.test/1.jpg",
});
// Oldest first, as listSourceMedia returns them.
const feed = [post("P1", 1), post("P2", 2), post("P3", 3), post("P4", 4)];
const row = (code: string, n: number, status: string) => ({
  id: `row-${code}`,
  igMediaId: `ig-${code}`,
  status,
  postedAt: day(n),
});
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    SLACK_SOCIAL_APPROVALS_ENABLED: "true",
    SLACK_SOCIAL_BOT_TOKEN: "token",
    SLACK_SOCIAL_SIGNING_SECRET: "secret",
    INSTAGRAM_PAGE_ACCESS_TOKEN: "EAAG-page-token-value-123",
  }))
    vi.stubEnv(key, value);
  m.profile.mockResolvedValue({
    userId: "ig-es",
    username: "getrandomtrip.es",
  });
  m.list.mockResolvedValue(feed);
  m.rows.mockResolvedValue([row("P1", 1, "SYNCED")]);
  m.record.mockImplementation(async (media: { id: string }) => ({
    id: `row-${media.id}`,
    caption: "c",
    permalink: "https://www.instagram.com/p/x/",
    mediaType: "CAROUSEL_ALBUM",
    status: "ANNOUNCING",
  }));
  fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, ts: "1.2" }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("offers only the next Spanish post after the last mirrored one, with the backlog count", async () => {
  expect(await advanceSourceQueue()).toEqual({ announced: 1, behind: 2 });
  expect(m.record).toHaveBeenCalledOnce();
  expect(m.record.mock.calls[0][0].id).toBe("ig-P2");
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.channel).toBe("C0CAQS7HNH4");
  expect(JSON.stringify(body.blocks)).toContain("Translate this post");
  expect(JSON.stringify(body.blocks)).toContain("2 more Spanish posts waiting");
  expect(m.recordTs).toHaveBeenCalledWith("row-ig-P2", "1.2");
});
it("never offers the next post while an earlier one is still in progress", async () => {
  m.rows.mockResolvedValue([
    row("P1", 1, "SYNCED"),
    row("P2", 2, "TRANSLATED"),
  ]);
  expect(await advanceSourceQueue()).toEqual({
    announced: 0,
    reason: "IN_PROGRESS",
  });
  expect(m.record).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("waits for a sync starting point before offering anything", async () => {
  m.rows.mockResolvedValue([]);
  expect(await advanceSourceQueue()).toEqual({
    announced: 0,
    reason: "BASELINE_REQUIRED",
  });
  expect(m.list).toHaveBeenCalled();
  expect(m.record).not.toHaveBeenCalled();
});
it("never goes back before the newest mirrored post and stops when up to date", async () => {
  m.rows.mockResolvedValue([row("P4", 4, "PUBLISHED")]);
  expect(await advanceSourceQueue()).toEqual({
    announced: 0,
    reason: "UP_TO_DATE",
  });
  expect(m.record).not.toHaveBeenCalled();
});
it("sets the starting point through a shortcode, then offers the following post", async () => {
  m.synced.mockResolvedValue(2);
  m.rows.mockResolvedValue([row("P1", 1, "SYNCED"), row("P2", 2, "SYNCED")]);
  expect(await setSyncBaseline("P2")).toEqual({
    marked: 2,
    announced: 1,
    behind: 1,
  });
  expect(m.synced.mock.calls[0][0].map((p: { id: string }) => p.id)).toEqual([
    "ig-P1",
    "ig-P2",
  ]);
  expect(m.record.mock.calls[0][0].id).toBe("ig-P3");
  await expect(setSyncBaseline("NOPE")).rejects.toThrow("BASELINE_NOT_FOUND");
});
it("refuses a token that belongs to another Instagram account", async () => {
  m.profile.mockResolvedValue({
    userId: "ig-en",
    username: "getrandomtrip.en",
  });
  await expect(advanceSourceQueue()).rejects.toThrow("SOURCE_ACCOUNT_MISMATCH");
  expect(m.list).not.toHaveBeenCalled();
});
it("stops without recording the message when Slack does not confirm", async () => {
  fetchMock.mockResolvedValue(Response.json({ ok: false }));
  await expect(advanceSourceQueue()).rejects.toThrow(
    "SLACK_DELIVERY_UNCONFIRMED",
  );
  expect(m.recordTs).not.toHaveBeenCalled();
});
it("the recap hook skips while approvals are disabled and never throws", async () => {
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "false");
  await announceNextSourcePost();
  expect(m.profile).not.toHaveBeenCalled();
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "true");
  m.profile.mockRejectedValue(new Error("instagram_request_failed"));
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(announceNextSourcePost()).resolves.toBeUndefined();
  expect(error).toHaveBeenCalledWith(
    "[social-sources] check failed: instagram_request_failed",
  );
  error.mockRestore();
});
