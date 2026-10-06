import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { getWithMetadataMock } = vi.hoisted(() => ({
  getWithMetadataMock: vi.fn(),
}));
vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => ({ getWithMetadata: getWithMetadataMock })),
}));

const PARAMS = { path: ["user123", "avatar", "photo-1700000000000.webp"] };

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

function blob(etag?: string) {
  return {
    data: new Blob([new Uint8Array([1, 2, 3])]),
    etag,
    metadata: { contentType: "image/webp" },
  };
}

describe("GET /api/upload/[...path]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWithMetadataMock.mockResolvedValue(blob("blob-etag-1"));
  });

  it("serves immutable public caching with a strong ETag", async () => {
    const { GET } = await import("../[...path]/route");
    const res = await GET(makeRequest(), { params: Promise.resolve(PARAMS) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    const etag = res.headers.get("ETag");
    expect(etag).toMatch(/^"[a-f0-9]+"$/);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
  });

  it("returns 304 with no body when If-None-Match matches", async () => {
    const { GET } = await import("../[...path]/route");
    const first = await GET(makeRequest(), { params: Promise.resolve(PARAMS) });
    const etag = first.headers.get("ETag") as string;

    const res = await GET(makeRequest({ "if-none-match": etag }), {
      params: Promise.resolve(PARAMS),
    });

    expect(res.status).toBe(304);
    expect(await res.text()).toBe("");
    expect(res.headers.get("ETag")).toBe(etag);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("returns 200 when If-None-Match does not match", async () => {
    const { GET } = await import("../[...path]/route");
    const res = await GET(makeRequest({ "if-none-match": '"stale"' }), {
      params: Promise.resolve(PARAMS),
    });
    expect(res.status).toBe(200);
  });

  it("falls back to a key-derived ETag when the blob exposes none", async () => {
    getWithMetadataMock.mockResolvedValue(blob(undefined));
    const { GET } = await import("../[...path]/route");
    const res = await GET(makeRequest(), { params: Promise.resolve(PARAMS) });
    expect(res.headers.get("ETag")).toMatch(/^"[a-f0-9]+"$/);
  });

  it("does not cache 404 responses as immutable", async () => {
    getWithMetadataMock.mockResolvedValue(null);
    const { GET } = await import("../[...path]/route");
    const res = await GET(makeRequest(), { params: Promise.resolve(PARAMS) });
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control") ?? "").not.toContain("immutable");
  });
});
