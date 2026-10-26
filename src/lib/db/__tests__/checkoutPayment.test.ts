import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email", () => ({
  sendAdminNewBooking: vi.fn(),
  sendBookingConfirmed: vi.fn(),
  sendPaymentFailed: vi.fn(),
}));
const tx = vi.hoisted(() => ({
  tripRequest: { updateMany: vi.fn() },
  payment: { updateMany: vi.fn(), create: vi.fn() },
  paymentShare: { deleteMany: vi.fn(), create: vi.fn() },
  tripTraveler: { deleteMany: vi.fn(), create: vi.fn() },
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
    expect(tx.tripRequest.updateMany.mock.invocationCallOrder[0]).toBeLessThan(tx.payment.updateMany.mock.invocationCallOrder[0]);
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
  it("leaves shares and companion rows alone for a trip that was never split", async () => {
    await upsertPaymentForTripCheckout({ ...data, previousPaymentMode: "TOTAL" });
    expect(tx.paymentShare.deleteMany).not.toHaveBeenCalled();
    expect(tx.tripTraveler.deleteMany).not.toHaveBeenCalled();
  });
});

describe("individual checkout split persistence", () => {
  const split = {
    organizerCents: 102334,
    companions: [
      { email: "ana@example.com", amountCents: 102333 },
      { email: "bo@example.com", amountCents: 102333 },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    tx.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.create.mockResolvedValue({ id: "payment-new" });
    tx.tripTraveler.create
      .mockResolvedValueOnce({ id: "traveler-ana" })
      .mockResolvedValueOnce({ id: "traveler-bo" });
  });

  it("marks the trip INDIVIDUAL and records one share per payer", async () => {
    await upsertPaymentForTripCheckout({ ...data, amount: 3070, previousPaymentMode: "TOTAL", split });
    expect(tx.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paymentMode: "INDIVIDUAL" }) }),
    );
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 3070 }) }),
    );
    expect(tx.paymentShare.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentId: "payment", userId: "buyer", kind: "SHARE", amount: 1023.34,
        stripePaymentIntentId: "pi_new",
      }),
    });
    expect(tx.tripTraveler.create).toHaveBeenNthCalledWith(1, {
      data: { tripRequestId: "trip", kind: "ADULT", email: "ana@example.com" },
    });
    expect(tx.paymentShare.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ paymentId: "payment", travelerId: "traveler-bo", amount: 1023.33 }),
    });
    expect(tx.paymentShare.create).toHaveBeenCalledTimes(3);
  });

  it("rebuilds the previous unpaid split before writing the new one", async () => {
    await upsertPaymentForTripCheckout({ ...data, previousPaymentMode: "INDIVIDUAL", split });
    expect(tx.paymentShare.deleteMany).toHaveBeenCalledWith({
      where: { paymentId: "payment", status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] } },
    });
    expect(tx.tripTraveler.deleteMany).toHaveBeenCalledWith({
      where: { tripRequestId: "trip", kind: "ADULT", userId: null },
    });
    expect(tx.paymentShare.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.paymentShare.create.mock.invocationCallOrder[0],
    );
  });

  it("attaches the shares to a newly created payment", async () => {
    await upsertPaymentForTripCheckout({ ...data, previousPayment: null, split });
    expect(tx.paymentShare.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ paymentId: "payment-new", stripePaymentIntentId: "pi_new" }),
    });
  });

  it("drops the split when the buyer switches back to paying the total", async () => {
    await upsertPaymentForTripCheckout({ ...data, previousPaymentMode: "INDIVIDUAL" });
    expect(tx.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paymentMode: "TOTAL" }) }),
    );
    expect(tx.paymentShare.deleteMany).toHaveBeenCalled();
    expect(tx.tripTraveler.deleteMany).toHaveBeenCalled();
    expect(tx.paymentShare.create).not.toHaveBeenCalled();
    expect(tx.tripTraveler.create).not.toHaveBeenCalled();
  });
});
