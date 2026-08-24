import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { sharpMock, callOrder, metadataMock, toBufferMock } = vi.hoisted(() => {
  const callOrder: string[] = [];
  const chainable: Record<string, unknown> = {};
  const rotate = vi.fn(() => {
    callOrder.push("rotate");
    return chainable;
  });
  const extract = vi.fn(() => {
    callOrder.push("extract");
    return chainable;
  });
  const resize = vi.fn(() => chainable);
  const webp = vi.fn(() => chainable);
  const metadataMock = vi.fn().mockResolvedValue({ width: 1000, height: 1000 });
  const toBufferMock = vi.fn().mockResolvedValue(Buffer.from("output-bytes"));
  Object.assign(chainable, {
    rotate,
    extract,
    resize,
    webp,
    metadata: metadataMock,
    toBuffer: toBufferMock,
  });
  const sharpMock = vi.fn(() => chainable);
  return { sharpMock, callOrder, metadataMock, toBufferMock };
});
vi.mock("sharp", () => ({ default: sharpMock }));

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { storeSetMock, storeGetMock, getStoreMock } = vi.hoisted(() => {
  const storeSetMock = vi.fn().mockResolvedValue(undefined);
  const storeGetMock = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
  const getStoreMock = vi.fn(() => ({ set: storeSetMock, get: storeGetMock }));
  return { storeSetMock, storeGetMock, getStoreMock };
});
vi.mock("@netlify/blobs", () => ({ getStore: getStoreMock }));

function makeFormRequest(fields: Record<string, string | File>): NextRequest {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value as never);
  }
  return { formData: async () => form } as unknown as NextRequest;
}

const VALID_CROP = JSON.stringify({ x: 0.1, y: 0, width: 0.8, height: 0.45 });

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;
    metadataMock.mockResolvedValue({ width: 1000, height: 1000 });
    toBufferMock.mockResolvedValue(Buffer.from("output-bytes"));
    storeSetMock.mockResolvedValue(undefined);
    storeGetMock.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    getServerSessionMock.mockResolvedValue({ user: { id: "user123" } });
  });

  it("no crop field -> byte-identical existing path: response is exactly {url}, one store.set call", async () => {
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    const request = makeFormRequest({ file, feature: "tripper-hero" });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body)).toEqual(["url"]);
    expect(typeof body.url).toBe("string");
    expect(storeSetMock).toHaveBeenCalledTimes(1);
  });

  it("crop + file -> two store.set calls (original + baked), response {url, originalUrl}", async () => {
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    const request = makeFormRequest({
      file,
      feature: "tripper-hero",
      crop: VALID_CROP,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.url).toBe("string");
    expect(typeof body.originalUrl).toBe("string");
    expect(storeSetMock).toHaveBeenCalledTimes(2);
  });

  it("crop + file -> sharp rotate() is invoked before extract() (EXIF ordering guard)", async () => {
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    const request = makeFormRequest({
      file,
      feature: "tripper-hero",
      crop: VALID_CROP,
    });

    await POST(request);

    const rotateIndex = callOrder.indexOf("rotate");
    const extractIndex = callOrder.indexOf("extract");
    expect(rotateIndex).toBeGreaterThanOrEqual(0);
    expect(extractIndex).toBeGreaterThan(rotateIndex);
  });

  it("crop + originalKey (re-crop path) -> one store.set call (baked only), originalUrl echoes input", async () => {
    const { POST } = await import("../route");
    const originalKey = "user123/tripper-hero-original/photo.png";
    const request = makeFormRequest({
      feature: "tripper-hero",
      crop: VALID_CROP,
      originalKey,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(storeSetMock).toHaveBeenCalledTimes(1);
    expect(body.originalUrl).toBe(`/api/upload/${originalKey}`);
    expect(typeof body.url).toBe("string");
  });

  it("unparseable/out-of-range crop -> 400 { error: 'Invalid crop' }, zero store.set calls", async () => {
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    const request = makeFormRequest({
      file,
      feature: "tripper-hero",
      crop: "not-json",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid crop" });
    expect(storeSetMock).not.toHaveBeenCalled();
  });

  it("originalKey not owned by session user -> 403 { error: 'Forbidden' }", async () => {
    const { POST } = await import("../route");
    const request = makeFormRequest({
      feature: "tripper-hero",
      crop: VALID_CROP,
      originalKey: "someone-else/tripper-hero-original/photo.png",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(storeSetMock).not.toHaveBeenCalled();
  });
});
