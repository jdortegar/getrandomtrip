import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
const stripeMock = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock }));
const db = vi.hoisted(() => ({ paymentShare: { findUnique: vi.fn(), updateMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getServerSession } from "next-auth";
import { POST } from "../route";

const HOUR = 60 * 60 * 1000;
const request = (body: unknown) =>
  new Request("http://localhost/api/stripe/top-up-intent", { method: "POST", body: JSON.stringify(body) }) as unknown as import("next/server").NextRequest;

function topUp(overrides: { share?: Record<string, unknown>; trip?: Record<string, unknown> } = {}) {
  return {
    id: "topup-ana",
    kind: "TOP_UP",
    userId: "ana",
    travelerId: "traveler-ana",
    amount: 17.5,
    currency: "USD",
    status: "PENDING",
    stripePaymentIntentId: null,
    payment: {
      tripRequest: {
        id: "trip-1",
        status: "CONFIRMED",
        topUpDeadline: new Date(Date.now() + 10 * HOUR),
        ...overrides.trip,
      },
    },
    ...overrides.share,
  };
}

describe("POST /api/stripe/top-up-intent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "ana" } });
    db.paymentShare.updateMany.mockResolvedValue({ count: 1 });
    stripeMock.paymentIntents.create.mockResolvedValue({ id: "pi_topup", client_secret: "secret_topup" });
  });

  it("creates an intent for the payer's own top-up, tagged for the webhook", async () => {
    db.paymentShare.findUnique.mockResolvedValue(topUp());
    const res = await POST(request({ shareId: "topup-ana" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ clientSecret: "secret_topup", amount: 17.5, currency: "USD" });
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1750,
      currency: "usd",
      metadata: { kind: "TOP_UP", shareId: "topup-ana", travelerId: "traveler-ana", tripId: "trip-1", userId: "ana" },
    });
  });

  it("supports the organizer's top-up, which has no traveler row", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "organizer" } });
    db.paymentShare.findUnique.mockResolvedValue(topUp({ share: { userId: "organizer", travelerId: null } }));
    await POST(request({ shareId: "topup-ana" }));
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { kind: "TOP_UP", shareId: "topup-ana", tripId: "trip-1", userId: "organizer" },
    }));
  });

  it.each([
    ["another payer's top-up", { userId: "bo" }],
    ["a companion share", { kind: "SHARE" }],
  ])("hides %s behind a 404", async (_label, share) => {
    db.paymentShare.findUnique.mockResolvedValue(topUp({ share }));
    expect((await POST(request({ shareId: "topup-ana" }))).status).toBe(404);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it.each([
    ["the grace period ended", { topUpDeadline: new Date(Date.now() - 1) }, "GRACE_PASSED"],
    ["the trip is still collecting", { status: "COLLECTING" }, "NOT_OPEN"],
  ])("refuses payment when %s", async (_label, trip, errorCode) => {
    db.paymentShare.findUnique.mockResolvedValue(topUp({ trip }));
    const res = await POST(request({ shareId: "topup-ana" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ errorCode });
  });

  it("returns the JSON 500 when Stripe fails to create the intent", async () => {
    db.paymentShare.findUnique.mockResolvedValue(topUp());
    stripeMock.paymentIntents.create.mockRejectedValue(new Error("stripe down"));
    const res = await POST(request({ shareId: "topup-ana" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });

  it("lets the organizer pay their remainder after the grace period, with no deadline", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "organizer" } });
    db.paymentShare.findUnique.mockResolvedValue(topUp({
      share: { kind: "ORGANIZER_REMAINDER", userId: "organizer", travelerId: null, amount: 35 },
      trip: { topUpDeadline: null },
    }));
    const res = await POST(request({ shareId: "topup-ana" }));
    expect(res.status).toBe(200);
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 3500,
      metadata: expect.objectContaining({ kind: "ORGANIZER_REMAINDER" }),
    }));
  });

  it("reports an already paid top-up", async () => {
    db.paymentShare.findUnique.mockResolvedValue(topUp({ share: { status: "APPROVED" } }));
    expect(await (await POST(request({ shareId: "topup-ana" }))).json()).toMatchObject({ paid: true });
  });

  it("requires a session and a share id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    expect((await POST(request({ shareId: "topup-ana" }))).status).toBe(401);
    expect((await POST(request({}))).status).toBe(400);
  });
});
