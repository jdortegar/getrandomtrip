import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "@prisma/client";

const db = vi.hoisted(() => ({
  payment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  tripRequest: { update: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/email", () => ({
  sendAdminNewBooking: vi.fn(),
  sendBookingConfirmed: vi.fn(),
  sendPaymentFailed: vi.fn(),
}));
import {
  sendAdminNewBooking,
  sendBookingConfirmed,
  sendPaymentFailed,
} from "@/lib/email";
import { updatePaymentFromStripeWebhook } from "../payment";

describe("Stripe webhook payment identity", () => {
  let row: Record<string, unknown>;
  beforeEach(() => {
    vi.resetAllMocks();
    row = {
      id: "payment",
      tripRequestId: "trip",
      userId: "buyer",
      status: "PENDING",
      stripePaymentIntentId: "pi_old",
      providerPaymentId: null,
      providerResponse: {},
      updatedAt: new Date(1),
    };
    db.payment.findUnique.mockImplementation(async () => ({ ...row }));
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
      expect(db.tripRequest.update).toHaveBeenCalledTimes(1);
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
});
