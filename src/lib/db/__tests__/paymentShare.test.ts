import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({
  paymentShare: { findUnique: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { settleShareFromStripe } from "../paymentShare";

describe("settleShareFromStripe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.paymentShare.findUnique.mockResolvedValue({ id: "share-1" });
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
  });

  it("marks the share holding the intent as paid", async () => {
    const paidAt = new Date("2026-10-27T10:00:00Z");
    await expect(settleShareFromStripe("pi_share", "APPROVED", paidAt)).resolves.toBe(true);
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: {
        id: "share-1",
        stripePaymentIntentId: "pi_share",
        status: { notIn: ["APPROVED", "COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED", "CHARGEBACK", "CANCELLED"] },
      },
      data: { status: "APPROVED", paidAt },
    });
  });

  it("records a failure without a paid date and never reverses a paid share", async () => {
    await settleShareFromStripe("pi_share", "FAILED");
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { notIn: expect.arrayContaining(["APPROVED"]) } }),
      data: { status: "FAILED" },
    }));
  });

  it("reports an intent that no share holds", async () => {
    db.paymentShare.findUnique.mockResolvedValue(null);
    await expect(settleShareFromStripe("pi_unknown", "APPROVED")).resolves.toBe(false);
    expect(db.paymentShare.updateMany).not.toHaveBeenCalled();
  });
});
