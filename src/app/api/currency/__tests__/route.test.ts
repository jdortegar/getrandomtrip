import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

const RATES_OK = { result: "success", rates: { USD: 1, ARS: 1200, EUR: 0.9 } };

function makeRequest(
  headers: Record<string, string> = {},
  query = "",
): Request {
  return new Request(`http://localhost/api/currency${query}`, { headers });
}

function nfGeo(code: string): string {
  return Buffer.from(JSON.stringify({ country: { code } })).toString("base64");
}

describe("GET /api/currency", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(RATES_OK))),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the detected local currency and its USD rate", async () => {
    const res = await GET(makeRequest({ "x-country": "AR" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ local: { currency: "ARS", rate: 1200 } });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("reads the country from the base64 x-nf-geo header", async () => {
    const res = await GET(makeRequest({ "x-nf-geo": nfGeo("es") }));
    expect(await res.json()).toEqual({ local: { currency: "EUR", rate: 0.9 } });
  });

  it("returns no local currency for US visitors without fetching rates", async () => {
    const res = await GET(makeRequest({ "x-country": "US" }));
    expect(await res.json()).toEqual({ local: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns no local currency when the country is not detected", async () => {
    const res = await GET(makeRequest({ "x-nf-geo": "not-base64-json" }));
    expect(await res.json()).toEqual({ local: null });
  });

  it("honors ?country=XX outside production", async () => {
    const res = await GET(makeRequest({ "x-country": "US" }, "?country=AR"));
    expect(await res.json()).toEqual({ local: { currency: "ARS", rate: 1200 } });
  });

  it("ignores ?country=XX in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await GET(makeRequest({ "x-country": "US" }, "?country=AR"));
    expect(await res.json()).toEqual({ local: null });
    vi.unstubAllEnvs();
  });

  it("returns no local currency when the rates API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const res = await GET(makeRequest({ "x-country": "AR" }));
    expect(await res.json()).toEqual({ local: null });
  });
});
