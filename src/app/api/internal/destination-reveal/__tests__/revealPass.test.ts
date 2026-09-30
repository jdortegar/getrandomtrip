import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findMany: vi.fn(), updateMany: vi.fn() },
    experience: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({ sendDestinationRevealed: vi.fn() }));
import { prisma } from "@/lib/prisma";
import { sendDestinationRevealed } from "@/lib/email";
import { runPass2 } from "../passes";
const now = new Date("2026-10-08T12:00:00Z");
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    {
      id: "trip",
      userId: "buyer",
      experienceId: "experience",
      actualDestination: null,
    },
  ] as never);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue({
    destinationCity: "Mendoza",
    destinationCountry: "Argentina",
  } as never);
  vi.mocked(prisma.tripRequest.updateMany).mockResolvedValue({ count: 1 });
});
it("keeps automatic reveal at departure minus48h and requires assignment", async () => {
  expect(await runPass2(now)).toEqual({ revealed: 1 });
  expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        status: "CONFIRMED",
        startDate: { gte: now, lte: new Date("2026-10-10T12:00:00Z") },
        experienceId: { not: null },
      },
    }),
  );
  expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith({
    where: { id: "trip", status: "CONFIRMED" },
    data: {
      status: "REVEALED",
      destinationRevealedAt: now,
      actualDestination: "Mendoza, Argentina",
    },
  });
  expect(sendDestinationRevealed).toHaveBeenCalledExactlyOnceWith(
    "trip",
    "buyer",
  );
});
it("does not email or count a lost status-transition race", async () => {
  vi.mocked(prisma.tripRequest.updateMany).mockResolvedValue({ count: 0 });
  expect(await runPass2(now)).toEqual({ revealed: 0 });
  expect(sendDestinationRevealed).not.toHaveBeenCalled();
});
it("preserves a stored destination and skips missing destinations", async () => {
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    {
      id: "trip",
      userId: "buyer",
      experienceId: "experience",
      actualDestination: "Stored",
    },
  ] as never);
  await runPass2(now);
  expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ actualDestination: "Stored" }),
    }),
  );
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    {
      id: "missing",
      userId: "buyer",
      experienceId: "experience",
      actualDestination: null,
    },
  ] as never);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue(null);
  expect(await runPass2(now)).toEqual({ revealed: 0 });
  expect(sendDestinationRevealed).toHaveBeenCalledTimes(1);
});
