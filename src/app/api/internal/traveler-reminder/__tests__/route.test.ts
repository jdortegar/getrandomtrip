import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripTraveler: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    tripRequest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  issueTravelerInvite: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  deliverTravelerReminderEmail: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { deliverTravelerReminderEmail } from "@/lib/email";

type RouteModule = typeof import("../route");
type PassesModule = typeof import("../passes");

const VALID_SECRET = "test-cron-secret-123";

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  return new Request("http://localhost/api/internal/traveler-reminder", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([]);
  (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
    count: 0,
  });
});

// ── Auth guard ───────────────────────────────────────────────────────────────
describe("POST /api/internal/traveler-reminder — auth guard", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 401 when the secret is wrong", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 when the secret is correct", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
  });
});

// ── Pass 1 ─────────────────────────────────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NOW = new Date("2026-09-30T12:00:00.000Z");

function candidate(overrides: {
  id?: string;
  email?: string | null;
  invitedAt?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  departureTimeZone?: string | null;
} = {}) {
  const {
    id = "trav-1",
    email = "jane@example.com",
    invitedAt = new Date(NOW.getTime() - 4 * DAY_MS),
    startDate = new Date(NOW.getTime() + 20 * DAY_MS),
    endDate = new Date(NOW.getTime() + 24 * DAY_MS),
    departureTimeZone = "UTC",
  } = overrides;
  return { id, email, invitedAt, tripRequest: { startDate, endDate, departureTimeZone } };
}

function mockCandidates(...rows: ReturnType<typeof candidate>[]) {
  (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(rows);
}

describe("runPass1", () => {
  it("sends one reminder per due invited-but-not-linked row, re-issuing the token and stamping reminderSentAt after delivery", async () => {
    mockCandidates(candidate());
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("fresh-plaintext-token");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1");
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("trav-1", "fresh-plaintext-token");
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith({
      where: { id: "trav-1" },
      data: { reminderSentAt: NOW },
    });
  });

  it("targets unlinked, invited, never-reminded ADULT rows with an email on paid trips, regardless of status or the details cutoff", async () => {
    const mod = (await import("../passes")) as PassesModule;
    await mod.runPass1(NOW);

    const { where } = (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(where).toMatchObject({
      kind: "ADULT",
      invitedAt: { not: null },
      userId: null,
      reminderSentAt: null,
      email: { not: null },
      tripRequest: {
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        payment: { is: { status: "APPROVED" } },
      },
    });
    expect(where).not.toHaveProperty("status");
    expect(where.tripRequest).not.toHaveProperty("OR");
    expect(where.tripRequest).not.toHaveProperty("startDate");
  });

  it("is due at invitedAt + 3 days when that comes first", async () => {
    mockCandidates(
      candidate({ id: "due", invitedAt: new Date(NOW.getTime() - 3 * DAY_MS) }),
      candidate({ id: "early", invitedAt: new Date(NOW.getTime() - 3 * DAY_MS + 1000) }),
    );
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("t");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("due", "t");
  });

  it("is due 24h before local-midnight departure in the trip's zone, not UTC midnight", async () => {
    const now = new Date("2026-09-30T05:00:00.000Z");
    const invitedAt = new Date(now.getTime() - HOUR_MS);
    const endDate = new Date("2026-10-03T00:00:00Z");
    const start = new Date("2026-10-01T00:00:00Z");
    mockCandidates(
      // Oct 1 00:00 Tokyo (UTC+9) = 09-30T15:00Z -> 24h mark 09-29T15:00Z: due.
      candidate({ id: "tokyo", invitedAt, startDate: start, endDate, departureTimeZone: "Asia/Tokyo" }),
      // Oct 1 00:00 Los Angeles (UTC-7) = 10-01T07:00Z -> mark 09-30T07:00Z: not yet (UTC midnight would say due).
      candidate({ id: "la", invitedAt, startDate: start, endDate, departureTimeZone: "America/Los_Angeles" }),
    );
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("t");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(now);

    expect(result.reminded).toBe(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("tokyo", "t");
    expect(deliverTravelerReminderEmail).not.toHaveBeenCalledWith("la", "t");
  });

  it("still reminds after the details cutoff while the trip has not ended", async () => {
    mockCandidates(
      candidate({
        invitedAt: new Date(NOW.getTime() - HOUR_MS),
        startDate: new Date(NOW.getTime() + 2 * HOUR_MS),
        endDate: new Date(NOW.getTime() + DAY_MS),
      }),
    );
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("t");

    const mod = (await import("../passes")) as PassesModule;
    expect((await mod.runPass1(NOW)).reminded).toBe(1);
  });

  it("skips rows whose trip has ended (UTC end day inclusive)", async () => {
    mockCandidates(
      candidate({
        id: "ended",
        invitedAt: new Date(NOW.getTime() - 10 * DAY_MS),
        startDate: new Date("2026-09-27T00:00:00.000Z"),
        endDate: new Date("2026-09-29T00:00:00.000Z"),
      }),
      candidate({
        id: "last-day",
        invitedAt: new Date(NOW.getTime() - 10 * DAY_MS),
        startDate: new Date("2026-09-29T00:00:00.000Z"),
        endDate: new Date("2026-09-30T00:00:00.000Z"),
      }),
    );
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("t");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("last-day", "t");
  });

  it("skips a blank email instead of stamping a reminder nobody received", async () => {
    mockCandidates(candidate({ email: "  " }));

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(0);
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("sends nothing when there are no candidates", async () => {
    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(0);
    expect(deliverTravelerReminderEmail).not.toHaveBeenCalled();
  });

  it("does not send a second reminder once the DB no longer returns the row as a candidate (idempotency via reminderSentAt stamp)", async () => {
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("token-1");
    (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([candidate()])
      .mockResolvedValueOnce([]);

    const mod = (await import("../passes")) as PassesModule;
    const firstRun = await mod.runPass1(NOW);
    const secondRun = await mod.runPass1(NOW);

    expect(firstRun.reminded).toBe(1);
    expect(secondRun.reminded).toBe(0);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledTimes(1);
  });

  it("does not stamp reminderSentAt when delivery fails, and keeps going", async () => {
    mockCandidates(candidate({ id: "trav-err" }), candidate({ id: "trav-ok" }));
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("tok");
    (deliverTravelerReminderEmail as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("provider down"))
      .mockResolvedValueOnce(undefined);

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(prisma.tripTraveler.update).toHaveBeenCalledTimes(1);
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith({
      where: { id: "trav-ok" },
      data: { reminderSentAt: NOW },
    });
  });

  it("accumulates errors per row without aborting the loop", async () => {
    mockCandidates(candidate({ id: "trav-err" }), candidate({ id: "trav-ok" }));
    (issueTravelerInvite as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce("token-ok");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledTimes(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("trav-ok", "token-ok");
  });
});

// ── Pass 2 ─────────────────────────────────────────────────────────────────────
describe("runPass2", () => {
  const lockCandidate = (id: string, type: string, startDate: string, departureTimeZone: string | null) => ({
    id,
    type,
    startDate: new Date(startDate),
    departureTimeZone,
  });

  it("stamps travelersLockedAt only for trips whose exact cutoff has passed and that have not departed", async () => {
    // now = Wed 2026-09-30 03:00Z. XSED Sat Oct 3 BA: cutoff 09-30T03:00Z (reached, stamp).
    // XSED Sat Oct 3 Madrid: cutoff 09-29T22:00Z (reached). XSED Sat Oct 3 Tokyo: departure 10-02T15:00Z, cutoff 09-29T15:00Z (reached).
    // XSED Sat Oct 3 Los Angeles: departure 10-03T07:00Z, cutoff 09-30T07:00Z (NOT reached).
    // Standard Oct 3 BA: cutoff 7d earlier 09-26T03:00Z (reached). Standard Oct 10 BA: cutoff 10-03T03:00Z (not yet).
    // XSED Sep 30 BA: departed at 09-30T03:00Z == now (not stamped).
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      lockCandidate("xsed-ba", "xsed", "2026-10-03T00:00:00Z", "America/Argentina/Buenos_Aires"),
      lockCandidate("xsed-madrid", "xsed", "2026-10-03T00:00:00Z", "Europe/Madrid"),
      lockCandidate("xsed-tokyo", "xsed", "2026-10-03T00:00:00Z", "Asia/Tokyo"),
      lockCandidate("xsed-la", "xsed", "2026-10-03T00:00:00Z", "America/Los_Angeles"),
      lockCandidate("std-ba", "family", "2026-10-03T00:00:00Z", "America/Argentina/Buenos_Aires"),
      lockCandidate("std-later", "family", "2026-10-10T00:00:00Z", "America/Argentina/Buenos_Aires"),
      lockCandidate("departed", "xsed", "2026-09-30T00:00:00Z", "America/Argentina/Buenos_Aires"),
      lockCandidate("legacy-null", "xsed", "2026-10-03T00:00:00Z", null),
    ]);
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });

    const mod = (await import("../passes")) as PassesModule;
    const now = new Date("2026-09-30T03:00:00Z");
    const result = await mod.runPass2(now);

    expect(result.locked).toBe(5);
    const call = (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect([...call.where.id.in].sort()).toEqual(["legacy-null", "std-ba", "xsed-ba", "xsed-madrid", "xsed-tokyo"]);
    expect(call.where.travelersLockedAt).toBeNull();
    expect(call.data).toEqual({ travelersLockedAt: now });
  });

  it("queries a conservatively widened startDate window per product", async () => {
    const mod = (await import("../passes")) as PassesModule;
    const now = new Date("2026-09-30T00:00:00Z");
    await mod.runPass2(now);
    const { where } = (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(where.travelersLockedAt).toBeNull();
    expect(where.OR).toEqual([
      { type: { equals: "xsed", mode: "insensitive" }, startDate: { gt: new Date("2026-09-29T00:00:00Z"), lte: new Date("2026-10-04T00:00:00Z") } },
      { type: { not: "xsed", mode: "insensitive" }, startDate: { gt: new Date("2026-09-29T00:00:00Z"), lte: new Date("2026-10-08T00:00:00Z") } },
    ]);
  });

  it("does not write when no candidate has reached its cutoff", async () => {
    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass2(new Date("2026-09-30T00:00:00Z"));
    expect(result.locked).toBe(0);
    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("is idempotent via the travelersLockedAt: null guard (count 0 when already locked)", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      lockCandidate("xsed-ba", "xsed", "2026-10-03T00:00:00Z", "America/Argentina/Buenos_Aires"),
    ]);
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass2(new Date("2026-09-30T04:00:00Z"));

    expect(result.locked).toBe(0);
  });
});

// ── Full handler integration ────────────────────────────────────────────────────
describe("POST /api/internal/traveler-reminder — response contract", () => {
  it("returns { pass1, pass2, errors } on success", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      pass1: { reminded: expect.any(Number) },
      pass2: { locked: expect.any(Number) },
      errors: expect.any(Array),
    });
  });
});
