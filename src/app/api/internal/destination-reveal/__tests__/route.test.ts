import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendDestinationAssignmentReminder: vi.fn(),
  sendDestinationRevealed: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { runPass1 } from "../passes";
import { POST } from "../route";

const now = new Date("2026-08-15T10:00:00Z");

function makeTrip(id: string, name: string | null) {
  return { id, startDate: now, experienceId: null, user: { name } };
}

function createdBodies(): string[] {
  return vi
    .mocked(prisma.notification.create)
    .mock.calls.map(([args]) => (args as { data: { body: string } }).data.body);
}

describe("runPass1 admin notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "admin-1" }] as never);
  });

  it("names the traveler instead of the trip id in the first reminder", async () => {
    vi.mocked(prisma.tripRequest.findMany)
      .mockResolvedValueOnce([makeTrip("trip-1", "Ana Pérez")] as never)
      .mockResolvedValueOnce([] as never);

    await runPass1(now);

    const [body] = createdBodies();
    expect(body).toContain("Ana Pérez");
    expect(body).not.toContain("trip-1");
  });

  it("names the traveler instead of the trip id in the urgent re-escalation", async () => {
    vi.mocked(prisma.tripRequest.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([makeTrip("trip-2", "Luis Gómez")] as never);

    await runPass1(now);

    const [body] = createdBodies();
    expect(body).toContain("Luis Gómez");
    expect(body).not.toContain("trip-2");
  });

  it("falls back to the trip id when the traveler has no name", async () => {
    vi.mocked(prisma.tripRequest.findMany)
      .mockResolvedValueOnce([makeTrip("trip-3", null)] as never)
      .mockResolvedValueOnce([] as never);

    await runPass1(now);

    const [body] = createdBodies();
    expect(body).toContain("trip-3");
  });
});


describe("destination reveal HTTP boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-test");
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each([undefined, "wrong"])("rejects unauthorized requests before running passes: %s", async (secret) => {
    const response = await POST(new Request("http://localhost/api/internal/destination-reveal", { method: "POST", headers: secret ? { authorization: `Bearer ${secret}` } : {} }));
    expect(response.status).toBe(401);
    expect(prisma.tripRequest.findMany).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
  it("runs both passes for an authorized request with the same result contract", async () => {
    const response = await POST(new Request("http://localhost/api/internal/destination-reveal", { method: "POST", headers: { authorization: "Bearer cron-test" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pass1: { reminded: 0, escalated: 0 }, pass2: { revealed: 0 }, errors: [] });
    expect(prisma.tripRequest.findMany).toHaveBeenCalledTimes(3);
  });
});
