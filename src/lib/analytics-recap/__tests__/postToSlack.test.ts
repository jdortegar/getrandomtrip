// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { postToSlack } from "../postToSlack";

const URL_ = "https://hooks.slack.com/services/T000/B000/SECRETSECRET";
const payload = {
  text: "hi",
  blocks: [],
  unfurl_links: false,
  unfurl_media: false,
} as never;
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("posts JSON to the webhook with redirect protection and a timeout", async () => {
  fetchMock.mockResolvedValue(new Response("ok"));
  await postToSlack(URL_, payload);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(URL_);
  expect(init.method).toBe("POST");
  expect(init.redirect).toBe("error");
  expect(init.headers).toEqual({ "Content-Type": "application/json" });
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(JSON.parse(init.body)).toEqual(payload);
});

it("throws on non-2xx without leaking the webhook URL", async () => {
  fetchMock.mockResolvedValue(new Response("no_service", { status: 404 }));
  const error = await postToSlack(URL_, payload).catch((e: Error) => e);
  expect((error as Error).message).toBe("slack_post_failed");
  expect((error as Error).message).not.toContain("SECRETSECRET");
});

it("wraps network failures without leaking the webhook URL", async () => {
  fetchMock.mockRejectedValue(new Error(`boom ${URL_}`));
  const error = await postToSlack(URL_, payload).catch((e: Error) => e);
  expect((error as Error).message).toBe("slack_post_failed");
});
