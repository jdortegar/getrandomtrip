import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchShareIntent } from "../share-intent-client";

function respond(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchShareIntent", () => {
  it("shares one request between overlapping calls for the same payment", async () => {
    let resolve!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((r) => { resolve = r; }));
    vi.stubGlobal("fetch", fetchMock);

    const first = fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, []);
    const second = fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, []);
    resolve(respond(200, { clientSecret: "secret_1" }));

    expect(await first).toEqual({ kind: "ready", clientSecret: "secret_1" });
    expect(await second).toEqual({ kind: "ready", clientSecret: "secret_1" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends a new request once the previous one settled, and keeps other payments separate", async () => {
    const fetchMock = vi.fn(async () => respond(200, { clientSecret: "secret" }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, []);
    await fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, []);
    await Promise.all([
      fetchShareIntent("/api/stripe/share-intent", { travelerId: "t2" }, []),
      fetchShareIntent("/api/stripe/top-up-intent", { shareId: "s1" }, []),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["paid", 200, { paid: true }, { kind: "paid" }],
    ["closed", 409, { errorCode: "DEADLINE_PASSED" }, { kind: "closed" }],
    ["error", 409, { error: "Payment already in progress, please retry" }, { kind: "error" }],
  ])("maps a %s response", async (_label, status, body, expected) => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(status, body)));
    expect(await fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, ["DEADLINE_PASSED"])).toEqual(expected);
  });

  it("reports a network failure as an error and lets the next call retry", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(respond(200, { clientSecret: "s" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, [])).toEqual({ kind: "error" });
    expect(await fetchShareIntent("/api/stripe/share-intent", { travelerId: "t1" }, [])).toEqual({ kind: "ready", clientSecret: "s" });
  });
});
