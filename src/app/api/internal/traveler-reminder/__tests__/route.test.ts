import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripTraveler: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    tripRequest: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  issueTravelerInvite: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendTravelerReminderEmail: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerReminderEmail } from "@/lib/email";

type RouteModule = typeof import("../route");

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
describe("runPass1", () => {
  it("sends one reminder per INVITED row with reminderSentAt null, re-issuing the token and stamping reminderSentAt", async () => {
    (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "trav-1" },
    ]);
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue(
      "fresh-plaintext-token",
    );

    const mod = (await import("../route")) as RouteModule;
    const now = new Date();
    const result = await mod.runPass1(now);

    expect(result.reminded).toBe(1);
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1");
    expect(sendTravelerReminderEmail).toHaveBeenCalledWith(
      "trav-1",
      "fresh-plaintext-token",
    );
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith({
      where: { id: "trav-1" },
      data: { reminderSentAt: now },
    });
  });

  it("queries only INVITED rows with reminderSentAt: null inside the pre-cutoff window", async () => {
    const mod = (await import("../route")) as RouteModule;
    const now = new Date();
    await mod.runPass1(now);

    expect(prisma.tripTraveler.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "INVITED",
          reminderSentAt: null,
        }),
      }),
    );
  });

  it("sends nothing when there are no candidates", async () => {
    (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.reminded).toBe(0);
    expect(sendTravelerReminderEmail).not.toHaveBeenCalled();
  });

  it("does not send a second reminder once the DB no longer returns the row as a candidate (idempotency via reminderSentAt stamp)", async () => {
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("token-1");
    (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: "trav-1" }])
      .mockResolvedValueOnce([]);

    const mod = (await import("../route")) as RouteModule;
    const firstRun = await mod.runPass1(new Date());
    const secondRun = await mod.runPass1(new Date());

    expect(firstRun.reminded).toBe(1);
    expect(secondRun.reminded).toBe(0);
    expect(sendTravelerReminderEmail).toHaveBeenCalledTimes(1);
  });

  it("accumulates errors per row without aborting the loop", async () => {
    (prisma.tripTraveler.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "trav-err" },
      { id: "trav-ok" },
    ]);
    (issueTravelerInvite as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce("token-ok");

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.reminded).toBe(1);
    expect(sendTravelerReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendTravelerReminderEmail).toHaveBeenCalledWith("trav-ok", "token-ok");
  });
});

// ── Pass 2 ─────────────────────────────────────────────────────────────────────
describe("runPass2", () => {
  it("stamps travelersLockedAt for paid trips at/after the cutoff threshold", async () => {
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 2,
    });

    const mod = (await import("../route")) as RouteModule;
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

    const mod = (await import("../route")) as RouteModule;
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
