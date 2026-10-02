import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findMany: vi.fn(), updateMany: vi.fn() },
    experience: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/trips/revealNotifications", () => ({ runRevealNotifications: vi.fn() }));
import { prisma } from "@/lib/prisma";
import { runRevealNotifications } from "@/lib/trips/revealNotifications";
import { runPass2 } from "../passes";
// Sat 2026-10-10 from Argentina reveals Thu 2026-10-08 09:00 ART = 12:00Z.
const now = new Date("2026-10-08T12:00:00Z");
const BA = "America/Argentina/Buenos_Aires";
const noNotifications = { notified: 0, failed: 0 };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    {
      id: "trip",
      userId: "buyer",
      experienceId: "experience",
      actualDestination: null,
      startDate: new Date("2026-10-10T00:00:00Z"),
      departureTimeZone: BA,
    },
  ] as never);
  vi.mocked(runRevealNotifications).mockResolvedValue(noNotifications);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue({
    destinationCity: "Mendoza",
    destinationCountry: "Argentina",
  } as never);
  vi.mocked(prisma.tripRequest.updateMany).mockResolvedValue({ count: 1 });
});
it("reveals at 09:00 departure-local two days before departure and requires assignment", async () => {
  expect(await runPass2(now)).toEqual({ revealed: 1, notified: 0, notifyFailed: 0 });
  expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        status: "CONFIRMED",
        // Conservative superset of every zone; the exact reveal instant is filtered in memory.
        startDate: { gt: new Date("2026-10-07T12:00:00Z"), lte: new Date("2026-10-11T12:00:00Z") },
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
});
it("does not reveal one second before the local reveal moment", async () => {
  expect(await runPass2(new Date(+now - 1000))).toMatchObject({ revealed: 0 });
  expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
});
it("does not reveal a trip that has already departed", async () => {
  expect(await runPass2(new Date("2026-10-10T03:00:00Z"))).toMatchObject({ revealed: 0 });
});
it("uses the trip's own zone: the same stored date reveals hours earlier in Madrid", async () => {
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    {
      id: "trip",
      userId: "buyer",
      experienceId: "experience",
      actualDestination: null,
      startDate: new Date("2026-10-10T00:00:00Z"),
      departureTimeZone: "Europe/Madrid", // reveal 2026-10-08T07:00Z
    },
  ] as never);
  expect(await runPass2(new Date("2026-10-08T07:00:00Z"))).toMatchObject({ revealed: 1 });
});
it("awaits reveal notifications after the flip, including retries for earlier failures, and reports their counts", async () => {
  vi.mocked(runRevealNotifications).mockImplementation(async () => {
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledOnce();
    return { notified: 2, failed: 1 };
  });
  expect(await runPass2(now)).toEqual({ revealed: 1, notified: 2, notifyFailed: 1 });
  expect(runRevealNotifications).toHaveBeenCalledExactlyOnceWith(now);
});
it("runs the notification retry even when nothing new was revealed", async () => {
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([]);
  await runPass2(now);
  expect(runRevealNotifications).toHaveBeenCalledOnce();
});
it("keeps the reveal count when the notification pass throws", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(runRevealNotifications).mockRejectedValue(new Error("db down"));
  expect(await runPass2(now)).toEqual({ revealed: 1, notified: 0, notifyFailed: 1 });
});
it("does not count a lost status-transition race", async () => {
  vi.mocked(prisma.tripRequest.updateMany).mockResolvedValue({ count: 0 });
  expect(await runPass2(now)).toMatchObject({ revealed: 0 });
});
it("preserves a stored destination and skips missing destinations", async () => {
  const base = { userId: "buyer", experienceId: "experience", startDate: new Date("2026-10-10T00:00:00Z"), departureTimeZone: BA };
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    { ...base, id: "trip", actualDestination: "Stored" },
  ] as never);
  await runPass2(now);
  expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ actualDestination: "Stored" }),
    }),
  );
  vi.mocked(prisma.tripRequest.updateMany).mockClear();
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
    { ...base, id: "missing", actualDestination: null },
  ] as never);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue(null);
  expect(await runPass2(now)).toMatchObject({ revealed: 0 });
  expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
});
