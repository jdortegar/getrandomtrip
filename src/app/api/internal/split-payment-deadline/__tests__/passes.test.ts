import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const client = {
    tripRequest: { findUnique: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    paymentShare: { count: vi.fn(), updateMany: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    tripTraveler: { deleteMany: vi.fn() },
    payment: { update: vi.fn() },
    saleNotificationDelivery: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation((run: (tx: typeof client) => unknown) => run(client));
  return client;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));
const stripeMock = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn(), cancel: vi.fn() },
  promotionCodes: { retrieve: vi.fn() },
  coupons: { retrieve: vi.fn() },
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock }));
const mocks = vi.hoisted(() => ({
  settle: vi.fn(),
  totals: vi.fn(),
  invite: vi.fn(),
  sale: vi.fn(),
  confirmedEmail: vi.fn(),
  adminEmail: vi.fn(),
  topUpEmail: vi.fn(),
  topUpDeliver: vi.fn(),
}));
vi.mock("@/lib/db/paymentShare", () => ({ settleShareFromStripe: mocks.settle }));
vi.mock("@/lib/payments/trip-totals.server", () => ({ loadTripTotalsAt: mocks.totals }));
vi.mock("@/lib/db/payment", () => ({ inviteSplitCompanions: mocks.invite }));
vi.mock("@/lib/db/runSaleNotificationBatch", () => ({ runSaleNotificationBatch: mocks.sale }));
vi.mock("@/lib/email", () => ({
  sendBookingConfirmed: mocks.confirmedEmail,
  sendAdminNewBooking: mocks.adminEmail,
  sendTopUpDueEmail: mocks.topUpEmail,
  deliverTopUpDueEmail: mocks.topUpDeliver,
}));

import {
  closeTopUpGrace,
  confirmCollectedTrip,
  runDeadlinePass,
  runReinvitePass,
  runRemainderPass,
  runTopUpReminderPass,
} from "../passes";

const NOW = new Date("2026-10-30T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
// USD 1000 per person + USD 70 per-trip add-on
const totalsAt = (pax: number) => ({
  addonsPerPax: 70 / pax, basePerPax: 1000, cancelInsurancePerPax: 0, filtersPerPax: 0,
  totalPerPax: 1000 + 70 / pax, totalTrip: 1000 * pax + 70,
});

type Share = { id: string; kind: string; travelerId: string | null; userId: string | null; status: string; stripePaymentIntentId: string | null; amount?: number };
function trip(shares: Share[], overrides: Record<string, unknown> = {}) {
  return {
    id: "trip-1",
    userId: "organizer",
    status: "COLLECTING",
    type: "group",
    level: "essenza",
    pax: 4,
    paxDetails: { adults: 4, minors: 0, rooms: 2 },
    payment: {
      id: "payment-1",
      currency: "USD",
      stripePaymentIntentId: "pi_org",
      stripePromotionCodeId: null,
      providerResponse: { livemode: true },
      shares,
    },
    ...overrides,
  };
}
// Checkout shares of a 4-person trip: 1000 + 70/4 = USD 1017.50 each.
const organizer: Share = { id: "s-org", kind: "SHARE", travelerId: null, userId: "organizer", status: "APPROVED", stripePaymentIntentId: "pi_org", amount: 1017.5 };
const ana = (status = "PENDING", intent: string | null = "pi_ana"): Share => ({ id: "s-ana", kind: "SHARE", travelerId: "t-ana", userId: "ana", status, stripePaymentIntentId: intent, amount: 1017.5 });
const bo = (status = "APPROVED"): Share => ({ id: "s-bo", kind: "SHARE", travelerId: "t-bo", userId: "bo", status, stripePaymentIntentId: "pi_bo", amount: 1017.5 });
const cy = (status = "PENDING"): Share => ({ id: "s-cy", kind: "SHARE", travelerId: "t-cy", userId: null, status, stripePaymentIntentId: null, amount: 1017.5 });

describe("confirmCollectedTrip", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
    mocks.totals.mockResolvedValue(totalsAt);
    db.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    db.paymentShare.create.mockImplementation(async () => ({ id: `topup-${db.paymentShare.create.mock.calls.length}` }));
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) =>
      id === "pi_org"
        ? { id: "pi_org", status: "succeeded", created: 1, livemode: true }
        : { id, status: "requires_payment_method", created: 1 });
    stripeMock.paymentIntents.cancel.mockResolvedValue({});
    mocks.sale.mockResolvedValue({});
  });

  it("confirms the trip for those who paid and re-splits per-trip costs into top-ups (4 → 2)", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo(), cy()]));
    db.paymentShare.count.mockResolvedValue(1);

    await expect(confirmCollectedTrip("trip-1", NOW)).resolves.toBe(true);

    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_ana");
    expect(db.tripRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "trip-1", status: "COLLECTING" },
      data: {
        status: "CONFIRMED",
        pax: 2,
        paxDetails: { adults: 2, minors: 0, pets: 0, rooms: 2 },
        topUpDeadline: new Date(NOW.getTime() + 48 * HOUR),
      },
    });
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["s-ana", "s-cy"] } },
      data: { status: "CANCELLED" },
    });
    expect(db.tripTraveler.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["t-ana", "t-cy"] } } });
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: "payment-1" }, data: { amount: 2070 } });
    // 70/4 = 17.50 per person before, 70/2 = 35 after → USD 17.50 each.
    expect(db.paymentShare.create).toHaveBeenCalledWith({
      data: { paymentId: "payment-1", travelerId: null, userId: "organizer", kind: "TOP_UP", amount: 17.5, currency: "USD" },
    });
    expect(db.paymentShare.create).toHaveBeenCalledWith({
      data: { paymentId: "payment-1", travelerId: "t-bo", userId: "bo", kind: "TOP_UP", amount: 17.5, currency: "USD" },
    });
    expect(db.saleNotificationDelivery.create).toHaveBeenCalledWith({
      data: { paymentId: "payment-1", stripePaymentIntentId: "pi_org", tripRequestId: "trip-1", amount: 2070, currency: "USD" },
    });
    expect(mocks.confirmedEmail).toHaveBeenCalledWith("trip-1", "organizer");
    expect(mocks.adminEmail).toHaveBeenCalledWith("trip-1", "organizer");
    expect(mocks.sale).toHaveBeenCalledWith("payment-1");
    expect(mocks.topUpEmail).toHaveBeenCalledTimes(2);
    expect(mocks.topUpEmail).toHaveBeenCalledWith("topup-1");
  });

  it("keeps a companion whose payment succeeded just before the deadline", async () => {
    db.tripRequest.findUnique
      .mockResolvedValueOnce(trip([organizer, ana(), bo()]))
      .mockResolvedValueOnce(trip([organizer, ana("APPROVED"), bo()]));
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) =>
      ({ id, status: "succeeded", created: 100, livemode: true }));
    db.paymentShare.count.mockResolvedValue(2);

    await confirmCollectedTrip("trip-1", NOW);

    expect(mocks.settle).toHaveBeenCalledWith("pi_ana", "APPROVED", new Date(100_000));
    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
    expect(db.tripTraveler.deleteMany).not.toHaveBeenCalled();
    expect(db.tripRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ pax: 3 }),
    }));
  });

  it("creates no top-ups when everyone paid", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()]));
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.paymentShare.create).not.toHaveBeenCalled();
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: "payment-1" }, data: { amount: 3070 } });
  });

  it("keeps the organizer's percentage promo on the top-ups", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo()], {
      payment: { ...trip([organizer, ana(), bo()]).payment, stripePromotionCodeId: "promo_1" },
    }));
    stripeMock.promotionCodes.retrieve.mockResolvedValue({ promotion: { coupon: "coupon_1" } });
    stripeMock.coupons.retrieve.mockResolvedValue({ percent_off: 10 });
    db.paymentShare.count.mockResolvedValue(1);
    await confirmCollectedTrip("trip-1", NOW);
    // 3 → 2 travelers: 70/3 → 70/2 per person = 11.67 more, 10% off.
    expect(db.paymentShare.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ travelerId: "t-bo", kind: "TOP_UP", amount: 10.5 }),
    });
  });

  it("queues no sale notification for a test-mode payment", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()]));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_org", status: "succeeded", created: 1, livemode: false });
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.saleNotificationDelivery.create).not.toHaveBeenCalled();
    expect(mocks.sale).not.toHaveBeenCalled();
    expect(mocks.confirmedEmail).toHaveBeenCalledOnce();
  });

  it("retries later while a share payment is still processing", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo()]));
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) =>
      ({ id, status: id === "pi_org" ? "succeeded" : "processing", created: 1, livemode: true }));
    await expect(confirmCollectedTrip("trip-1", NOW)).rejects.toThrow("still processing");
    expect(db.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("rolls back when a share settles between pricing and the write", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo()]));
    db.paymentShare.count.mockResolvedValue(2);
    await expect(confirmCollectedTrip("trip-1", NOW)).rejects.toThrow("Shares changed");
    expect(mocks.confirmedEmail).not.toHaveBeenCalled();
  });

  it("emails no top-up when nobody owes one", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()]));
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(mocks.topUpEmail).not.toHaveBeenCalled();
  });

  it("does nothing when another run already confirmed the trip", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()]));
    db.tripRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(confirmCollectedTrip("trip-1", NOW)).resolves.toBe(false);
    expect(db.payment.update).not.toHaveBeenCalled();
    expect(mocks.confirmedEmail).not.toHaveBeenCalled();
  });

  it("skips a trip that is no longer collecting", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer], { status: "CONFIRMED" }));
    await expect(confirmCollectedTrip("trip-1", NOW)).resolves.toBe(false);
    expect(stripeMock.paymentIntents.retrieve).not.toHaveBeenCalled();
  });
});

describe("confirmCollectedTrip corrections", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
    mocks.totals.mockResolvedValue(totalsAt);
    db.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    db.paymentShare.create.mockImplementation(async () => ({ id: `topup-${db.paymentShare.create.mock.calls.length}` }));
    stripeMock.paymentIntents.cancel.mockResolvedValue({});
    mocks.sale.mockResolvedValue({});
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) =>
      id === "pi_org"
        ? { id: "pi_org", status: "succeeded", created: 1, livemode: true }
        : { id, status: "requires_payment_method", created: 1 });
  });

  it("queues the sale for a live organizer payment even when the stored event is empty", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()], {
      payment: { ...trip([]).payment, providerResponse: {}, shares: [organizer, ana("APPROVED"), bo()] },
    }));
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.saleNotificationDelivery.create).toHaveBeenCalledOnce();
  });

  it("records what was actually collected when a fixed promo makes the smaller trip cheaper", async () => {
    // Organizer paid 1035 − 25 = 1010 on a 2-person trip with USD 50 off; alone it costs 1070 − 50 = 1020,
    // so they owe a USD 10 top-up and the bill is what they paid in total.
    const orgShare = { ...organizer, amount: 1010 };
    const anaShare = { ...ana(), amount: 1010 };
    db.tripRequest.findUnique.mockResolvedValue(trip([orgShare, anaShare], {
      paxDetails: { adults: 2, minors: 0, rooms: 1 }, pax: 2,
      payment: { ...trip([]).payment, stripePromotionCodeId: "promo_1", shares: [orgShare, anaShare] },
    }));
    stripeMock.promotionCodes.retrieve.mockResolvedValue({ promotion: { coupon: { amount_off: 5000 } } });
    db.paymentShare.count.mockResolvedValue(0);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: "payment-1" }, data: { amount: 1020 } });
  });

  it("never records a bill below the money already collected", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Everyone paid USD 1100 each (stored), while current pricing for 3 people says less.
    const paid = (share: Share) => ({ ...share, status: "APPROVED", amount: 1100 });
    const shares = [paid(organizer), paid(ana("APPROVED")), paid(bo())];
    db.tripRequest.findUnique.mockResolvedValue(trip(shares, {
      paxDetails: { adults: 3, minors: 0, rooms: 2 }, pax: 3,
      payment: { ...trip([]).payment, shares },
    }));
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: "payment-1" }, data: { amount: 3300 } });
    expect(db.saleNotificationDelivery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 3300 }),
    });
    // Overpayment is kept and refunded by hand, so it is logged for ops.
    expect(warn).toHaveBeenCalledWith("[split-deadline] collected more than the trip now costs; refund by hand if due", {
      tripId: "trip-1", collected: 3300, tripTotal: 3070, currency: "USD",
    });
  });

  it("also cancels a share intent created while collection was closing", async () => {
    db.tripRequest.findUnique
      .mockResolvedValueOnce(trip([organizer, ana("PENDING", null), bo()]))
      .mockResolvedValue(trip([organizer, ana("PENDING", "pi_late"), bo()]));
    db.paymentShare.count.mockResolvedValue(1);
    await confirmCollectedTrip("trip-1", NOW);
    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_late");
  });
});

describe("runDeadlinePass", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
    mocks.totals.mockResolvedValue(totalsAt);
  });

  it("selects only INDIVIDUAL trips past their deadline and counts failures without stopping", async () => {
    db.tripRequest.findMany.mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]);
    db.tripRequest.findUnique
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValue(trip([organizer], { id: "trip-2", status: "CONFIRMED" }));
    expect(await runDeadlinePass(NOW)).toEqual({ confirmed: 0, skipped: 1, failed: 1 });
    expect(db.tripRequest.findMany).toHaveBeenCalledWith({
      where: { paymentMode: "INDIVIDUAL", status: "COLLECTING", paymentDeadline: { lte: NOW } },
      select: { id: true },
    });
  });
});

describe("runReinvitePass", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps re-inviting other trips when one fails", async () => {
    db.tripRequest.findMany.mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]);
    mocks.invite.mockRejectedValueOnce(new Error("db down"));
    expect(await runReinvitePass(NOW)).toEqual({ trips: 2 });
    expect(mocks.invite).toHaveBeenCalledWith("trip-2");
  });

  it("re-sends missed invites only while the trip is still collecting", async () => {
    db.tripRequest.findMany.mockResolvedValue([{ id: "trip-1" }]);
    expect(await runReinvitePass(NOW)).toEqual({ trips: 1 });
    expect(mocks.invite).toHaveBeenCalledWith("trip-1");
    expect(db.tripRequest.findMany).toHaveBeenCalledWith({
      where: {
        paymentMode: "INDIVIDUAL",
        status: "COLLECTING",
        paymentDeadline: { gt: NOW },
        travelers: { some: { kind: "ADULT", status: "PENDING", userId: null, email: { not: null } } },
      },
      select: { id: true },
    });
  });
});

describe("runTopUpReminderPass", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reminds each unpaid top-up once in the last day of its grace period", async () => {
    db.paymentShare.findMany.mockResolvedValue([{ id: "topup-1" }, { id: "topup-2" }]);
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    mocks.topUpDeliver.mockResolvedValue(undefined);

    expect(await runTopUpReminderPass(NOW)).toEqual({ reminded: 2, failed: 0 });

    expect(db.paymentShare.findMany).toHaveBeenCalledWith({
      where: {
        kind: "TOP_UP",
        reminderSentAt: null,
        status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] },
        payment: {
          tripRequest: {
            status: { in: ["CONFIRMED", "REVEALED"] },
            topUpDeadline: { gt: NOW, lte: new Date(NOW.getTime() + 24 * HOUR) },
          },
        },
      },
      select: { id: true },
    });
    expect(mocks.topUpDeliver).toHaveBeenCalledWith("topup-1", true);
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: "topup-1", reminderSentAt: null },
      data: { reminderSentAt: NOW },
    });
  });

  it("leaves a failed send unstamped so the next run retries it", async () => {
    db.paymentShare.findMany.mockResolvedValue([{ id: "topup-1" }, { id: "topup-2" }]);
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    mocks.topUpDeliver.mockRejectedValueOnce(new Error("provider down")).mockResolvedValue(undefined);

    expect(await runTopUpReminderPass(NOW)).toEqual({ reminded: 1, failed: 1 });
    expect(db.paymentShare.updateMany).toHaveBeenCalledTimes(1);
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "topup-2", reminderSentAt: null } }));
  });
});

describe("closeTopUpGrace", () => {
  const graceEnd = new Date("2026-11-01T12:00:00.000Z");
  const topUp = (id: string, userId: string, status: string, intent: string | null = null): Share => ({
    id, kind: "TOP_UP", travelerId: userId === "organizer" ? null : `t-${userId}`, userId, status, stripePaymentIntentId: intent, amount: 17.5,
  });
  const graceTrip = (shares: Share[]) =>
    trip(shares, { status: "CONFIRMED", topUpDeadline: graceEnd, payment: { ...trip([]).payment, shares } });

  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
    db.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    db.paymentShare.updateMany.mockResolvedValue({ count: 2 });
    db.paymentShare.create.mockResolvedValue({ id: "remainder-1" });
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) => ({ id, status: "requires_payment_method", created: 1 }));
    stripeMock.paymentIntents.cancel.mockResolvedValue({});
  });

  it("folds every unpaid top-up into one remainder for the organizer", async () => {
    const shares = [organizer, topUp("tu-org", "organizer", "PENDING", "pi_tu_org"), topUp("tu-bo", "bo", "FAILED"), topUp("tu-ana", "ana", "APPROVED")];
    db.tripRequest.findUnique.mockResolvedValue(graceTrip(shares));

    await expect(closeTopUpGrace("trip-1")).resolves.toEqual({ closed: true, remainderId: "remainder-1" });

    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_tu_org");
    expect(db.tripRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "trip-1", topUpDeadline: graceEnd },
      data: { topUpDeadline: null },
    });
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["tu-org", "tu-bo"] }, status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] } },
      data: { status: "CANCELLED" },
    });
    expect(db.paymentShare.create).toHaveBeenCalledWith({
      data: { paymentId: "payment-1", travelerId: null, userId: "organizer", kind: "ORGANIZER_REMAINDER", amount: 35, currency: "USD" },
    });
    expect(mocks.topUpEmail).toHaveBeenCalledWith("remainder-1");
  });

  it("creates no remainder when every top-up was paid", async () => {
    db.tripRequest.findUnique.mockResolvedValue(graceTrip([organizer, topUp("tu-bo", "bo", "APPROVED")]));
    await expect(closeTopUpGrace("trip-1")).resolves.toEqual({ closed: true, remainderId: null });
    expect(db.paymentShare.create).not.toHaveBeenCalled();
    expect(mocks.topUpEmail).not.toHaveBeenCalled();
  });

  it("settles a top-up Stripe already charged instead of folding it", async () => {
    db.tripRequest.findUnique
      .mockResolvedValueOnce(graceTrip([organizer, topUp("tu-bo", "bo", "PENDING", "pi_tu_bo")]))
      .mockResolvedValueOnce(graceTrip([organizer, topUp("tu-bo", "bo", "APPROVED", "pi_tu_bo")]));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_tu_bo", status: "succeeded", created: 5 });
    await expect(closeTopUpGrace("trip-1")).resolves.toEqual({ closed: true, remainderId: null });
    expect(mocks.settle).toHaveBeenCalledWith("pi_tu_bo", "APPROVED", new Date(5000));
    expect(db.paymentShare.create).not.toHaveBeenCalled();
  });

  it("does nothing when another run already closed the grace period", async () => {
    db.tripRequest.findUnique.mockResolvedValue(graceTrip([organizer, topUp("tu-bo", "bo", "PENDING")]));
    db.tripRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(closeTopUpGrace("trip-1")).resolves.toEqual({ closed: false, remainderId: null });
    expect(db.paymentShare.create).not.toHaveBeenCalled();
  });

  it("also cancels a top-up intent created while the grace period was closing", async () => {
    db.tripRequest.findUnique
      .mockResolvedValueOnce(graceTrip([organizer, topUp("tu-bo", "bo", "PENDING")]))
      .mockResolvedValue(graceTrip([organizer, topUp("tu-bo", "bo", "PENDING", "pi_late")]));
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    await closeTopUpGrace("trip-1");
    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_late");
  });

  it("never folds a refunded or disputed top-up into the remainder", async () => {
    db.tripRequest.findUnique.mockResolvedValue(graceTrip([
      organizer, topUp("tu-bo", "bo", "PENDING"), topUp("tu-cy", "cy", "REFUNDED"), topUp("tu-di", "di", "CHARGEBACK"),
    ]));
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    await closeTopUpGrace("trip-1");
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["tu-bo"] }, status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] } },
      data: { status: "CANCELLED" },
    });
    expect(db.paymentShare.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 17.5 }) });
  });

  it("rolls back when a top-up is paid while folding", async () => {
    db.tripRequest.findUnique.mockResolvedValue(graceTrip([organizer, topUp("tu-org", "organizer", "PENDING"), topUp("tu-bo", "bo", "PENDING")]));
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    await expect(closeTopUpGrace("trip-1")).rejects.toThrow("Top-ups changed");
    expect(mocks.topUpEmail).not.toHaveBeenCalled();
  });
});

describe("runRemainderPass", () => {
  beforeEach(() => vi.resetAllMocks());

  it("closes grace periods that ended and counts failures without stopping", async () => {
    db.tripRequest.findMany.mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]);
    db.tripRequest.findUnique.mockRejectedValueOnce(new Error("db down")).mockResolvedValue(null);
    expect(await runRemainderPass(NOW)).toEqual({ closed: 0, remainders: 0, failed: 1 });
    expect(db.tripRequest.findMany).toHaveBeenCalledWith({
      where: { paymentMode: "INDIVIDUAL", status: { in: ["CONFIRMED", "REVEALED"] }, topUpDeadline: { lte: NOW } },
      select: { id: true },
    });
  });
});

