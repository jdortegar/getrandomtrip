import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
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

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  stampSiteAccess: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { consumeTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { stampSiteAccess } from "@/lib/auth/accessInviteTokens";
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
  idDocument: "ID999",
  consent: true,
};

const dbUser = {
  id: "user-1",
  name: "Alex Session",
  email: "alex@example.com",
};

function mockSessionAndUser() {
  (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: dbUser.id, email: dbUser.email },
  });
  (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
    dbUser,
  );
}

describe("POST /api/travelers/submit", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("../route");
    POST = mod.POST;
  });

  it("returns 401 when there is no session, and modifies no row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    expect(consumeTravelerInvite).not.toHaveBeenCalled();
  });

  it("returns 400 when consent is not true", async () => {
    mockSessionAndUser();
    const res = await POST(makeRequest({ ...validBody, consent: false }));
    expect(res.status).toBe(400);
    expect(consumeTravelerInvite).not.toHaveBeenCalled();
  });

  it("ignores any client-supplied fullName/email and derives identity from the session's DB user", async () => {
    mockSessionAndUser();
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

    await POST(
      makeRequest({
        ...validBody,
        fullName: "Spoofed Name",
        email: "spoofed@example.com",
      }),
    );

    expect(consumeTravelerInvite).toHaveBeenCalledWith("tok", {
      fullName: dbUser.name,
      idDocument: "ID999",
      email: dbUser.email,
      userId: dbUser.id,
    });
  });

  it("returns 400 with reason when consumeTravelerInvite is not ok", async () => {
    mockSessionAndUser();
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "expired" });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reason).toBe("expired");
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("creates one TRAVELER_SUBMITTED notification for the buyer, sets userId, and returns ok:true on success", async () => {
    mockSessionAndUser();
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

    const consumeArgs = (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mock.calls[0][1];
    expect(consumeArgs.userId).toBe(dbUser.id);
  });

  it("localizes the notification title to Spanish for an es-locale buyer (not a hardcoded string)", async () => {
    mockSessionAndUser();
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
    mockSessionAndUser();
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
    mockSessionAndUser();
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
    mockSessionAndUser();
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "used" });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(400);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("stamps siteAccessGrantedAt for the claiming user on a successful claim", async () => {
    mockSessionAndUser();
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
    expect(stampSiteAccess).toHaveBeenCalledWith(dbUser.id);
  });

  it("does not fail the response when stampSiteAccess throws", async () => {
    mockSessionAndUser();
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
    (stampSiteAccess as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db hiccup"),
    );

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("does not stamp site access when consumeTravelerInvite is not ok", async () => {
    mockSessionAndUser();
    (
      consumeTravelerInvite as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "expired" });

    await POST(makeRequest(validBody));

    expect(stampSiteAccess).not.toHaveBeenCalled();
  });
});
