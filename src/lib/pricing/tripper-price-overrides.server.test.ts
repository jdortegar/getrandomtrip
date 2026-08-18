import { describe, expect, it, vi } from "vitest";

const { findManyMock, findUniqueMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    },
  },
}));

import {
  loadTripperPriceOverrides,
  loadTripperPriceOverridesBatch,
} from "./tripper-price-overrides.server";

describe("loadTripperPriceOverrides", () => {
  it("returns null with NO db hit when tripperId is null (RandomTrip-owned booking)", async () => {
    const result = await loadTripperPriceOverrides(null);
    expect(result).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("loads and parses the tripper's stored overrides when tripperId is present", async () => {
    findUniqueMock.mockResolvedValueOnce({
      tripperPriceOverrides: { couple: { essenza: 220 } },
    });
    const result = await loadTripperPriceOverrides("tripper-1");
    expect(result).toEqual({ couple: { essenza: 220 } });
    expect(findUniqueMock).toHaveBeenCalledWith({
      select: { tripperPriceOverrides: true },
      where: { id: "tripper-1" },
    });
  });

  it("returns null when the tripper row has no stored overrides", async () => {
    findUniqueMock.mockResolvedValueOnce({ tripperPriceOverrides: null });
    const result = await loadTripperPriceOverrides("tripper-1");
    expect(result).toBeNull();
  });
});

describe("loadTripperPriceOverridesBatch", () => {
  it("returns an empty map with NO db hit when there are no ids", async () => {
    const result = await loadTripperPriceOverridesBatch([null, null]);
    expect(result).toEqual({});
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("dedupes ids and queries once for the unique set", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: "t1", tripperPriceOverrides: { couple: { essenza: 220 } } },
    ]);
    const result = await loadTripperPriceOverridesBatch(["t1", "t1", null]);
    expect(result).toEqual({ t1: { couple: { essenza: 220 } } });
    expect(findManyMock).toHaveBeenCalledWith({
      select: { id: true, tripperPriceOverrides: true },
      where: { id: { in: ["t1"] } },
    });
  });

  it("omits ids with no matching row from the result map", async () => {
    findManyMock.mockResolvedValueOnce([]);
    const result = await loadTripperPriceOverridesBatch(["missing"]);
    expect(result).toEqual({});
  });
});
