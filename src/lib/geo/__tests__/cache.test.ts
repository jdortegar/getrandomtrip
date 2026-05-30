import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createGeoCache } from "../cache";

describe("createGeoCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null on a cache miss", () => {
    const cache = createGeoCache<{ name: string }>();
    expect(cache.get("missing")).toBeNull();
  });

  it("returns stored results after set", () => {
    const cache = createGeoCache<{ name: string }>();
    const results = [{ name: "Argentina" }];
    cache.set("arg", results);
    expect(cache.get("arg")).toEqual(results);
  });

  it("different keys do not collide", () => {
    const cache = createGeoCache<{ name: string }>();
    cache.set("arg", [{ name: "Argentina" }]);
    cache.set("mex", [{ name: "Mexico" }]);
    expect(cache.get("arg")).toEqual([{ name: "Argentina" }]);
    expect(cache.get("mex")).toEqual([{ name: "Mexico" }]);
  });

  it("returns null for expired entry after 24h + 1ms", () => {
    const cache = createGeoCache<{ name: string }>();
    cache.set("arg", [{ name: "Argentina" }]);

    // Advance time past TTL (24 hours + 1ms)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

    expect(cache.get("arg")).toBeNull();
  });

  it("returns result when TTL has not yet expired", () => {
    const cache = createGeoCache<{ name: string }>();
    cache.set("arg", [{ name: "Argentina" }]);

    // Advance time to just before expiry
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1);

    expect(cache.get("arg")).toEqual([{ name: "Argentina" }]);
  });

  it("removes the expired key so subsequent get returns null", () => {
    const cache = createGeoCache<{ name: string }>();
    cache.set("arg", [{ name: "Argentina" }]);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    // First access triggers deletion
    cache.get("arg");
    // Should still be null on second access
    expect(cache.get("arg")).toBeNull();
  });
});
