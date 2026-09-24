import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { runPass1 } from "../route";

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
