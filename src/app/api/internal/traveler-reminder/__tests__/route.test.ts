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
} = {}) {
  const {
    id = "trav-1",
    email = "jane@example.com",
    invitedAt = new Date(NOW.getTime() - 4 * DAY_MS),
    startDate = new Date(NOW.getTime() + 20 * DAY_MS),
    endDate = new Date(NOW.getTime() + 24 * DAY_MS),
  } = overrides;
  return { id, email, invitedAt, tripRequest: { startDate, endDate } };
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

  it("is due 24h before departure when that comes first", async () => {
    mockCandidates(
      candidate({
        id: "soon",
        invitedAt: new Date(NOW.getTime() - HOUR_MS),
        startDate: new Date(NOW.getTime() + 24 * HOUR_MS),
        endDate: new Date(NOW.getTime() + 2 * DAY_MS),
      }),
      candidate({
        id: "not-yet",
        invitedAt: new Date(NOW.getTime() - HOUR_MS),
        startDate: new Date(NOW.getTime() + 24 * HOUR_MS + 1000),
        endDate: new Date(NOW.getTime() + 2 * DAY_MS),
      }),
    );
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("t");

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass1(NOW);

    expect(result.reminded).toBe(1);
    expect(deliverTravelerReminderEmail).toHaveBeenCalledWith("soon", "t");
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
  it("stamps travelersLockedAt for paid trips at/after the cutoff threshold", async () => {
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 2,
    });

    const mod = (await import("../passes")) as PassesModule;
    const now = new Date();
    const result = await mod.runPass2(now);

    expect(result.locked).toBe(2);
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          travelersLockedAt: null,
        }),
        data: { travelersLockedAt: now },
      }),
    );
  });

  it("is idempotent via the travelersLockedAt: null guard (count 0 when already locked)", async () => {
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    const mod = (await import("../passes")) as PassesModule;
    const result = await mod.runPass2(new Date());

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

it("uses separate XSED 72h and standard 7d cutoff predicates in the cutoff-lock pass", async () => {
  const mod = await import("../passes");
  const now = new Date("2026-09-30T00:00:00Z");
  await mod.runPass2(now);
  expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: [
    { type: { equals: "xsed", mode: "insensitive" }, startDate: { gt: now, lte: new Date("2026-10-03T00:00:00Z") } },
    { type: { not: "xsed", mode: "insensitive" }, startDate: { gt: now, lte: new Date("2026-10-07T00:00:00Z") } },
  ] }) }));
});
