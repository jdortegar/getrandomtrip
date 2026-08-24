import { describe, it, expect, vi } from "vitest";
import {
  readOriginalBlobWithFallback,
  runPhaseA,
  runPhaseB,
} from "../backfill-tripper-hero-crop";

function makeMockClient(overrides: Partial<any> = {}) {
  return {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      ...overrides,
    },
  };
}

describe("runPhaseA", () => {
  it("copies heroImage -> heroImageOriginal for every tripper missing it", async () => {
    const client = makeMockClient({
      findMany: vi.fn().mockResolvedValue([
        { id: "u1", heroImage: "/api/upload/u1/tripper-hero/a.webp" },
        { id: "u2", heroImage: "/api/upload/u2/tripper-hero/b.webp" },
      ]),
    });

    const result = await runPhaseA(client as never);

    expect(client.user.findMany).toHaveBeenCalledWith({
      where: { heroImage: { not: null }, heroImageOriginal: null },
      select: { id: true, heroImage: true },
    });
    expect(client.user.update).toHaveBeenCalledTimes(2);
    expect(client.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { heroImageOriginal: "/api/upload/u1/tripper-hero/a.webp" },
    });
    expect(result.count).toBe(2);
  });

  it("is idempotent — a second run with nothing left to backfill updates zero rows", async () => {
    const client = makeMockClient({ findMany: vi.fn().mockResolvedValue([]) });

    const result = await runPhaseA(client as never);

    expect(client.user.update).not.toHaveBeenCalled();
    expect(result.count).toBe(0);
  });
});

describe("runPhaseB", () => {
  const tripper = {
    id: "u1",
    tripperSlug: "jane",
    heroImage: "/api/upload/u1/tripper-hero/old.webp",
    heroImageOriginal: "/api/upload/u1/tripper-hero-original/orig.webp",
    heroImagePositionX: 0,
    heroImagePositionY: 50,
  };

  function makeDeps(overrides: Partial<any> = {}) {
    return {
      bake: vi.fn().mockResolvedValue(Buffer.from("baked")),
      getImageDimensions: vi.fn().mockResolvedValue({ width: 4000, height: 2000 }),
      readBlob: vi.fn().mockResolvedValue(Buffer.from("original-bytes")),
      writeBlob: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  it("without --commit: performs zero writes and still returns the computed-rect table", async () => {
    const client = makeMockClient({ findMany: vi.fn().mockResolvedValue([tripper]) });
    const deps = makeDeps();

    const result = await runPhaseB(client as never, { commit: false }, deps as never);

    expect(deps.readBlob).toHaveBeenCalledTimes(1);
    expect(deps.getImageDimensions).toHaveBeenCalledTimes(1);
    expect(deps.bake).not.toHaveBeenCalled();
    expect(deps.writeBlob).not.toHaveBeenCalled();
    expect(client.user.update).not.toHaveBeenCalled();
    expect(result.committed).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      slug: "jane",
      sourceWidth: 4000,
      sourceHeight: 2000,
    });
    expect(result.rows[0].crop.x).toBeCloseTo(0, 5);
  });

  it("with --commit: bakes, writes the new blob, and updates heroImage to the new key", async () => {
    const client = makeMockClient({ findMany: vi.fn().mockResolvedValue([tripper]) });
    const deps = makeDeps();

    const result = await runPhaseB(client as never, { commit: true }, deps as never);

    expect(deps.bake).toHaveBeenCalledTimes(1);
    expect(deps.writeBlob).toHaveBeenCalledTimes(1);
    expect(client.user.update).toHaveBeenCalledTimes(1);
    const updateArgs = client.user.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "u1" });
    expect(typeof updateArgs.data.heroImage).toBe("string");
    expect(result.committed).toBe(true);
  });

  it("skips a tripper whose original blob is missing, without throwing", async () => {
    const client = makeMockClient({ findMany: vi.fn().mockResolvedValue([tripper]) });
    const deps = makeDeps({ readBlob: vi.fn().mockResolvedValue(null) });

    const result = await runPhaseB(client as never, { commit: true }, deps as never);

    expect(deps.getImageDimensions).not.toHaveBeenCalled();
    expect(client.user.update).not.toHaveBeenCalled();
    expect(result.rows).toHaveLength(0);
  });
});

describe("readOriginalBlobWithFallback", () => {
  it("returns the primary store's blob when found, without querying the fallback", async () => {
    const primaryGet = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    const fallbackGet = vi.fn();
    const getBlobStore = vi.fn((feature?: string) => ({
      get: feature === undefined ? fallbackGet : primaryGet,
    }));

    const result = await readOriginalBlobWithFallback(
      "u1/tripper-hero-original/orig.webp",
      getBlobStore as never,
    );

    expect(primaryGet).toHaveBeenCalled();
    expect(fallbackGet).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it("queries the legacy user-media fallback store when the primary store misses", async () => {
    const primaryGet = vi.fn().mockResolvedValue(null);
    const fallbackGet = vi.fn().mockResolvedValue(new Uint8Array([9, 9]).buffer);
    const getBlobStore = vi.fn((feature?: string) => ({
      get: feature === undefined ? fallbackGet : primaryGet,
    }));

    const result = await readOriginalBlobWithFallback(
      "u1/tripper-hero-original/orig.webp",
      getBlobStore as never,
    );

    expect(primaryGet).toHaveBeenCalled();
    expect(fallbackGet).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it("returns null when both the primary and fallback stores miss", async () => {
    const getBlobStore = vi.fn(() => ({ get: vi.fn().mockResolvedValue(null) }));

    const result = await readOriginalBlobWithFallback(
      "u1/tripper-hero-original/orig.webp",
      getBlobStore as never,
    );

    expect(result).toBeNull();
  });
});
