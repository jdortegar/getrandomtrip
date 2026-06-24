import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    experience: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendDestinationAssignmentReminder: vi.fn(),
  sendDestinationRevealed: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendDestinationAssignmentReminder,
  sendDestinationRevealed,
} from "@/lib/email";

// Import the route module after mocks are in place
type RouteModule = typeof import("../route");

const VALID_SECRET = "test-cron-secret-123";

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  return new Request("http://localhost/api/internal/destination-reveal", {
    method: "POST",
    headers,
  });
}

// ── Helper: reset all mocks ────────────────────────────────────────────────────
beforeEach(() => {
  vi.resetAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
  // Default: no trips, no admins
  (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
  (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

// ── Auth guard tests ───────────────────────────────────────────────────────────
describe("POST /api/internal/destination-reveal — auth guard", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 401 when secret is wrong", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 when secret is correct", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
  });
});

// ── Pass 1 tests ───────────────────────────────────────────────────────────────
describe("runPass1", () => {
  it("stamps destinationAssignmentNotifiedAt and calls sendDestinationAssignmentReminder", async () => {
    const trip = {
      id: "trip-1",
      startDate: new Date(Date.now() + 60 * 60 * 1000),
      experienceId: null,
      user: { name: "Carlos" },
    };
    const admin = { id: "admin-1" };

    // First findMany = Pass1 candidates, second = re-escalation candidates, third = admins
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([trip])  // first-time candidates
      .mockResolvedValueOnce([]);     // re-escalation candidates
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([admin]);
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    // We need updateMany for Pass1 stamp — but Pass1 uses update not updateMany
    // Actually route uses prisma.tripRequest.update for stamp in Pass1
    // Let's mock that too
    const { prisma: prismaMock } = await import("@/lib/prisma");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.tripRequest as any).update = vi.fn().mockResolvedValue(trip);

    const mod = (await import("../route")) as RouteModule;
    const now = new Date();
    const result = await mod.runPass1(now);

    expect(result.reminded).toBe(1);
    expect(result.escalated).toBe(0);
    expect(sendDestinationAssignmentReminder).toHaveBeenCalledWith("trip-1");
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "admin-1",
          audience: "ADMIN",
          type: "BOOKING_CONFIRMED",
        }),
      }),
    );
  });

  it("does NOT notify already-stamped trips (idempotency)", async () => {
    // Pass1 queries only trips with destinationAssignmentNotifiedAt = null
    // So if it's already stamped, it won't appear in the candidates query
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])  // no first-time candidates
      .mockResolvedValueOnce([]); // no re-escalation candidates

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.reminded).toBe(0);
    expect(sendDestinationAssignmentReminder).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("re-escalates already-notified trips inside T-48h with no experience", async () => {
    const escalationTrip = {
      id: "trip-escalate",
      startDate: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
      experienceId: null,
      user: { name: "Ana" },
    };
    const admin = { id: "admin-1" };

    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])               // no first-time candidates
      .mockResolvedValueOnce([escalationTrip]); // re-escalation candidate
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([admin]);

    const { prisma: prismaMock } = await import("@/lib/prisma");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.tripRequest as any).update = vi.fn().mockResolvedValue(escalationTrip);

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.escalated).toBe(1);
    expect(sendDestinationAssignmentReminder).toHaveBeenCalledWith("trip-escalate");
  });
});

// ── Pass 2 tests ───────────────────────────────────────────────────────────────
describe("runPass2", () => {
  it("reveals trip and calls sendDestinationRevealed when experience is assigned", async () => {
    const trip = {
      id: "trip-2",
      userId: "user-2",
      experienceId: "exp-1",
      actualDestination: null,
    };

    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([trip]);
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      destinationCity: "Buenos Aires",
      destinationCountry: "Argentina",
    });
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass2(new Date());

    expect(result.revealed).toBe(1);
    expect(sendDestinationRevealed).toHaveBeenCalledWith("trip-2", "user-2");
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "trip-2", status: "CONFIRMED" }),
        data: expect.objectContaining({ status: "REVEALED" }),
      }),
    );
  });

  it("skips trips without experienceId", async () => {
    // Pass 2 query filters experienceId: { not: null } at the DB level.
    // So no trips with experienceId=null should arrive here.
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass2(new Date());

    expect(result.revealed).toBe(0);
    expect(sendDestinationRevealed).not.toHaveBeenCalled();
  });

  it("skips already-REVEALED trips (idempotency via updateMany count=0)", async () => {
    const trip = {
      id: "trip-already-revealed",
      userId: "user-3",
      experienceId: "exp-2",
      actualDestination: "Cartagena, Colombia",
    };

    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([trip]);
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      destinationCity: "Cartagena",
      destinationCountry: "Colombia",
    });
    // Guarded update returns count=0 — trip was already REVEALED
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass2(new Date());

    expect(result.revealed).toBe(0);
    expect(sendDestinationRevealed).not.toHaveBeenCalled();
  });

  it("picks up late experience assignment (trip still CONFIRMED, just now has experience)", async () => {
    // A trip past T-48h threshold that finally got an experience assigned.
    // The query condition still matches because the trip is CONFIRMED + has experienceId.
    // Pass 2 should reveal it.
    const trip = {
      id: "trip-late",
      userId: "user-4",
      experienceId: "exp-late",
      actualDestination: null,
    };

    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([trip]);
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      destinationCity: "Medellín",
      destinationCountry: "Colombia",
    });
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass2(new Date());

    expect(result.revealed).toBe(1);
    expect(sendDestinationRevealed).toHaveBeenCalledWith("trip-late", "user-4");
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actualDestination: "Medellín, Colombia",
        }),
      }),
    );
  });

  it("accumulates errors per row without aborting the loop", async () => {
    const trips = [
      { id: "trip-err", userId: "user-5", experienceId: "exp-err", actualDestination: null },
      { id: "trip-ok", userId: "user-6", experienceId: "exp-ok", actualDestination: "Lima, Perú" },
    ];

    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(trips);
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("DB error"))  // first trip blows up
      .mockResolvedValueOnce({ destinationCity: "Lima", destinationCountry: "Perú" });
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass2(new Date());

    // Second trip should still be processed
    expect(result.revealed).toBe(1);
    expect(sendDestinationRevealed).toHaveBeenCalledTimes(1);
    expect(sendDestinationRevealed).toHaveBeenCalledWith("trip-ok", "user-6");
  });
});

// ── Full handler integration ───────────────────────────────────────────────────
describe("POST /api/internal/destination-reveal — response contract", () => {
  it("returns { pass1, pass2, errors } on success", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      pass1: { reminded: expect.any(Number), escalated: expect.any(Number) },
      pass2: { revealed: expect.any(Number) },
      errors: expect.any(Array),
    });
  });
});
