import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ tripTraveler: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
const stripeMock = vi.hoisted(() => ({ paymentIntents: { retrieve: vi.fn() } }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock }));
const settle = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/paymentShare", () => ({ settleShareFromStripe: settle }));
const maxTopUp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments/invitee-top-up.server", () => ({ loadInviteeMaxTopUp: maxTopUp }));

import { loadShareCheckout } from "../share-checkout.server";

const HOUR = 60 * 60 * 1000;

function row(overrides: { trip?: Record<string, unknown>; share?: Record<string, unknown> | null; userId?: string | null } = {}) {
  return {
    id: "traveler-ana",
    userId: overrides.userId === undefined ? "ana" : overrides.userId,
    email: "ana@example.com",
    fullName: "Ana Paz",
    user: { email: "ana@example.com", name: "Ana Paz" },
    tripRequest: {
      paymentMode: "INDIVIDUAL",
      status: "COLLECTING",
      paymentDeadline: new Date(Date.now() + 10 * HOUR),
      departureTimeZone: "America/Argentina/Buenos_Aires",
      type: "group",
      level: "essenza",
      originCity: "Buenos Aires",
      originCountry: "Argentina",
      startDate: new Date("2026-12-03T00:00:00.000Z"),
      nights: 4,
      user: { name: "Lucía Gómez" },
      ...overrides.trip,
    },
    paymentShares: overrides.share === null ? [] : [{
      id: "share-ana",
      amount: 1023.33,
      currency: "USD",
      status: "PENDING",
      stripePaymentIntentId: "pi_share",
      ...overrides.share,
    }],
  };
}

describe("loadShareCheckout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    maxTopUp.mockResolvedValue(11.67);
  });

  it("shows the companion their share to pay", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(row());
    expect(await loadShareCheckout("traveler-ana", "ana", "en")).toMatchObject({
      travelerId: "traveler-ana",
      state: "pay",
      amount: 1023.33,
      currency: "USD",
      organizerFirstName: "Lucía",
      billingEmail: "ana@example.com",
      billingName: "Ana Paz",
      maxTopUp: 11.67,
      trip: {
        type: "group",
        level: "essenza",
        originCity: "Buenos Aires",
        originCountry: "Argentina",
        startDate: "2026-12-03",
        nights: 4,
      },
    });
  });

  it("formats the deadline on the server in the trip's time zone", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(row({ trip: { paymentDeadline: new Date("2099-10-30T12:00:00Z") } }));
    expect((await loadShareCheckout("traveler-ana", "ana", "es"))?.paymentDeadlineLabel)
      .toBe("30 de octubre de 2099 a las 09:00");
  });

  it("only prices the worst-case top-up while the share is still payable", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(row({ share: { status: "APPROVED" } }));
    expect((await loadShareCheckout("traveler-ana", "ana", "en"))?.maxTopUp).toBe(0);
    expect(maxTopUp).not.toHaveBeenCalled();
  });

  it.each([["another user", "bo"], ["an unlinked row", null]])("hides the share from %s", async (_label, userId) => {
    db.tripTraveler.findUnique.mockResolvedValue(row({ userId: userId as string | null }));
    expect(await loadShareCheckout("traveler-ana", "ana", "en")).toBeNull();
  });

  it("returns null when the traveler has no share", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(row({ share: null }));
    expect(await loadShareCheckout("traveler-ana", "ana", "en")).toBeNull();
  });

  it.each([
    ["the deadline passed", { paymentDeadline: new Date(Date.now() - 1) }],
    ["the trip was confirmed", { status: "CONFIRMED" }],
  ])("is closed when %s", async (_label, trip) => {
    db.tripTraveler.findUnique.mockResolvedValue(row({ trip }));
    expect((await loadShareCheckout("traveler-ana", "ana", "en"))?.state).toBe("closed");
  });

  it("settles on return from Stripe when the share's intent succeeded", async () => {
    db.tripTraveler.findUnique
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(row({ share: { status: "APPROVED" } }));
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_share", status: "succeeded", created: 100, metadata: { shareId: "share-ana" },
    });
    expect((await loadShareCheckout("traveler-ana", "ana", "en", "pi_share"))?.state).toBe("paid");
    expect(settle).toHaveBeenCalledWith("pi_share", "APPROVED", new Date(100_000));
  });

  it.each([
    ["an intent the share does not hold", "pi_other", { id: "pi_other", status: "succeeded", created: 1, metadata: { shareId: "share-ana" } }],
    ["an unpaid intent", "pi_share", { id: "pi_share", status: "requires_payment_method", created: 1, metadata: { shareId: "share-ana" } }],
    ["another share's intent", "pi_share", { id: "pi_share", status: "succeeded", created: 1, metadata: { shareId: "share-bo" } }],
  ])("never settles %s", async (_label, intentId, intent) => {
    db.tripTraveler.findUnique.mockResolvedValue(row());
    stripeMock.paymentIntents.retrieve.mockResolvedValue(intent);
    expect((await loadShareCheckout("traveler-ana", "ana", "en", intentId))?.state).toBe("pay");
    expect(settle).not.toHaveBeenCalled();
  });

  it("still renders when Stripe cannot be reached on return", async () => {
    db.tripTraveler.findUnique.mockResolvedValue(row());
    stripeMock.paymentIntents.retrieve.mockRejectedValue(new Error("network"));
    expect((await loadShareCheckout("traveler-ana", "ana", "en", "pi_share"))?.state).toBe("pay");
  });
});
