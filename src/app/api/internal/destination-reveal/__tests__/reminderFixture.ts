import { vi } from "vitest";
import type { DestinationAssignmentDelivery } from "@prisma/client";

export const db = {
  $transaction: vi.fn(),
  tripRequest: { findMany: vi.fn(), findFirst: vi.fn() },
  user: { findMany: vi.fn() },
  destinationAssignmentDelivery: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  destinationAssignmentNotice: { createMany: vi.fn() },
  notification: { createMany: vi.fn() },
};
export const hour = 3_600_000;
export const revealAt = new Date("2026-10-08T12:00:00Z");
export const initialNow = new Date(+revealAt - 72 * hour);
export function makeTrip(id = "trip") {
  return {
    id,
    status: "CONFIRMED",
    experienceId: null as string | null,
    // Sat 2026-10-10 from Argentina: reveals Thu 2026-10-08 09:00 ART = revealAt.
    startDate: new Date("2026-10-10T00:00:00Z") as Date | null,
    departureTimeZone: "America/Argentina/Buenos_Aires" as string | null,
    user: { name: "Ana" },
  };
}
export const state = {
  trips: [makeTrip()],
  rows: [] as DestinationAssignmentDelivery[],
  notices: new Map<string, { userId: string; title: string; body: string }>(),
  noticeMarkers: new Set<string>(),
  admins: [
    { id: "admin", email: "admin@example.com", name: "Alex", locale: "en" },
  ],
};

export function resetFixture() {
  state.trips = [makeTrip()];
  state.rows = [];
  state.notices.clear();
  state.noticeMarkers.clear();
  state.admins = [
    { id: "admin", email: "admin@example.com", name: "Alex", locale: "en" },
  ];
  const findTrips = (where: Record<string, unknown>) =>
    state.trips.filter((trip) => {
      if (where.id && trip.id !== where.id) return false;
      if (where.status && trip.status !== where.status) return false;
      if ("experienceId" in where && trip.experienceId !== where.experienceId)
        return false;
      const dates = where.startDate as
        | { gt?: Date; lte?: Date; equals?: Date }
        | undefined;
      if (
        dates &&
        (!trip.startDate ||
          (dates.gt && trip.startDate <= dates.gt) ||
          (dates.lte && trip.startDate > dates.lte) ||
          (dates.equals && +trip.startDate !== +dates.equals))
      )
        return false;
      return true;
    });
  db.tripRequest.findMany.mockImplementation(
    async ({ where, take, cursor, orderBy }) => {
      const trips = findTrips(where).sort(
        (a, b) =>
          (Array.isArray(orderBy) && orderBy[0].startDate
            ? +a.startDate! - +b.startDate!
            : 0) || a.id.localeCompare(b.id),
      );
      const start = cursor
        ? trips.findIndex((trip) => trip.id === cursor.id) + 1
        : 0;
      return trips.slice(start, start + take);
    },
  );
  db.tripRequest.findFirst.mockImplementation(
    async ({ where }) => findTrips(where)[0] ?? null,
  );
  db.user.findMany.mockImplementation(async () => state.admins);
  let tail = Promise.resolve();
  db.$transaction.mockImplementation((work) => {
    const next = tail.then(async () => {
      const rows = state.rows.map((row) => ({ ...row }));
      const notices = new Map(state.notices);
      const markers = new Set(state.noticeMarkers);
      try {
        return await work(db);
      } catch (error) {
        state.rows = rows;
        state.notices = notices;
        state.noticeMarkers = markers;
        throw error;
      }
    });
    tail = next.catch(() => {});
    return next;
  });
  db.destinationAssignmentNotice.createMany.mockImplementation(
    async ({ data }) => {
      let count = 0;
      for (const marker of data) {
        if (state.noticeMarkers.has(marker.id)) continue;
        state.noticeMarkers.add(marker.id);
        count++;
      }
      return { count };
    },
  );
  db.destinationAssignmentDelivery.createMany.mockImplementation(
    async ({ data }) => {
      let count = 0;
      for (const row of data) {
        if (state.rows.some((existing) => existing.id === row.id)) continue;
        state.rows.push({
          acceptedAt: null,
          providerMessageId: null,
          leaseToken: null,
          nextAttemptAt: initialNow,
          createdAt: initialNow,
          ...row,
        });
        count++;
      }
      return { count };
    },
  );
  db.notification.createMany.mockImplementation(async ({ data }) => {
    let count = 0;
    for (const notice of data) {
      if (state.notices.has(notice.id)) continue;
      state.notices.set(notice.id, notice);
      count++;
    }
    return { count };
  });
  db.destinationAssignmentDelivery.findMany.mockImplementation(
    async ({ where, take }) =>
      state.rows
        .filter((row) => {
          if (where.tripRequestId)
            return (
              row.tripRequestId === where.tripRequestId &&
              +row.revealAt === +where.revealAt &&
              row.milestoneHours === where.milestoneHours
            );
          if (
            row.acceptedAt !== null ||
            row.nextAttemptAt > where.nextAttemptAt.lte ||
            row.expiresAt <= where.expiresAt.gt
          )
            return false;
          return true;
        })
        .sort((a, b) => +a.nextAttemptAt - +b.nextAttemptAt)
        .slice(0, take)
        .map((row) => ({ ...row })),
  );
  db.destinationAssignmentDelivery.updateMany.mockImplementation(
    async ({ where, data }) => {
      const row = state.rows.find((candidate) => candidate.id === where.id);
      if (!row || row.acceptedAt !== null) return { count: 0 };
      if (where.leaseToken && row.leaseToken !== where.leaseToken)
        return { count: 0 };
      if (
        where.nextAttemptAt?.lte &&
        row.nextAttemptAt > where.nextAttemptAt.lte
      )
        return { count: 0 };
      if (where.expiresAt?.gt && row.expiresAt <= where.expiresAt.gt)
        return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    },
  );
}
