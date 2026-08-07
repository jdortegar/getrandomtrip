import { describe, it, expect, vi, beforeEach } from "vitest";

const { resizeMock, webpMock, toBufferMock, sharpMock } = vi.hoisted(() => {
  const resizeMock = vi.fn().mockReturnThis();
  const webpMock = vi.fn().mockReturnThis();
  const toBufferMock = vi.fn();
  const sharpMock = vi.fn(() => ({
    resize: resizeMock,
    webp: webpMock,
    toBuffer: toBufferMock,
  }));
  return { resizeMock, webpMock, toBufferMock, sharpMock };
});

vi.mock("sharp", () => ({ default: sharpMock }));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(),
}));

import { optimizeImage } from "../route";

describe("optimizeImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toBufferMock.mockResolvedValue(Buffer.from("optimized"));
  });

  it("passes through non-compressible mime types (e.g. SVG) without calling sharp", async () => {
    const original = Buffer.from("<svg/>");
    const result = await optimizeImage(original, "image/svg+xml", "avatar");

    expect(sharpMock).not.toHaveBeenCalled();
    expect(result).toEqual({ buffer: original, contentType: "image/svg+xml" });
  });

  it("resizes to the feature's max dimensions and converts to webp", async () => {
    const original = Buffer.from("raw-png-bytes");
    const result = await optimizeImage(original, "image/png", "avatar");

    expect(sharpMock).toHaveBeenCalledWith(original);
    expect(resizeMock).toHaveBeenCalledWith(400, 400, {
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(webpMock).toHaveBeenCalledWith({ quality: 82 });
    expect(result).toEqual({
      buffer: Buffer.from("optimized"),
      contentType: "image/webp",
    });
  });

  it("uses the tripper-hero feature's wider max dimensions", async () => {
    await optimizeImage(Buffer.from("raw"), "image/jpeg", "tripper-hero");

    expect(resizeMock).toHaveBeenCalledWith(1920, 1080, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });

  it("falls back to the default max dimensions for an unknown feature", async () => {
    await optimizeImage(Buffer.from("raw"), "image/gif", "unknown-feature");

    expect(resizeMock).toHaveBeenCalledWith(1600, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });
});
