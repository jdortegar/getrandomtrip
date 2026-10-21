// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createMediaContainer,
  publishContainer,
  waitForContainer,
} from "../instagramPublish";

let fetchMock: ReturnType<typeof vi.fn>;
let ids: number;
beforeEach(() => {
  ids = 0;
  fetchMock = vi
    .fn()
    .mockImplementation(async () => Response.json({ id: `c${++ids}` }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
const form = (call: unknown[]) =>
  Object.fromEntries(
    new URLSearchParams(String((call[1] as RequestInit).body)),
  );

it("creates one image container with the caption, keeping the token out of the URL", async () => {
  expect(
    await createMediaContainer("tok", "ig", ["https://a/1.jpg"], "Hi"),
  ).toBe("c1");
  expect(fetchMock.mock.calls[0][0]).toBe(
    "https://graph.facebook.com/v23.0/ig/media",
  );
  expect(form(fetchMock.mock.calls[0])).toEqual({
    image_url: "https://a/1.jpg",
    caption: "Hi",
    access_token: "tok",
  });
});
it("creates carousel children in order, then the carousel with the caption", async () => {
  expect(
    await createMediaContainer(
      "tok",
      "ig",
      ["https://a/1.jpg", "https://a/2.jpg"],
      "Hi",
    ),
  ).toBe("c3");
  expect(form(fetchMock.mock.calls[0])).toMatchObject({
    image_url: "https://a/1.jpg",
    is_carousel_item: "true",
  });
  expect(form(fetchMock.mock.calls[2])).toMatchObject({
    media_type: "CAROUSEL",
    children: "c1,c2",
    caption: "Hi",
  });
});
it("waits for FINISHED and fails on ERROR", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ status_code: "IN_PROGRESS" }))
    .mockResolvedValueOnce(Response.json({ status_code: "FINISHED" }));
  await waitForContainer("tok", "c1", { delayMs: 0 });
  fetchMock.mockResolvedValueOnce(Response.json({ status_code: "ERROR" }));
  await expect(waitForContainer("tok", "c1", { delayMs: 0 })).rejects.toThrow(
    "INSTAGRAM_CONTAINER_FAILED",
  );
});
it("publishes the container and reports Meta rejections generically", async () => {
  expect(await publishContainer("tok", "ig", "c9")).toBe("c1");
  expect(form(fetchMock.mock.calls[0])).toMatchObject({ creation_id: "c9" });
  fetchMock.mockResolvedValueOnce(
    new Response("secret details", { status: 400 }),
  );
  await expect(publishContainer("tok", "ig", "c9")).rejects.toThrow(
    "INSTAGRAM_REQUEST_REJECTED",
  );
});
