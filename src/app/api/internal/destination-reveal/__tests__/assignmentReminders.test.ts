import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("./reminderFixture")).db,
}));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
import { sendMail } from "@/lib/helpers/sendMail";
import { runAssignmentReminders } from "../assignmentReminders";
import {
  db,
  hour,
  initialNow,
  makeTrip,
  resetFixture,
  revealAt,
  state,
} from "./reminderFixture";

let now: Date;
const run = () => runAssignmentReminders(() => now);
beforeEach(() => {
  vi.resetAllMocks();
  resetFixture();
  now = initialNow;
  vi.stubEnv("ADMIN_EMAIL", "configured@example.com");
  vi.stubEnv("EMAIL_FROM", "Team <team@example.com>");
  vi.mocked(sendMail).mockResolvedValue({ id: "accepted" });
});
afterEach(() => vi.unstubAllEnvs());

describe("durable reveal-relative assignment reminders", () => {
  it("delivers each milestone once to admins, configured inbox and hola", async () => {
    for (const hours of [72, 48, 24]) {
      now = new Date(+revealAt - hours * hour);
      expect(await run()).toMatchObject({ accepted: 3, failed: 0 });
      expect((await run()).accepted).toBe(0);
    }
    expect(state.rows).toHaveLength(9);
    expect(state.rows.every((row) => row.acceptedAt !== null)).toBe(true);
    expect(state.notices.size).toBe(3);
    expect(sendMail).toHaveBeenCalledTimes(9);
    expect(
      new Set(vi.mocked(sendMail).mock.calls.map(([mail]) => mail.to)),
    ).toEqual(
      new Set([
        "hola@getrandomtrip.com",
        "configured@example.com",
        "admin@example.com",
      ]),
    );
  });

  it("schedules milestones from the trip's own reveal moment (Madrid reveals at 07:00Z, not 12:00Z)", async () => {
    state.trips[0].departureTimeZone = "Europe/Madrid"; // Thu 2026-10-08 09:00 CEST = 07:00Z
    now = new Date("2026-10-05T07:00:00Z"); // exactly 72h before
    expect(await run()).toMatchObject({ accepted: 3 });
    expect(state.rows.every((row) => +row.revealAt === +new Date("2026-10-08T07:00:00Z"))).toBe(true);
    expect(state.rows.every((row) => row.milestoneHours === 72)).toBe(true);
  });

  it("catches up only the current stage, not 72/48-hour backlogs", async () => {
    now = new Date(+revealAt - 6 * hour);
    expect((await run()).accepted).toBe(3);
    expect(state.rows.map((row) => row.milestoneHours)).toEqual([24, 24, 24]);
  });

  it.each(["DRAFT", "CANCELLED", "REVEALED", "COMPLETED"])(
    "excludes %s trips",
    async (status) => {
      state.trips[0].status = status;
      expect((await run()).accepted).toBe(0);
      expect(sendMail).not.toHaveBeenCalled();
    },
  );
  it("excludes assigned trips, missing dates, and expired/not-yet-due windows", async () => {
    state.trips = [
      Object.assign(makeTrip("assigned"), { experienceId: "experience" }),
      Object.assign(makeTrip("missing"), { startDate: null }),
      // Reveal Fri 2026-10-09 09:00 ART: 96h out, before the 72h window.
      Object.assign(makeTrip("early"), {
        startDate: new Date("2026-10-11T00:00:00Z"),
      }),
      // Reveal Mon 2026-10-05 09:00 ART == now: already revealed.
      Object.assign(makeTrip("expired"), {
        startDate: new Date("2026-10-07T00:00:00Z"),
      }),
    ];
    expect((await run()).accepted).toBe(0);
    expect(state.rows).toHaveLength(0);
    expect(state.notices.size).toBe(0);
  });

  it("retries only a failed recipient and leaves accepted recipients alone", async () => {
    vi.mocked(sendMail).mockImplementation(async (mail) => {
      if (mail.to === "admin@example.com") throw new Error("provider down");
      return { id: "accepted" };
    });
    expect(await run()).toMatchObject({ accepted: 2, failed: 1 });
    expect(state.rows.filter((row) => row.acceptedAt)).toHaveLength(2);
    vi.mocked(sendMail).mockResolvedValue({ id: "recovered" });
    now = new Date(+now + hour);
    expect((await run()).accepted).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(4);
    expect(vi.mocked(sendMail).mock.calls[3][0].to).toBe("admin@example.com");
    expect(state.notices.size).toBe(1);
  });

  it("waits for provider acceptance and rejects missing provider IDs", async () => {
    vi.mocked(sendMail).mockResolvedValue(null as never);
    expect(await run()).toMatchObject({ accepted: 0, failed: 3 });
    expect(state.rows.every((row) => row.acceptedAt === null)).toBe(true);
  });

  it("deduplicates repeated recipient addresses and localizes in-app notices", async () => {
    vi.stubEnv("ADMIN_EMAIL", " HOLA@GetRandomTrip.com ");
    state.admins.push({
      id: "spanish",
      email: " HOLA@GetRandomTrip.com ",
      name: "Equipo",
      locale: "es",
    });
    expect((await run()).accepted).toBe(2);
    expect(state.notices.size).toBe(2);
    const notices = [...state.notices.values()];
    expect(notices.find((n) => n.userId === "admin")?.body).toContain("Ana");
    expect(notices.find((n) => n.userId === "spanish")?.body).toContain(
      "revelación del destino",
    );
    expect(notices.every((n) => n.body.includes("2026-10-08 12:00 UTC"))).toBe(
      true,
    );
  });
});

it("sends to configured and hola inboxes without database admins", async () => {
  state.admins = [];
  expect((await run()).accepted).toBe(2);
  expect(state.notices.size).toBe(0);
  expect(
    vi
      .mocked(sendMail)
      .mock.calls.map(([mail]) => mail.to)
      .sort(),
  ).toEqual(["configured@example.com", "hola@getrandomtrip.com"]);
});

it("materializes urgent reveal deadlines first rather than lexical trip IDs", async () => {
  state.trips = [
    makeTrip("a-later"),
    // Start a day earlier: reveals 24h sooner than the default trip.
    Object.assign(makeTrip("z-urgent"), {
      startDate: new Date("2026-10-09T00:00:00Z"),
    }),
  ];
  await run();
  expect(state.rows[0].tripRequestId).toBe("z-urgent");
});

it("keeps bounded delivery batches fair across repeated invocations", async () => {
  state.trips = Array.from({ length: 11 }, (_, i) => makeTrip(`trip-${i}`));
  expect(await run()).toMatchObject({ queued: 33, accepted: 25 });
  expect((await run()).accepted).toBe(8);
  expect(sendMail).toHaveBeenCalledTimes(33);
  expect(state.rows.every((row) => row.acceptedAt)).toBe(true);
});
