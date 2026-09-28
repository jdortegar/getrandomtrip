import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "@prisma/client";

const db = vi.hoisted(() => ({
  payment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  tripRequest: { update: vi.fn(), updateMany: vi.fn() },
  saleNotificationDelivery: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/email", () => ({
  sendAdminNewBooking: vi.fn(),
  sendBookingConfirmed: vi.fn(),
  sendPaymentFailed: vi.fn(),
}));
vi.mock("@/lib/db/runSaleNotificationBatch", () => ({ runSaleNotificationBatch: vi.fn() }));
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";
import {
  sendAdminNewBooking,
  sendBookingConfirmed,
  sendPaymentFailed,
} from "@/lib/email";
import { updatePaymentFromStripeWebhook as settlePayment, upsertPaymentForTripCheckout } from "../payment";
// Existing regression scenarios represent live payments unless explicitly overridden.
const updatePaymentFromStripeWebhook: typeof settlePayment = (id, data, payload, liveMode = true) =>
  settlePayment(id, data, payload, liveMode);

describe("Stripe webhook payment identity", () => {
  let row: Record<string, unknown>;
  let trip: { status: string };
  let sales: unknown[];
  beforeEach(() => {
    vi.resetAllMocks();
    sales = [];
    vi.mocked(runSaleNotificationBatch).mockResolvedValue({ claimed: 1, sent: 1, failed: 0 });
    trip = { status: "PENDING_PAYMENT" };
    row = {
      id: "payment",
      tripRequestId: "trip",
      userId: "buyer",
      status: "PENDING",
      stripePaymentIntentId: "pi_old",
      providerPaymentId: null,
      providerResponse: {},
      amount: 100,
      currency: "USD",
      updatedAt: new Date(1),
    };
    db.payment.findUnique.mockImplementation(async () => ({ ...row, tripRequest: { ...trip } }));
    db.payment.findUniqueOrThrow.mockImplementation(async () => ({ amount: row.amount, currency: row.currency }));
    db.saleNotificationDelivery.create.mockImplementation(async ({ data }) => { sales.push(data); return data; });
    db.tripRequest.updateMany.mockImplementation(async ({ where, data }) => {
      if (!where.status.in.includes(trip.status)) return { count: 0 };
      Object.assign(trip, data);
      return { count: 1 };
    });
    let transactionTail = Promise.resolve();
    db.$transaction.mockImplementation((run) => {
      const next = transactionTail.then(async () => {
        const beforePayment = { ...row };
        const beforeTrip = { ...trip };
        const beforeSales = [...sales];
        try { return await run(db); }
        catch (error) { row = beforePayment; trip = beforeTrip; sales = beforeSales; throw error; }
      });
      transactionTail = next.catch(() => {});
      return next;
    });
    db.payment.update.mockImplementation(async ({ data }) =>
      Object.assign(row, data),
    );
    db.payment.updateMany.mockImplementation(async ({ where, data }) => {
      const identityMatches =
        where.stripePaymentIntentId === row.stripePaymentIntentId;
      const statusMatches =
        typeof where.status === "string"
          ? where.status === row.status
          : !where.status?.notIn?.includes(row.status);
      if (
        !identityMatches ||
        !statusMatches ||
        (where.updatedAt && where.updatedAt !== row.updatedAt)
      )
        return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    });
  });

  it("locks the trip before the payment, matching concurrent checkout refresh", async () => {
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(db.tripRequest.updateMany.mock.invocationCallOrder[0]).toBeLessThan(db.payment.updateMany.mock.invocationCallOrder[0]);
  });

  it("serializes same-trip refresh behind settlement using the trip row, not whole transactions", async () => {
    let unlockSettlement!: () => void;
    let enteredSettlement!: () => void;
    const hold = new Promise<void>((resolve) => { unlockSettlement = resolve; });
    const entered = new Promise<void>((resolve) => { enteredSettlement = resolve; });
    let tripTail = Promise.resolve();
    let first = true;
    db.$transaction.mockImplementation(async (run) => {
      let unlockTrip: (() => void) | undefined;
      const tx = {
        payment: db.payment,
        saleNotificationDelivery: db.saleNotificationDelivery,
        tripRequest: { updateMany: async (args: unknown) => {
          const previous = tripTail;
          tripTail = new Promise<void>((resolve) => { unlockTrip = resolve; });
          await previous;
          const result = await db.tripRequest.updateMany(args);
          if (first) { first = false; enteredSettlement(); await hold; }
          return result;
        } },
      };
      try { return await run(tx); }
      finally { unlockTrip?.(); }
    });
    const settlement = updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    await entered;
    const refresh = upsertPaymentForTripCheckout({
      userId: "buyer", tripRequestId: "trip", provider: "stripe", amount: 700,
      stripePaymentIntentId: "pi_old", expectedTripUpdatedAt: new Date(1),
      level: "essenza", paxDetails: { adults: 2, minors: 0, rooms: 1 },
      previousPayment: { id: "payment", stripePaymentIntentId: "pi_old" },
    });
    const refreshRejected = expect(refresh).rejects.toMatchObject({ status: 409 });
    try { expect(db.payment.updateMany).not.toHaveBeenCalled(); }
    finally { unlockSettlement(); }
    await Promise.all([settlement, refreshRejected]);
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
  });

  it("rolls back trip promotion when the later payment write fails, then retries", async () => {
    db.payment.updateMany.mockRejectedValueOnce(new Error("Payment write failed"));
    await expect(updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" })).rejects.toThrow("Payment write failed");
    expect(row.status).toBe("PENDING");
    expect(trip.status).toBe("PENDING_PAYMENT");
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
  });

  it("rolls back provisional trip promotion after a lost payment claim", async () => {
    db.payment.updateMany.mockResolvedValueOnce({ count: 0 });
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(db.tripRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(trip.status).toBe("PENDING_PAYMENT");
    expect(row.status).toBe("PENDING");
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
  });

  it.each(["CANCELLED", "FAILED", "APPROVED"])(
    "ignores delayed %s after replacement wins the lookup/write race",
    async (status) => {
      let release!: (snapshot: unknown) => void;
      const old = { ...row };
      db.payment.findUnique.mockReturnValueOnce(
        new Promise((resolve) => {
          release = resolve;
        }),
      );
      const pending = updatePaymentFromStripeWebhook("pi_old", {
        status: status as PaymentStatus,
        stripePaymentIntentId: "pi_old",
        providerPaymentId: "pi_old",
      });
      Object.assign(row, {
        stripePaymentIntentId: "pi_new",
        updatedAt: new Date(2),
      });
      release(old);
      await pending;
      expect(row).toMatchObject({
        status: "PENDING",
        stripePaymentIntentId: "pi_new",
        providerPaymentId: null,
      });
      expect(db.payment.update).not.toHaveBeenCalled();
      expect(db.tripRequest.update).not.toHaveBeenCalled();
      expect(sendBookingConfirmed).not.toHaveBeenCalled();
      expect(sendAdminNewBooking).not.toHaveBeenCalled();
      expect(sendPaymentFailed).not.toHaveBeenCalled();
    },
  );

  it("does not overwrite settlement that wins after the webhook snapshot", async () => {
    const snapshot = { ...row };
    db.payment.findUnique.mockImplementationOnce(async () => {
      Object.assign(row, { status: "APPROVED", updatedAt: new Date(2) });
      return snapshot;
    });
    await updatePaymentFromStripeWebhook("pi_old", { status: "FAILED" });
    expect(row.status).toBe("APPROVED");
    expect(sendPaymentFailed).not.toHaveBeenCalled();
  });

  it.each(["PENDING", "FAILED"])(
    "accepts real success after the same intent advances to %s during lookup",
    async (status) => {
      const snapshot = { ...row };
      db.payment.findUnique.mockImplementationOnce(async () => {
        Object.assign(row, { status, updatedAt: new Date(2) });
        return snapshot;
      });
      await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
      expect(row.status).toBe("APPROVED");
      expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
      expect(db.tripRequest.updateMany).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["APPROVED", "FAILED"])(
    "notifies only once for duplicate %s events",
    async (status) => {
      await updatePaymentFromStripeWebhook("pi_old", {
        status: status as PaymentStatus,
      });
      await updatePaymentFromStripeWebhook("pi_old", {
        status: status as PaymentStatus,
      });
      expect(
        status === "APPROVED" ? sendBookingConfirmed : sendPaymentFailed,
      ).toHaveBeenCalledTimes(1);
      expect(db.payment.updateMany).toHaveBeenCalledTimes(1);
      expect(sales).toHaveLength(status === "APPROVED" ? 1 : 0);
    },
  );

  it.each([
    "COMPLETED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
    "CHARGEBACK",
    "CANCELLED",
  ])(
    "does not resurrect a %s payment on a duplicate success",
    async (status) => {
      row.status = status;
      await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
      expect(row.status).toBe(status);
      expect(db.payment.updateMany).not.toHaveBeenCalled();
    },
  );

  it("rolls back payment approval when trip promotion fails, then retries once", async () => {
    db.tripRequest.updateMany.mockRejectedValueOnce(new Error("Trip write failed"));
    await expect(updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" })).rejects.toThrow("Trip write failed");
    expect(row.status).toBe("PENDING");
    expect(trip.status).toBe("PENDING_PAYMENT");
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(sendAdminNewBooking).toHaveBeenCalledTimes(1);
  });

  it("repairs a legacy approved/unconfirmed booking only once", async () => {
    row.status = "APPROVED";
    await Promise.all([
      updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" }),
      updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" }),
    ]);
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(sendAdminNewBooking).toHaveBeenCalledTimes(1);
    expect(sales).toHaveLength(0);
    expect(runSaleNotificationBatch).not.toHaveBeenCalled();
  });

  it("notifies once when fallback and webhook settle concurrently", async () => {
    await Promise.all([
      updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" }),
      updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" }),
    ]);
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(sales).toHaveLength(1);
    expect(runSaleNotificationBatch).toHaveBeenCalledTimes(1);
  });

  it.each(["CONFIRMED", "CANCELLED", "REVEALED", "COMPLETED"])("does not regress a %s trip on settlement", async (status) => {
    trip.status = status;
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe(status);
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
    expect(sales).toHaveLength(1);
  });

  it("supports the legacy provider-id fallback only while no replacement Stripe identity exists", async () => {
    Object.assign(row, {
      stripePaymentIntentId: null,
      providerPaymentId: "pi_old",
    });
    db.payment.findUnique.mockResolvedValueOnce(null);
    db.payment.findFirst.mockResolvedValue({ ...row });
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stripePaymentIntentId: null,
          providerPaymentId: "pi_old",
        }),
      }),
    );
    expect(row).toMatchObject({
      status: "APPROVED",
      stripePaymentIntentId: "pi_old",
    });
  });

  it("atomically queues the committed non-PII payment snapshot before dispatch", async () => {
    vi.mocked(runSaleNotificationBatch).mockImplementation(async (id) => {
      expect(id).toBe("payment");
      expect(row.status).toBe("APPROVED");
      expect(sales).toEqual([{ paymentId: "payment", tripRequestId: "trip", stripePaymentIntentId: "pi_old", amount: 100, currency: "USD" }]);
      return { claimed: 1, sent: 1, failed: 0 };
    });
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(runSaleNotificationBatch).toHaveBeenCalledOnce();
  });

  it("rolls back settlement on enqueue failure, allowing provider retry", async () => {
    db.saleNotificationDelivery.create.mockRejectedValueOnce(new Error("outbox unavailable"));
    await expect(updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" })).rejects.toThrow("outbox unavailable");
    expect(row.status).toBe("PENDING");
    expect(trip.status).toBe("PENDING_PAYMENT");
    expect(sales).toHaveLength(0);
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
    expect(runSaleNotificationBatch).not.toHaveBeenCalled();
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(sales).toHaveLength(1);
  });

  it("keeps settlement and outbox when immediate delivery fails", async () => {
    vi.mocked(runSaleNotificationBatch).mockRejectedValue(new Error("private credential"));
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(row.status).toBe("APPROVED");
    expect(sales).toHaveLength(1);
  });

  it("never queues success for a replaced intent or a lost claim", async () => {
    row.stripePaymentIntentId = "pi_new";
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    row.stripePaymentIntentId = "pi_old";
    db.payment.updateMany.mockResolvedValueOnce({ count: 0 });
    await updatePaymentFromStripeWebhook("pi_old", { status: "APPROVED" });
    expect(sales).toHaveLength(0);
    expect(runSaleNotificationBatch).not.toHaveBeenCalled();
  });

  it.each([false, undefined])("settles test/unknown mode without queuing production sales (%s)", async (liveMode) => {
    await settlePayment("pi_old", { status: "APPROVED" }, undefined, liveMode);
    expect(row.status).toBe("APPROVED");
    expect(trip.status).toBe("CONFIRMED");
    expect(sendBookingConfirmed).toHaveBeenCalledOnce();
    expect(sales).toHaveLength(0);
    expect(runSaleNotificationBatch).not.toHaveBeenCalled();
  });
});
