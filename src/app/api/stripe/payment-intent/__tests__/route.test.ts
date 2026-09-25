import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/tripRequest", () => ({
  revertExpiredPendingPayment: vi.fn(),
}));

vi.mock("@/lib/db/payment", () => ({
  upsertPaymentForTripCheckout: vi.fn(),
}));

vi.mock("@/lib/helpers/payment-totals", () => ({
  calculatePaymentTotals: vi.fn(),
}));

vi.mock("@/lib/data/traveler-types", () => ({
  applyPaxMultiplier: vi.fn((base: number) => base),
}));

vi.mock("@/lib/pricing/resolve-base-price", () => ({
  resolveBasePricePerPerson: vi.fn(),
}));

vi.mock("@/lib/pricing/tripper-price-overrides.server", () => ({
  loadTripperPriceOverrides: vi.fn(),
}));

const stripeMock = {
  promotionCodes: { list: vi.fn() },
  coupons: { retrieve: vi.fn() },
  paymentIntents: {
    retrieve: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
  },
};

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => stripeMock),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revertExpiredPendingPayment } from "@/lib/db/tripRequest";
import { upsertPaymentForTripCheckout } from "@/lib/db/payment";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { applyPaxMultiplier } from "@/lib/data/traveler-types";
import { resolveBasePricePerPerson } from "@/lib/pricing/resolve-base-price";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";

type RouteModule = typeof import("../route");

function makeRequest(tripId: string, promoCode?: string | null) {
  return new Request("http://localhost/api/stripe/payment-intent", {
    method: "POST",
    body: JSON.stringify({ tripId, ...(promoCode !== undefined ? { promoCode } : {}) }),
  }) as unknown as import("next/server").NextRequest;
}

function baseTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: "trip-1",
    userId: "buyer-1",
    status: "PENDING_PAYMENT",
    payment: null,
    type: "couple",
    level: "essenza",
    pax: 2,
    addons: [],
    accommodationType: "any",
    transport: "plane",
    climate: "any",
    maxTravelTime: "no-limit",
    departPref: "any",
    arrivePref: "any",
    avoidDestinations: [],
    nights: 3,
    startDate: null,
    endDate: null,
    originCountry: "Argentina",
    originCity: "Buenos Aires",
    ...overrides,
  };
}

describe("POST /api/stripe/payment-intent — expiry revert", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    stripeMock.paymentIntents.cancel.mockResolvedValue({ id: "pi_cancelled" });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (loadTripperPriceOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (
      resolveBasePricePerPerson as ReturnType<typeof vi.fn>
    ).mockReturnValue({ offered: true, price: 100, source: "catalog" });
    (applyPaxMultiplier as ReturnType<typeof vi.fn>).mockReturnValue(100);
    (calculatePaymentTotals as ReturnType<typeof vi.fn>).mockReturnValue({
      totalTrip: 200,
    });
    (
      upsertPaymentForTripCheckout as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_new",
      client_secret: "secret_new",
      amount: 20000,
    });

    const mod = await import("../route");
    POST = mod.POST;
  });

  it("repairs legacy one-person XSED Group to Solo before pricing and persists the normalized level", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(baseTrip({ type: "xsed", level: "group", pax: 1 }) as never);
    vi.mocked(revertExpiredPendingPayment).mockResolvedValue("PENDING_PAYMENT");
    vi.mocked(resolveBasePricePerPerson).mockImplementation(({ levelId }) => ({ offered: true, price: levelId === "solo" ? 350 : 250, source: "catalog" }));
    vi.mocked(applyPaxMultiplier).mockImplementation((price) => price);
    vi.mocked(calculatePaymentTotals).mockImplementation(({ basePriceUsd, logistics }) => ({ totalTrip: basePriceUsd * logistics.pax, basePerPax: basePriceUsd }) as never);
    const res = await POST(makeRequest("trip-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ total: 350, level: "solo", paxDetails: { adults: 1, minors: 0, rooms: 1 } });
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 35000 }));
    expect(upsertPaymentForTripCheckout).toHaveBeenCalledWith(expect.objectContaining({ level: "solo", amount: 350 }));
  });

  it("proceeds as a normal payable checkout when the trip was PENDING_PAYMENT but had expired (reverted to SAVED)", async () => {
    const trip = baseTrip({ status: "PENDING_PAYMENT" });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    (
      revertExpiredPendingPayment as ReturnType<typeof vi.fn>
    ).mockResolvedValue("SAVED");
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );

    const res = await POST(makeRequest("trip-1"));

    expect(revertExpiredPendingPayment).toHaveBeenCalledWith(trip);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("secret_new");
  });

  it("rejects a non-payable effective status with 409, even if the raw row was PENDING_PAYMENT", async () => {
    const trip = baseTrip({ status: "PENDING_PAYMENT" });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    // Not actually expired — effective status stays PENDING_PAYMENT here;
    // simulate the CONFIRMED case via a trip already CONFIRMED.
    (
      revertExpiredPendingPayment as ReturnType<typeof vi.fn>
    ).mockResolvedValue("CONFIRMED");

    const res = await POST(makeRequest("trip-1"));

    expect(res.status).toBe(409);
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
  });

  it("persists against the fresh version after expiry reversion updates the trip", async () => {
    const before = new Date("2026-09-24");
    const after = new Date("2026-09-25");
    vi.mocked(prisma.tripRequest.findUnique)
      .mockResolvedValueOnce(baseTrip({ updatedAt: before }) as never)
      .mockResolvedValueOnce(baseTrip({ status: "SAVED", updatedAt: after }) as never);
    vi.mocked(revertExpiredPendingPayment).mockResolvedValue("SAVED");
    const result = await POST(makeRequest("trip-1"));
    expect(result.status).toBe(200);
    expect(upsertPaymentForTripCheckout).toHaveBeenCalledWith(expect.objectContaining({ expectedTripUpdatedAt: after }));
  });
});

describe("POST /api/stripe/payment-intent — stale-intent amount guard", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    stripeMock.paymentIntents.cancel.mockResolvedValue({ id: "pi_cancelled" });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (loadTripperPriceOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (
      resolveBasePricePerPerson as ReturnType<typeof vi.fn>
    ).mockReturnValue({ offered: true, price: 100, source: "catalog" });
    (applyPaxMultiplier as ReturnType<typeof vi.fn>).mockReturnValue(100);
    (calculatePaymentTotals as ReturnType<typeof vi.fn>).mockReturnValue({
      totalTrip: 200, // amountCents = 20000
    });
    (
      upsertPaymentForTripCheckout as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );
    (
      revertExpiredPendingPayment as ReturnType<typeof vi.fn>
    ).mockImplementation(async (trip: { status: string }) => trip.status);

    const mod = await import("../route");
    POST = mod.POST;
  });

  function tripWithExistingIntent() {
    return baseTrip({
      status: "PENDING_PAYMENT",
      payment: {
        status: "PENDING",
        stripePaymentIntentId: "pi_existing",
      },
    });
  }

  it.each(["PROCESSING", "APPROVED", "COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED", "CHARGEBACK", "IN_PROCESS", "IN_MEDIATION"])(
    "rejects an immutable stored payment in %s status", async (status) => {
      vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(baseTrip({ payment: { status, stripePaymentIntentId: "pi_existing" } }) as never);
      expect((await POST(makeRequest("trip-1"))).status).toBe(409);
      expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    },
  );

  it("cancels only its new intent when persistence loses a trip-version race", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(baseTrip() as never);
    stripeMock.paymentIntents.create.mockResolvedValue({ id: "pi_new", client_secret: "new_secret" });
    vi.mocked(upsertPaymentForTripCheckout).mockRejectedValue(Object.assign(new Error("Checkout changed"), { status: 409 }));
    expect((await POST(makeRequest("trip-1"))).status).toBe(409);
    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_new");
  });

  it("does not cancel a reused intent when a settlement wins the persistence race", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(tripWithExistingIntent() as never);
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_existing", status: "requires_payment_method", amount: 20000, client_secret: "old_secret" });
    vi.mocked(upsertPaymentForTripCheckout).mockRejectedValue(Object.assign(new Error("Payment settled"), { status: 409 }));
    expect((await POST(makeRequest("trip-1"))).status).toBe(409);
    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
  });

  it("rejects unsupported null-coupon promotions without creating an intent", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(baseTrip() as never);
    stripeMock.promotionCodes.list.mockResolvedValue({ data: [{ id: "promo", promotion: { coupon: null } }] });
    expect((await POST(makeRequest("trip-1", "UNSUPPORTED"))).status).toBe(400);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it.each(["processing", "succeeded", "requires_capture"])("never replaces an intent already %s", async (status) => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(tripWithExistingIntent() as never);
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_existing", status, amount: 15000 });
    const response = await POST(makeRequest("trip-1"));
    expect(response.status).toBe(409);
    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("recalculates an existing percentage promo against the new party total and persists the charge", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(tripWithExistingIntent() as never);
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_existing", status: "requires_payment_method", amount: 9000,
      metadata: { promoCode: "TEN" } });
    stripeMock.promotionCodes.list.mockResolvedValue({ data: [{ id: "promo_ten", promotion: { coupon: { valid: true, percent_off: 10 } } }] });
    stripeMock.paymentIntents.create.mockResolvedValue({ id: "pi_new", client_secret: "new_secret" });

    const response = await POST(makeRequest("trip-1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ code: "TEN", discountAmount: 20, total: 180 });
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 18000 }));
    expect(upsertPaymentForTripCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 180 }));
  });

  it("reports the existing USD0.50 minimum for a full discount instead of displaying zero", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(baseTrip() as never);
    stripeMock.promotionCodes.list.mockResolvedValue({ data: [{ id: "promo_full", promotion: { coupon: { valid: true, percent_off: 100 } } }] });
    stripeMock.paymentIntents.create.mockResolvedValue({ id: "pi_new", client_secret: "new_secret" });
    const response = await POST(makeRequest("trip-1", "FULL"));
    expect(await response.json()).toMatchObject({ discountAmount: 199.5, total: 0.5 });
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 50 }));
    expect(upsertPaymentForTripCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 0.5 }));
  });

  it("rejects an invalid retained promo and cancels its stale intent without a full-price fallback", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(tripWithExistingIntent() as never);
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: "pi_existing", status: "requires_payment_method", metadata: { promoCode: "OLD" } });
    stripeMock.promotionCodes.list.mockResolvedValue({ data: [] });
    const response = await POST(makeRequest("trip-1"));
    expect(response.status).toBe(400);
    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_existing");
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  // (a) matching amount reuses the existing intent unchanged
  it("reuses the existing intent unchanged when its amount matches the current computed total", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_existing",
      status: "requires_payment_method",
      client_secret: "secret_existing",
      amount: 20000, // matches amountCents
    });

    const res = await POST(makeRequest("trip-1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("secret_existing");
    expect(body.paymentIntentId).toBe("pi_existing");
    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  // (b) mismatch cancels the stale intent and creates a fresh one
  it("cancels the stale intent and creates a fresh one when the amount no longer matches", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_existing",
      status: "requires_payment_method",
      client_secret: "secret_existing",
      amount: 15000, // stale — does not match the new amountCents (20000)
    });
    stripeMock.paymentIntents.cancel.mockResolvedValue({ id: "pi_existing" });
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_new",
      client_secret: "secret_new",
      amount: 20000,
    });

    const res = await POST(makeRequest("trip-1"));

    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith(
      "pi_existing",
    );
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 20000 }),
    );
    const cancelOrder =
      stripeMock.paymentIntents.cancel.mock.invocationCallOrder[0];
    const createOrder =
      stripeMock.paymentIntents.create.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(createOrder);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("secret_new");
    expect(body.paymentIntentId).toBe("pi_new");
  });

  // (c) cancel failure → 409, never falls through to create (double-charge guard)
  it("returns 409 and never creates a second intent when the stale-intent cancel fails", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_existing",
      status: "requires_payment_method",
      client_secret: "secret_existing",
      amount: 15000,
    });
    stripeMock.paymentIntents.cancel.mockRejectedValue(
      new Error("already succeeded"),
    );

    const res = await POST(makeRequest("trip-1"));

    expect(res.status).toBe(409);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  // (d) amounts match but client_secret is null → falls through to create
  it("cancels before replacing an intent whose client_secret is missing", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_existing",
      status: "requires_payment_method",
      client_secret: null,
      amount: 20000,
    });
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_new",
      client_secret: "secret_new",
      amount: 20000,
    });

    const res = await POST(makeRequest("trip-1"));

    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_existing");
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paymentIntentId).toBe("pi_new");
  });

  // (e) unpriceable trip with a live matching intent → 422, retrieve never happens
  it("returns 422 for an unpriceable trip before ever retrieving the existing intent", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    (calculatePaymentTotals as ReturnType<typeof vi.fn>).mockReturnValue({
      totalTrip: 0,
    });

    const res = await POST(makeRequest("trip-1"));

    expect(res.status).toBe(422);
    expect(stripeMock.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  // (f) retrieve fails with a definitive Stripe invalid-request error (e.g.
  // wrong-mode/deleted id) → the old intent is unusable, fall through and
  // create a fresh one. Safe because Stripe has told us this ID can never
  // resolve, not that it *might* still be live.
  it("falls through to create a fresh intent when retrieve fails with a definitive StripeInvalidRequestError", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({
        message:
          "No such payment_intent: 'pi_existing'; a similar object exists in test mode, but a live mode key was used to make this request.",
      }),
    );
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_new",
      client_secret: "secret_new",
      amount: 20000,
    });

    const res = await POST(makeRequest("trip-1"));

    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paymentIntentId).toBe("pi_new");
  });

  // (g) retrieve fails with a non-invalid-request (transient) Stripe error →
  // do NOT fall through and create a second intent (double-charge guard,
  // same philosophy as the cancel-failure branch above); surface the error.
  it("returns an error and never creates a second intent when retrieve fails with a transient Stripe error", async () => {
    const trip = tripWithExistingIntent();
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      trip,
    );
    stripeMock.paymentIntents.retrieve.mockRejectedValue(
      new Stripe.errors.StripeConnectionError({
        message: "An error occurred while connecting to Stripe.",
      }),
    );

    const res = await POST(makeRequest("trip-1"));

    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
