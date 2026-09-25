import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email", () => ({
  sendAdminNewBooking: vi.fn(),
  sendBookingConfirmed: vi.fn(),
  sendPaymentFailed: vi.fn(),
}));
const tx = vi.hoisted(() => ({
  tripRequest: { updateMany: vi.fn() },
  payment: { updateMany: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) },
}));
import { upsertPaymentForTripCheckout } from "../payment";

const data = {
  userId: "buyer",
  tripRequestId: "trip",
  provider: "stripe",
  amount: 500,
  stripePaymentIntentId: "pi_new",
  expectedTripUpdatedAt: new Date("2026-09-25"),
  level: "essenza",
  paxDetails: { adults: 2, minors: 0, rooms: 1 },
  previousPayment: { id: "payment", stripePaymentIntentId: "pi_old" },
};

describe("atomic checkout quote persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tx.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
  });
  it("refuses an older snapshot after another traveler save advanced the trip version", async () => {
    tx.tripRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(upsertPaymentForTripCheckout(data)).rejects.toMatchObject({
      status: 409,
    });
    expect(tx.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          updatedAt: data.expectedTripUpdatedAt,
          status: { in: ["SAVED", "PENDING_PAYMENT"] },
        }),
      }),
    );
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
  });
  it("does not overwrite a payment settled or replaced after intent retrieval", async () => {
    tx.payment.updateMany.mockResolvedValue({ count: 0 });
    await expect(upsertPaymentForTripCheckout(data)).rejects.toMatchObject({
      status: 409,
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment",
          stripePaymentIntentId: "pi_old",
          status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] },
        },
      }),
    );
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
  it("updates the amount and canonical party together when both guards match", async () => {
    await upsertPaymentForTripCheckout(data);
    expect(tx.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "PENDING_PAYMENT",
          level: "essenza",
          pax: 2,
          paxDetails: data.paxDetails,
        },
      }),
    );
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 500,
          stripePaymentIntentId: "pi_new",
        }),
      }),
    );
  });
});
