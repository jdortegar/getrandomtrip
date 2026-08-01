import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  tripAccessWhere,
  canAccessTrip,
  tripRoleFor,
} from "../travelerAccess";

describe("tripAccessWhere", () => {
  it("returns the buyer-owned OR companion-linked predicate shape", () => {
    expect(tripAccessWhere("user-1")).toEqual({
      OR: [{ userId: "user-1" }, { travelers: { some: { userId: "user-1" } } }],
    });
  });
});

describe("canAccessTrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when the count query resolves to a match (buyer or companion)", async () => {
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await canAccessTrip("trip-1", "user-1");

    expect(result).toBe(true);
    expect(prisma.tripRequest.count).toHaveBeenCalledWith({
      where: {
        id: "trip-1",
        OR: [{ userId: "user-1" }, { travelers: { some: { userId: "user-1" } } }],
      },
    });
  });

  it("returns false for a stranger with no ownership or companion link", async () => {
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await canAccessTrip("trip-1", "stranger-1");

    expect(result).toBe(false);
  });
});

describe("tripRoleFor", () => {
  it("returns 'buyer' when trip.userId matches the given userId", () => {
    expect(tripRoleFor({ userId: "user-1" }, "user-1")).toBe("buyer");
  });

  it("returns 'companion' when trip.userId does not match the given userId", () => {
    expect(tripRoleFor({ userId: "buyer-1" }, "companion-1")).toBe("companion");
  });
});
