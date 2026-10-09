// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { getAccountTotals, getProfile } from "../instagramClient";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

it("reads the Instagram account linked to the Page token", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    json({
      instagram_business_account: {
        id: "17841400000000000",
        username: "getrandomtrip",
        followers_count: 154,
      },
      id: "1234",
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  expect(await getProfile("page-token")).toEqual({
    userId: "17841400000000000",
    username: "getrandomtrip",
    followers: 154,
  });
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe("https://graph.facebook.com/v23.0/me");
  expect(url.searchParams.get("fields")).toBe(
    "instagram_business_account{id,username,followers_count}",
  );
});

it("fails generically when the Page has no linked Instagram account", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ id: "1234" })));
  await expect(getProfile("page-token")).rejects.toThrow(
    "instagram_request_failed",
  );
});

it("never leaks upstream errors or the token", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(json({ error: { message: "secret" } }, 400)),
  );
  const err = await getProfile("page-token").catch((e: Error) => e);
  expect((err as Error).message).toBe("instagram_request_failed");
});

it("maps total_value account insights", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      json({
        data: [
          { name: "views", total_value: { value: 600 } },
          { name: "reach", total_value: { value: 300 } },
          { name: "website_clicks", total_value: { value: 4 } },
        ],
      }),
    ),
  );
  expect(await getAccountTotals("t", "1784", 0, 86_400)).toEqual({
    views: 600,
    reach: 300,
    accountsEngaged: 0,
    interactions: 0,
    profileViews: 0,
    linkTaps: 4,
  });
});
