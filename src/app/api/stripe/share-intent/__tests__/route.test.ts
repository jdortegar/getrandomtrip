import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
const stripeMock = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock }));
const db = vi.hoisted(() => ({
  tripTraveler: { findUnique: vi.fn() },
  paymentShare: { updateMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getServerSession } from "next-auth";
import { POST } from "../route";

const HOUR = 60 * 60 * 1000;

function request(body: unknown) {
  return new Request("http://localhost/api/stripe/share-intent", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function traveler(overrides: { trip?: Record<string, unknown>; share?: Record<string, unknown> | null; userId?: string } = {}) {
  return {
    id: "traveler-ana",
    userId: overrides.userId ?? "ana",
    tripRequest: {
      id: "trip-1",
      paymentMode: "INDIVIDUAL",
      status: "COLLECTING",
      paymentDeadline: new Date(Date.now() + 10 * HOUR),
      ...overrides.trip,
    },
    paymentShares: overrides.share === null ? [] : [{
      id: "share-ana",
      amount: 1023.33,
      currency: "USD",
      status: "PENDING",
      stripePaymentIntentId: null,
      ...overrides.share,
    }],
  };
}

describe("POST /api/stripe/share-intent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "ana" } });
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    stripeMock.paymentIntents.create.mockResolvedValue({ id: "pi_share", client_secret: "secret_share" });
    stripeMock.paymentIntents.cancel.mockResolvedValue({});
  });

  it("creates an intent for the companion's own share and claims it", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler());
    const res = await POST(request({ travelerId: "traveler-ana" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ clientSecret: "secret_share", amount: 1023.33, currency: "USD" });
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
      amount: 102333,
      currency: "usd",
      metadata: { kind: "SHARE", shareId: "share-ana", travelerId: "traveler-ana", tripId: "trip-1", userId: "ana" },
    });
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: "share-ana", stripePaymentIntentId: null, status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] } },
      data: { stripePaymentIntentId: "pi_share", status: "PENDING", userId: "ana" },
    });
  });

  it("hides other people's shares behind a 404", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ userId: "bo" }));
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(404);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("requires a session and a traveler id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(401);
    expect((await POST(request({}))).status).toBe(400);
  });

  it.each([
    ["the deadline passed", { paymentDeadline: new Date(Date.now() - 1) }, "DEADLINE_PASSED"],
    ["the trip is no longer collecting", { status: "CONFIRMED" }, "NOT_COLLECTING"],
    ["the trip is paid in total", { paymentMode: "TOTAL" }, "NOT_COLLECTING"],
  ])("refuses payment when %s", async (_label, trip, errorCode) => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ trip }));
    const res = await POST(request({ travelerId: "traveler-ana" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ errorCode });
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("reports an already paid share without a new intent", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ share: { status: "APPROVED" } }));
    expect(await (await POST(request({ travelerId: "traveler-ana" }))).json()).toMatchObject({ paid: true });
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("settles a USD 0 share without Stripe", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ share: { amount: 0 } }));
    expect(await (await POST(request({ travelerId: "traveler-ana" }))).json()).toMatchObject({ paid: true, amount: 0 });
    expect(db.paymentShare.updateMany).toHaveBeenCalledWith({
      where: { id: "share-ana", status: "PENDING" },
      data: { status: "APPROVED", paidAt: expect.any(Date), userId: "ana" },
    });
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("reuses an unpaid intent with the same amount", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ share: { stripePaymentIntentId: "pi_existing", status: "FAILED" } }));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_existing", status: "requires_payment_method", amount: 102333, client_secret: "secret_existing",
    });
    expect(await (await POST(request({ travelerId: "traveler-ana" }))).json()).toMatchObject({ clientSecret: "secret_existing" });
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    expect(stripeMock.paymentIntents.cancel).not.toHaveBeenCalled();
  });

  it("refuses a second intent while one is processing, or when Stripe cannot confirm the old one", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ share: { stripePaymentIntentId: "pi_existing" } }));
    stripeMock.paymentIntents.retrieve.mockResolvedValueOnce({ id: "pi_existing", status: "processing" });
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(409);
    stripeMock.paymentIntents.retrieve.mockRejectedValueOnce(new Error("network"));
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(502);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("replaces a gone intent after a definitive Stripe lookup failure", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler({ share: { stripePaymentIntentId: "pi_gone" } }));
    stripeMock.paymentIntents.retrieve.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({ type: "invalid_request_error", message: "No such payment_intent" }),
    );
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(200);
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledOnce();
  });

  it("cancels its new intent when another request claimed the share first", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(traveler());
    db.paymentShare.updateMany.mockResolvedValue({ count: 0 });
    expect((await POST(request({ travelerId: "traveler-ana" }))).status).toBe(409);
    expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith("pi_share");
  });
});
