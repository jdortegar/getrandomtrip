import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  consumeTravelerInvite: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { consumeTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

type RouteModule = typeof import("../route");

// ── Helpers ────────────────────────────────────────────────────────────────
function makeRequest(body: unknown) {
  return new Request("http://localhost/api/travelers/submit", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const validBody = {
  token: "tok",
  fullName: "Bob Companion",
  idDocument: "ID999",
  email: "bob@example.com",
  consent: true,
};

describe("POST /api/travelers/submit", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("../route");
    POST = mod.POST;
  });

  it("returns 400 when consent is not true", async () => {
    const res = await POST(makeRequest({ ...validBody, consent: false }));
    expect(res.status).toBe(400);
    expect(consumeTravelerInvite).not.toHaveBeenCalled();
  });

  it("returns 400 with reason when consumeTravelerInvite is not ok", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "expired" });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reason).toBe("expired");
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("creates one TRAVELER_SUBMITTED notification for the buyer and returns ok:true on success", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ userId: "buyer-1", user: { locale: "es" } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    const args = (prisma.notification.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.userId).toBe("buyer-1");
    expect(args.data.type).toBe("TRAVELER_SUBMITTED");
    expect(args.data.audience).toBe("TRAVELER");
  });

  it("localizes the notification title to Spanish for an es-locale buyer (not a hardcoded string)", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ userId: "buyer-1", user: { locale: "es" } });

    await POST(makeRequest(validBody));

    const args = (prisma.notification.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.title).toBe(esCopy.inviteTravelers.notifTitle);
  });

  it("localizes the notification title to English for an en-locale buyer", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ userId: "buyer-1", user: { locale: "en" } });

    await POST(makeRequest(validBody));

    const args = (prisma.notification.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.title).toBe(enCopy.inviteTravelers.notifTitle);
  });

  it("defaults to Spanish when the buyer has no locale set", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ userId: "buyer-1", user: null });

    await POST(makeRequest(validBody));

    const args = (prisma.notification.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.title).toBe(esCopy.inviteTravelers.notifTitle);
  });

  it("does not create a duplicate notification when the token was already consumed", async () => {
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "used" });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(400);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});
