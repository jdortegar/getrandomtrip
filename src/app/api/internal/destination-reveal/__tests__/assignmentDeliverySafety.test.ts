import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("./reminderFixture")).db,
}));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
import { sendMail } from "@/lib/helpers/sendMail";
import { runAssignmentReminders } from "../assignmentReminders";
import { queueAssignmentReminders } from "../queueAssignmentReminders";
import {
  db,
  hour,
  initialNow,
  resetFixture,
  revealAt,
  state,
} from "./reminderFixture";

let now: Date;
const run = () => runAssignmentReminders(() => now);
const queue = () => queueAssignmentReminders(() => now, Date.now() + 10_000);
beforeEach(() => {
  vi.resetAllMocks();
  resetFixture();
  now = initialNow;
  vi.stubEnv("ADMIN_EMAIL", "configured@example.com");
  vi.stubEnv("EMAIL_FROM", "Team <team@example.com>");
  vi.mocked(sendMail).mockResolvedValue({ id: "accepted" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("serializes overlapping delivery claims and does not stamp an in-flight email", async () => {
  let release!: () => void;
  vi.mocked(sendMail).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ id: "accepted" });
      }),
  );
  const first = run();
  await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(1));
  expect(state.rows.filter((row) => row.acceptedAt)).toHaveLength(0);
  expect(state.rows.filter((row) => row.leaseToken)).toHaveLength(1);
  const second = await run();
  release();
  const result = await first;
  expect(result.accepted + second.accepted).toBe(3);
  expect(sendMail).toHaveBeenCalledTimes(3);
  expect(state.rows).toHaveLength(3);
  expect(state.notices.size).toBe(1);
});

it("recovers expired claims without stealing a live claim", async () => {
  await queue();
  state.rows[0].leaseToken = "crashed";
  state.rows[0].nextAttemptAt = new Date(+now - 1);
  state.rows[1].leaseToken = "live";
  state.rows[1].nextAttemptAt = new Date(+now + hour);
  expect((await run()).accepted).toBe(2);
  expect(state.rows[0].acceptedAt).toEqual(now);
  expect(state.rows[1].leaseToken).toBe("live");
  expect(state.rows[1].acceptedAt).toBeNull();
});

it.each([false, true])(
  "fences finalization/release when a newer worker owns the lease (failure:%s)",
  async (fail) => {
    vi.mocked(sendMail).mockImplementationOnce(async (mail) => {
      const row = state.rows.find((entry) => entry.recipientEmail === mail.to)!;
      row.leaseToken = "newer-worker";
      row.nextAttemptAt = new Date(+now + hour);
      if (fail) throw new Error("old worker failed");
      return { id: "accepted" };
    });
    expect((await run()).accepted).toBe(2);
    const row = state.rows.find(
      (entry) => entry.leaseToken === "newer-worker",
    )!;
    expect(row.acceptedAt).toBeNull();
    expect(row.nextAttemptAt).toEqual(new Date(+now + hour));
  },
);

it("retries accepted-but-unstamped email with the exact persisted payload and key", async () => {
  const update =
    db.destinationAssignmentDelivery.updateMany.getMockImplementation()!;
  let failOnce = true;
  db.destinationAssignmentDelivery.updateMany.mockImplementation(
    async (args) => {
      if (args.data.acceptedAt && failOnce) {
        failOnce = false;
        throw new Error("DB commit failed");
      }
      return update(args);
    },
  );
  expect(await run()).toMatchObject({ accepted: 2, failed: 1 });
  const original = vi.mocked(sendMail).mock.calls[0][0];
  vi.stubEnv("EMAIL_FROM", "Different <different@example.com>");
  state.admins[0].name = "Changed";
  state.admins[0].locale = "es";
  state.trips[0].user.name = "Changed traveler";
  now = new Date(+now + hour);
  expect((await run()).accepted).toBe(1);
  expect(vi.mocked(sendMail).mock.calls[3][0]).toEqual(original);
  expect(state.rows.every((row) => row.acceptedAt !== null)).toBe(true);
});

it.each(["assignment", "cancellation", "reschedule", "deadline"])(
  "rechecks %s immediately before sending",
  async (change) => {
    const find = db.tripRequest.findFirst.getMockImplementation()!;
    db.tripRequest.findFirst.mockImplementation(async (args) => {
      if (!args.where.startDate) {
        if (change === "assignment") state.trips[0].experienceId = "experience";
        if (change === "cancellation") state.trips[0].status = "CANCELLED";
        if (change === "reschedule")
          state.trips[0].startDate = new Date(+revealAt + 49 * hour);
        if (change === "deadline") now = revealAt;
      }
      return find(args);
    });
    expect((await run()).accepted).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
    expect(state.rows.every((row) => row.acceptedAt === null)).toBe(true);
  },
);

it("expires failed obsolete stages and never initiates mail after reveal", async () => {
  vi.mocked(sendMail).mockRejectedValue(new Error("offline"));
  await run();
  vi.mocked(sendMail).mockResolvedValue({ id: "accepted" });
  now = new Date(+revealAt - 24 * hour);
  expect((await run()).accepted).toBe(3);
  expect(
    vi
      .mocked(sendMail)
      .mock.calls.slice(3)
      .every(([mail]) => mail.subject.includes("24")),
  ).toBe(true);
  now = revealAt;
  expect((await run()).accepted).toBe(0);
  expect(sendMail).toHaveBeenCalledTimes(6);
});

it("uses a new delivery identity when the reveal is rescheduled", async () => {
  await run();
  const originalKeys = vi
    .mocked(sendMail)
    .mock.calls.map(([mail]) => mail.idempotencyKey);
  state.trips[0].startDate = new Date(+state.trips[0].startDate! + hour);
  now = new Date(+now + hour);
  expect((await run()).accepted).toBe(3);
  expect(state.rows).toHaveLength(6);
  expect(
    vi
      .mocked(sendMail)
      .mock.calls.slice(3)
      .every(([mail]) => !originalKeys.includes(mail.idempotencyKey)),
  ).toBe(true);
});

it("stops between sends when the work budget is exhausted, retaining retryable rows", async () => {
  const currentTime = Date.now();
  const timer = vi.spyOn(Date, "now").mockReturnValue(currentTime);
  vi.mocked(sendMail).mockImplementationOnce(async () => {
    timer.mockReturnValue(currentTime + 20_000);
    return { id: "accepted" };
  });
  expect((await run()).accepted).toBe(1);
  expect(state.rows.filter((row) => row.acceptedAt === null)).toHaveLength(2);
  expect((await run()).accepted).toBe(2);
});

it("recovers after an unsuccessful lease release without claiming delivery", async () => {
  await queue();
  const update =
    db.destinationAssignmentDelivery.updateMany.getMockImplementation()!;
  db.destinationAssignmentDelivery.updateMany.mockImplementation(
    async (args) => {
      if (args.data.leaseToken === null)
        throw new Error("database unavailable");
      return update(args);
    },
  );
  vi.mocked(sendMail).mockRejectedValue(new Error("provider unavailable"));
  expect((await run()).failed).toBe(3);
  expect(
    state.rows.every((row) => row.leaseToken && row.acceptedAt === null),
  ).toBe(true);
  db.destinationAssignmentDelivery.updateMany.mockImplementation(update);
  vi.mocked(sendMail).mockResolvedValue({ id: "recovered" });
  now = new Date(+now + 11 * 60_000);
  expect((await run()).accepted).toBe(3);
});

it("preserves a dismissed in-app notice across repeated and concurrent polls", async () => {
  await run();
  expect(state.notices.size).toBe(1);
  state.notices.clear(); // Existing notification DELETE physically removes the row.
  await Promise.all([run(), run()]);
  expect(state.notices.size).toBe(0);
  expect(sendMail).toHaveBeenCalledTimes(3);
});

it.each(["assignment", "cancellation", "reschedule"])(
  "retries an unaccepted recipient when temporary %s is reversed in the same milestone",
  async (change) => {
    vi.mocked(sendMail).mockImplementation(async (mail) => {
      if (mail.to === "admin@example.com")
        throw new Error("temporary provider failure");
      return { id: "accepted" };
    });
    expect((await run()).accepted).toBe(2);
    const naturalExpiry = new Date(+revealAt - 48 * hour);
    const originalDate = state.trips[0].startDate;
    if (change === "assignment") state.trips[0].experienceId = "experience";
    if (change === "cancellation") state.trips[0].status = "CANCELLED";
    if (change === "reschedule")
      state.trips[0].startDate = new Date(+originalDate! + 10 * hour);
    now = new Date(+now + hour);
    await run();
    const pending = state.rows.find(
      (row) => row.recipientEmail === "admin@example.com",
    )!;
    expect(pending.acceptedAt).toBeNull();
    expect(pending.expiresAt).toEqual(naturalExpiry);
    state.trips[0].experienceId = null;
    state.trips[0].status = "CONFIRMED";
    state.trips[0].startDate = originalDate;
    now = new Date(+now + hour);
    vi.mocked(sendMail).mockResolvedValue({ id: "recovered" });
    expect((await run()).accepted).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(4);
    expect(vi.mocked(sendMail).mock.calls[3][0].to).toBe("admin@example.com");
  },
);

it("rolls back the notice marker if materializing the delivery transaction fails", async () => {
  db.destinationAssignmentDelivery.createMany.mockRejectedValueOnce(
    new Error("transaction failed"),
  );
  await expect(run()).rejects.toThrow("transaction failed");
  expect(state.noticeMarkers.size).toBe(0);
  expect(state.notices.size).toBe(0);
  expect(sendMail).not.toHaveBeenCalled();
  expect((await run()).accepted).toBe(3);
  expect(state.noticeMarkers.size).toBe(1);
  expect(state.notices.size).toBe(1);
});

it("notifies a newly added admin without recreating another admin's dismissed notice", async () => {
  await run();
  state.notices.clear();
  state.admins.push({
    id: "new-admin",
    email: "new@example.com",
    name: "New",
    locale: "en",
  });
  expect((await run()).accepted).toBe(1);
  expect(state.notices.size).toBe(1);
  expect([...state.notices.values()][0].userId).toBe("new-admin");
  expect(state.noticeMarkers.size).toBe(2);
});
