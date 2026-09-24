import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  $queryRaw: vi.fn(),
  experience: { deleteMany: vi.fn(), delete: vi.fn() },
  tripRequest: { count: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  },
}));

import { canHardDeleteExperience, deleteExperienceIfAllowed, withCanDelete } from "../deletion";

describe("canHardDeleteExperience", () => {
  it("allows deleting an experience with no bookings outside review", () => {
    expect(canHardDeleteExperience({ status: "DRAFT", tripRequestCount: 0 })).toBe(true);
    expect(canHardDeleteExperience({ status: "ACTIVE", tripRequestCount: 0 })).toBe(true);
  });

  it("blocks an experience that has any trip request", () => {
    expect(canHardDeleteExperience({ status: "DRAFT", tripRequestCount: 1 })).toBe(false);
  });

  it("never allows deleting a review copy", () => {
    expect(
      canHardDeleteExperience({ status: "DRAFT", tripRequestCount: 0, isReviewCopy: true }),
    ).toBe(false);
  });

  it.each(["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"])(
    "blocks an experience while a review decision is pending (%s)",
    (status) => {
      expect(canHardDeleteExperience({ status, tripRequestCount: 0 })).toBe(false);
    },
  );
});

describe("deleteExperienceIfAllowed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.$queryRaw.mockResolvedValue([{ id: "e1", status: "DRAFT", isReviewCopy: false }]);
    tx.tripRequest.count.mockResolvedValue(0);
  });

  it("locks the experience row (FOR UPDATE) before checking the rule", async () => {
    await deleteExperienceIfAllowed("e1");
    const sql = (tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
    expect(sql).toMatch(/FOR UPDATE/);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.tripRequest.count.mock.invocationCallOrder[0],
    );
  });

  it("deletes the experience and its review copies when allowed", async () => {
    await expect(deleteExperienceIfAllowed("e1")).resolves.toEqual({ ok: true });
    expect(tx.experience.deleteMany).toHaveBeenCalledWith({
      where: { parentId: "e1", isReviewCopy: true },
    });
    expect(tx.experience.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
  });

  it("refuses with has_bookings when trip requests exist", async () => {
    tx.tripRequest.count.mockResolvedValue(2);
    await expect(deleteExperienceIfAllowed("e1")).resolves.toEqual({
      ok: false,
      reason: "has_bookings",
    });
    expect(tx.experience.delete).not.toHaveBeenCalled();
  });

  it("refuses with in_review while a review decision is pending", async () => {
    tx.$queryRaw.mockResolvedValue([{ id: "e1", status: "PENDING_REVIEW", isReviewCopy: false }]);
    await expect(deleteExperienceIfAllowed("e1")).resolves.toEqual({
      ok: false,
      reason: "in_review",
    });
    expect(tx.experience.delete).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing experience or a review copy", async () => {
    tx.$queryRaw.mockResolvedValue([]);
    await expect(deleteExperienceIfAllowed("e1")).resolves.toEqual({ ok: false, reason: "not_found" });
    tx.$queryRaw.mockResolvedValue([{ id: "e1", status: "DRAFT", isReviewCopy: true }]);
    await expect(deleteExperienceIfAllowed("e1")).resolves.toEqual({ ok: false, reason: "not_found" });
  });
});

describe("withCanDelete", () => {
  it("replaces the trip-request _count with a canDelete flag", () => {
    expect(withCanDelete({ id: "a", status: "ACTIVE", _count: { tripRequests: 0 } })).toEqual({
      id: "a",
      status: "ACTIVE",
      canDelete: true,
    });
    expect(withCanDelete({ id: "b", status: "ACTIVE", _count: { tripRequests: 3 } })).toEqual({
      id: "b",
      status: "ACTIVE",
      canDelete: false,
    });
  });

  it("marks review copies as not deletable", () => {
    expect(
      withCanDelete({ id: "c", status: "DRAFT", isReviewCopy: true, _count: { tripRequests: 0 } })
        .canDelete,
    ).toBe(false);
  });
});
