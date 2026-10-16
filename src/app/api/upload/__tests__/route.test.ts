import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const {
  storeSetMock,
  storeGetMock,
  storeGetWithMetadataMock,
  storeDeleteMock,
  getStoreMock,
} = vi.hoisted(() => {
  const storeSetMock = vi.fn().mockResolvedValue(undefined);
  const storeGetMock = vi
    .fn()
    .mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
  const storeGetWithMetadataMock = vi.fn();
  const storeDeleteMock = vi.fn().mockResolvedValue(undefined);
  const getStoreMock = vi.fn((_name: string, _options?: unknown) => ({
    set: storeSetMock,
    get: storeGetMock,
    getWithMetadata: storeGetWithMetadataMock,
    delete: storeDeleteMock,
  }));
  return {
    storeSetMock,
    storeGetMock,
    storeGetWithMetadataMock,
    storeDeleteMock,
    getStoreMock,
  };
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

describe("GET /api/upload?key=", () => {
  const KEY = "user123/avatar/photo-1700000000000.webp";

  function makeGet(headers: Record<string, string> = {}): NextRequest {
    return {
      headers: new Headers(headers),
      nextUrl: new URL(`http://localhost/api/upload?key=${KEY}`),
    } as unknown as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    storeGetWithMetadataMock.mockResolvedValue({
      data: new Blob([new Uint8Array([1, 2, 3])]),
      etag: "blob-etag-1",
      metadata: { contentType: "image/webp" },
    });
  });

  it("stays non-shared-cacheable (private) because the CDN may key on path only", async () => {
    const { GET } = await import("../route");
    const res = await GET(makeGet());

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=86400");
    expect(res.headers.get("ETag")).toMatch(/^"[a-f0-9]+"$/);
  });

  it("returns 304 with no body when If-None-Match matches", async () => {
    const { GET } = await import("../route");
    const first = await GET(makeGet());
    const etag = first.headers.get("ETag") as string;

    const res = await GET(makeGet({ "if-none-match": etag }));

    expect(res.status).toBe(304);
    expect(await res.text()).toBe("");
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=86400");
  });
});

describe("environment-scoped media naming", () => {
  const storeNames = () => getStoreMock.mock.calls.map(([name]) => name);
  const setKeys = () => storeSetMock.mock.calls.map(([key]) => key as string);

  beforeEach(() => {
    vi.clearAllMocks();
    metadataMock.mockResolvedValue({ width: 1000, height: 1000 });
    toBufferMock.mockResolvedValue(Buffer.from("output-bytes"));
    storeSetMock.mockResolvedValue(undefined);
    storeGetMock.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    getServerSessionMock.mockResolvedValue({ user: { id: "user123" } });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("non-production POST writes to the shared store with a dev- filename", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });

    const response = await POST(makeFormRequest({ file, feature: "experience" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(storeNames()).toEqual(["experience-media"]);
    expect(setKeys()[0]).toMatch(/^user123\/experience\/dev-photo-\d+\.png$/);
    expect(body.url).toBe(`/api/upload/${setKeys()[0]}`);
  });

  it("production POST keeps the store name and filename unprefixed", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });

    await POST(makeFormRequest({ file, feature: "experience" }));

    expect(storeNames()).toEqual(["experience-media"]);
    expect(setKeys()[0]).toMatch(/^user123\/experience\/photo-\d+\.png$/);
  });

  it("non-production crop + file prefixes both the original and the baked filename", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    const { POST } = await import("../route");
    const file = new File(["abc"], "photo.png", { type: "image/png" });

    await POST(
      makeFormRequest({ file, feature: "avatar", crop: VALID_CROP }),
    );

    expect(storeNames()).toEqual(["user-avatars", "user-avatars"]);
    const [originalKey, bakedKey] = setKeys();
    expect(originalKey).toMatch(/^user123\/avatar-original\/dev-photo-\d+\.webp$/);
    expect(bakedKey).toMatch(/^user123\/avatar\/dev-photo-\d+\.webp$/);
  });

  it("re-crop from a dev- original yields a single dev- prefix", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    const { POST } = await import("../route");

    const response = await POST(
      makeFormRequest({
        feature: "tripper-hero",
        crop: VALID_CROP,
        originalKey: "user123/tripper-hero-original/dev-photo-1700000000000.webp",
      }),
    );

    expect(response.status).toBe(200);
    const [bakedKey] = setKeys();
    expect(bakedKey).toMatch(/^user123\/tripper-hero\/dev-photo-/);
    expect(bakedKey).not.toContain("dev-dev-");
  });

  it("non-production GET falls back to the legacy nonproduction- store", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    storeGetWithMetadataMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      data: new Blob([new Uint8Array([1, 2, 3])]),
      etag: "blob-etag-1",
      metadata: { contentType: "image/webp" },
    });
    const { GET } = await import("../route");

    const res = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/upload?key=user123/avatar/a.webp"),
    } as unknown as NextRequest);

    expect(res.status).toBe(200);
    expect(storeNames()).toEqual(["user-avatars", "nonproduction-user-avatars"]);
  });

  it("production GET never consults a legacy nonproduction- store", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");
    storeGetWithMetadataMock.mockResolvedValue(null);
    const { GET } = await import("../route");

    const res = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/upload?key=user123/avatar/a.webp"),
    } as unknown as NextRequest);

    expect(res.status).toBe(404);
    expect(storeNames()).toEqual(["user-avatars", "user-media"]);
  });

  it("non-production DELETE removes the key from the shared and legacy stores", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    const { DELETE } = await import("../route");

    const res = await DELETE({
      nextUrl: new URL("http://localhost/api/upload?key=user123/avatar/a.webp"),
    } as unknown as NextRequest);

    expect(res.status).toBe(204);
    expect(storeNames()).toEqual(["user-avatars", "nonproduction-user-avatars"]);
    expect(storeDeleteMock).toHaveBeenCalledTimes(2);
    expect(storeDeleteMock).toHaveBeenCalledWith("user123/avatar/a.webp");
  });
});
