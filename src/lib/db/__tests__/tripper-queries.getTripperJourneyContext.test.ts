import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getTripperJourneyContext } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const findManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;

describe("getTripperJourneyContext — three-way discriminated result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("returns status: not_found when no User matches the slug", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getTripperJourneyContext("nobody");

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns status: inactive with the tripper's name when isActive is false, and does not query Experience", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      name: "Florencia Denis",
      avatarUrl: null,
      location: null,
      isActive: false,
    });

    const result = await getTripperJourneyContext("florencia-denis");

    expect(result).toEqual({ status: "inactive", name: "Florencia Denis" });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("selects isActive on the User-lookup without filtering the where clause on it — filtering there would collapse not_found and inactive into the same null result", async () => {
    findUniqueMock.mockResolvedValue(null);

    await getTripperJourneyContext("whoever");

    const args = findUniqueMock.mock.calls[0][0];
    expect(args.where).toMatchObject({ tripperSlug: "whoever" });
    expect(args.where.isActive).toBeUndefined();
    expect(args.select).toMatchObject({ isActive: true });
  });

  it("returns status: ok with the branding + allowed types/levels when active", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u2",
      name: "Ana Lopez",
      avatarUrl: null,
      location: "Bariloche",
      isActive: true,
    });
    findManyMock.mockResolvedValue([{ type: ["solo"], level: "essenza" }]);

    const result = await getTripperJourneyContext("ana-lopez");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.context.name).toBe("Ana Lopez");
      expect(result.context.allowedTypes).toEqual(["solo"]);
      expect(result.context.allowedLevelsByType.solo).toEqual(["essenza"]);
    }
  });

  it("selects and parses tripperPriceOverrides into the context", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u3",
      name: "David",
      avatarUrl: null,
      location: null,
      isActive: true,
      tripperPriceOverrides: { couple: { essenza: 999 } },
    });

    const result = await getTripperJourneyContext("david");

    expect(findUniqueMock.mock.calls[0][0].select).toMatchObject({
      tripperPriceOverrides: true,
    });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.context.priceOverrides).toEqual({
        couple: { essenza: 999 },
      });
    }
  });

  it("re-throws (does not swallow into not_found) when the DB call itself throws (review finding #7 — cache() must not memoize a false not_found)", async () => {
    const dbError = new Error("connection reset");
    findUniqueMock.mockRejectedValue(dbError);

    await expect(getTripperJourneyContext("whoever")).rejects.toThrow(
      "connection reset",
    );
  });

  it("distinguishes 'tripper doesn't exist' (cacheable not_found) from 'DB threw' (must not poison the cache)", async () => {
    // A genuine not-found — findUnique resolving to null — is NOT an error
    // and must still resolve to a normal, cacheable `{ status: "not_found" }`.
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(getTripperJourneyContext("truly-nobody")).resolves.toEqual({
      status: "not_found",
    });

    // A thrown DB error for a DIFFERENT slug must propagate as a rejection,
    // never collapse into the same `{ status: "not_found" }` shape.
    findUniqueMock.mockRejectedValueOnce(new Error("transient blip"));
    await expect(
      getTripperJourneyContext("blipped-slug"),
    ).rejects.toThrow("transient blip");
  });

  it("resolves priceOverrides to null when the tripper has none set", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u4",
      name: "No Overrides",
      avatarUrl: null,
      location: null,
      isActive: true,
      tripperPriceOverrides: null,
    });

    const result = await getTripperJourneyContext("no-overrides");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.context.priceOverrides).toBeNull();
    }
  });
});
