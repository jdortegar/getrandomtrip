import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { resolveReferrerId, stampReferral } from "../attribution-server";

const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const updateManyMock = prisma.user.updateMany as ReturnType<typeof vi.fn>;

describe("resolveReferrerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without querying prisma when slug is null/undefined", async () => {
    expect(await resolveReferrerId(null)).toBeNull();
    expect(await resolveReferrerId(undefined)).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns null when no tripper matches the slug (missing/non-tripper)", async () => {
    findUniqueMock.mockResolvedValue(null);
    expect(await resolveReferrerId("nobody")).toBeNull();
  });

  it("returns null when the matched tripper is inactive", async () => {
    findUniqueMock.mockResolvedValue({ id: "tripper-1", isActive: false });
    expect(await resolveReferrerId("maria")).toBeNull();
  });

  it("returns the tripper id when the tripper is active", async () => {
    findUniqueMock.mockResolvedValue({ id: "tripper-1", isActive: true });
    expect(await resolveReferrerId("maria")).toBe("tripper-1");
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { tripperSlug: "maria", roles: { has: "TRIPPER" } },
      select: { id: true, isActive: true },
    });
  });
});

describe("stampReferral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a no-op when referrerId is null", async () => {
    await stampReferral("user-1", null);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("is a no-op (self-referral guard) when referrerId === userId", async () => {
    await stampReferral("user-1", "user-1");
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("writes referredByTripperId via updateMany with the write-once null guard", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    await stampReferral("user-1", "tripper-1");
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "user-1", referredByTripperId: null },
      data: { referredByTripperId: "tripper-1" },
    });
  });
});
