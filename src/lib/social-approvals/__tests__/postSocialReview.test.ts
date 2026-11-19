// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const record = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/socialApprovals", () => ({ recordSocialMessage: record }));
import { postSocialReview } from "../postSocialReview";
const config = {
  token: "secret",
  secret: "secret",
  channel: "channel",
  team: "team",
  app: "app",
};
const row = {
  id: "c123456789012345678901234",
  revision: 1,
  caption: "private caption",
  imageUrl: "https://private.test",
  status: "POSTING",
  decidedBy: null,
};
let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetAllMocks();
  log = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each(["post", "parse", "accept", "record"])(
  "diagnoses Slack %s failure without retrying or changing the thrown error",
  async (stage) => {
    const original = new Error("secret token/caption/URL");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, ts: "1.1" }),
      });
    if (stage === "post") fetchMock.mockRejectedValue(original);
    if (stage === "parse")
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw original;
        },
      });
    if (stage === "accept")
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: false,
          error: "invalid_auth",
          token: "secret",
        }),
      });
    if (stage === "record")
      record.mockRejectedValue(Object.assign(original, { code: "P2028" }));
    vi.stubGlobal("fetch", fetchMock);
    const failure = await postSocialReview(config, row).catch(
      (error: unknown) => error,
    );
    expect(failure).toEqual(
      stage === "accept" ? new Error("SLACK_DELIVERY_UNCONFIRMED") : original,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]).toEqual([
      "[social-diagnostics]",
      expect.objectContaining({
        stage: `slack.${stage}`,
        reviewId: row.id,
        ...(stage === "accept"
          ? { code: "invalid_auth", httpStatus: 200 }
          : {}),
      }),
    ]);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /secret|caption|private\.test/,
    );
  },
);
