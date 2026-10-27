import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const client = {
    tripRequest: { findUnique: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    paymentShare: { count: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
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
}));
vi.mock("@/lib/db/paymentShare", () => ({ settleShareFromStripe: mocks.settle }));
vi.mock("@/lib/payments/trip-totals.server", () => ({ loadTripTotalsAt: mocks.totals }));
vi.mock("@/lib/db/payment", () => ({ inviteSplitCompanions: mocks.invite }));
vi.mock("@/lib/db/runSaleNotificationBatch", () => ({ runSaleNotificationBatch: mocks.sale }));
vi.mock("@/lib/email", () => ({
  sendBookingConfirmed: mocks.confirmedEmail,
  sendAdminNewBooking: mocks.adminEmail,
}));

import { confirmCollectedTrip, runDeadlinePass, runReinvitePass } from "../passes";

const NOW = new Date("2026-10-30T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
// USD 1000 per person + USD 70 per-trip add-on
const totalsAt = (pax: number) => ({
  addonsPerPax: 70 / pax, basePerPax: 1000, cancelInsurancePerPax: 0, filtersPerPax: 0,
  totalPerPax: 1000 + 70 / pax, totalTrip: 1000 * pax + 70,
});

type Share = { id: string; kind: string; travelerId: string | null; userId: string | null; status: string; stripePaymentIntentId: string | null };
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
const organizer: Share = { id: "s-org", kind: "SHARE", travelerId: null, userId: "organizer", status: "APPROVED", stripePaymentIntentId: "pi_org" };
const ana = (status = "PENDING", intent: string | null = "pi_ana"): Share => ({ id: "s-ana", kind: "SHARE", travelerId: "t-ana", userId: "ana", status, stripePaymentIntentId: intent });
const bo = (status = "APPROVED"): Share => ({ id: "s-bo", kind: "SHARE", travelerId: "t-bo", userId: "bo", status, stripePaymentIntentId: "pi_bo" });
const cy = (status = "PENDING"): Share => ({ id: "s-cy", kind: "SHARE", travelerId: "t-cy", userId: null, status, stripePaymentIntentId: null });

describe("confirmCollectedTrip", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
    mocks.totals.mockResolvedValue(totalsAt);
    db.tripRequest.updateMany.mockResolvedValue({ count: 1 });
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_ana", status: "requires_payment_method", created: 1 });
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
  });

  it("keeps a companion whose payment succeeded just before the deadline", async () => {
    db.tripRequest.findUnique
      .mockResolvedValueOnce(trip([organizer, ana(), bo()]))
      .mockResolvedValueOnce(trip([organizer, ana("APPROVED"), bo()]));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_ana", status: "succeeded", created: 100 });
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
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana("APPROVED"), bo()], {
      payment: { ...trip([]).payment, providerResponse: { livemode: false }, shares: [organizer, ana("APPROVED"), bo()] },
    }));
    db.paymentShare.count.mockResolvedValue(2);
    await confirmCollectedTrip("trip-1", NOW);
    expect(db.saleNotificationDelivery.create).not.toHaveBeenCalled();
    expect(mocks.sale).not.toHaveBeenCalled();
    expect(mocks.confirmedEmail).toHaveBeenCalledOnce();
  });

  it("retries later while a share payment is still processing", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo()]));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_ana", status: "processing", created: 1 });
    await expect(confirmCollectedTrip("trip-1", NOW)).rejects.toThrow("still processing");
    expect(db.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("rolls back when a share settles between pricing and the write", async () => {
    db.tripRequest.findUnique.mockResolvedValue(trip([organizer, ana(), bo()]));
    db.paymentShare.count.mockResolvedValue(2);
    await expect(confirmCollectedTrip("trip-1", NOW)).rejects.toThrow("Shares changed");
    expect(mocks.confirmedEmail).not.toHaveBeenCalled();
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
