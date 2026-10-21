// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  record: vi.fn(),
  recordTs: vi.fn(),
}));
vi.mock("@/lib/instagram-recap/instagramClient", () => ({
  getProfile: m.profile,
}));
vi.mock("../sourceMedia", async (original) => ({
  ...(await original<typeof import("../sourceMedia")>()),
  listSourceMedia: m.list,
}));
vi.mock("@/lib/db/socialSources", () => ({
  recordNewSource: m.record,
  recordSourceMessage: m.recordTs,
}));
import { announceNewSourcePosts, runSourceCheck } from "../runSourceCheck";

const now = Date.parse("2026-10-21T12:00:00Z");
const post = (id: string, hoursAgo: number, code = id) => ({
  id,
  caption: `Caption ${id}`,
  mediaType: "CAROUSEL_ALBUM",
  permalink: `https://www.instagram.com/p/${code}/`,
  postedAt: new Date(now - hoursAgo * 3_600_000),
  previewUrl: "https://cdn.test/1.jpg",
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
  m.list.mockResolvedValue([post("new", 70), post("old", 100)]);
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

it("announces only posts from the last 4 days (covers weekends) with a Translate this post button", async () => {
  expect(await runSourceCheck({ now })).toEqual({ announced: 1, matched: 1 });
  expect(m.record).toHaveBeenCalledOnce();
  expect(m.record.mock.calls[0][0].id).toBe("new");
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.channel).toBe("C0CAQS7HNH4");
  expect(JSON.stringify(body.blocks)).toContain("Translate this post");
  expect(m.recordTs).toHaveBeenCalledWith("row-new", "1.2");
});
it("never announces an already recorded post again", async () => {
  m.record.mockResolvedValue(null);
  expect(await runSourceCheck({ now })).toEqual({ announced: 0, matched: 1 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("announces one older post by shortcode for backlog catch-up", async () => {
  expect(await runSourceCheck({ now, shortcode: "old" })).toEqual({
    announced: 1,
    matched: 1,
  });
  expect(m.record.mock.calls[0][0].id).toBe("old");
});
it("refuses a token that belongs to another Instagram account", async () => {
  m.profile.mockResolvedValue({
    userId: "ig-en",
    username: "getrandomtrip.en",
  });
  await expect(runSourceCheck({ now })).rejects.toThrow(
    "SOURCE_ACCOUNT_MISMATCH",
  );
  expect(m.list).not.toHaveBeenCalled();
});
it("fails closed without Slack or source configuration", async () => {
  vi.stubEnv("INSTAGRAM_PAGE_ACCESS_TOKEN", "");
  await expect(runSourceCheck({ now })).rejects.toThrow("SOURCE_UNCONFIGURED");
  expect(m.profile).not.toHaveBeenCalled();
});
it("stops without recording the message when Slack does not confirm", async () => {
  fetchMock.mockResolvedValue(Response.json({ ok: false }));
  await expect(runSourceCheck({ now })).rejects.toThrow(
    "SLACK_DELIVERY_UNCONFIRMED",
  );
  expect(m.recordTs).not.toHaveBeenCalled();
});

it("the recap hook skips while approvals are disabled and never throws", async () => {
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "false");
  await announceNewSourcePosts();
  expect(m.profile).not.toHaveBeenCalled();
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "true");
  m.profile.mockRejectedValue(new Error("instagram_request_failed"));
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(announceNewSourcePosts()).resolves.toBeUndefined();
  expect(error).toHaveBeenCalledWith(
    "[social-sources] check failed: instagram_request_failed",
  );
  error.mockRestore();
});
