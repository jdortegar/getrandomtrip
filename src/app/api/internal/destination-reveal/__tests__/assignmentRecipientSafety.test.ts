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
  vi.mocked(sendMail).mockResolvedValue({ id: "accepted" });
});
afterEach(() => vi.unstubAllEnvs());

it.each(["role revoked", "account deleted", "email changed"])(
  "does not send a persisted snapshot after its admin's %s",
  async (change) => {
    await queue();
    if (change === "email changed") state.admins[0].email = "new@example.com";
    else state.admins = [];
    await run();
    const addresses = vi.mocked(sendMail).mock.calls.map(([mail]) => mail.to);
    expect(addresses).not.toContain("admin@example.com");
    expect(addresses).toContain("hola@getrandomtrip.com");
    expect(addresses).toContain("configured@example.com");
    if (change === "email changed")
      expect(addresses).toContain("new@example.com");
    const old = state.rows.find(
      (row) => row.recipientEmail === "admin@example.com",
    )!;
    expect(old.acceptedAt).toBeNull();
    expect(old.expiresAt > now).toBe(true);
  },
);

it("revalidates configured recipients and retries unchanged payload only after authorization is restored", async () => {
  await queue();
  const original = {
    ...state.rows.find(
      (row) => row.recipientEmail === "configured@example.com",
    )!,
  };
  vi.stubEnv("ADMIN_EMAIL", "");
  expect((await run()).accepted).toBe(2);
  expect(vi.mocked(sendMail).mock.calls.map(([mail]) => mail.to)).not.toContain(
    "configured@example.com",
  );
  vi.stubEnv("ADMIN_EMAIL", " CONFIGURED@EXAMPLE.COM ");
  now = new Date(+now + hour);
  expect((await run()).accepted).toBe(1);
  expect(vi.mocked(sendMail).mock.calls[2][0]).toMatchObject({
    to: original.recipientEmail,
    from: original.fromAddress,
    subject: original.subject,
    content: { html: original.html },
    idempotencyKey: `destination-assignment/${original.id}`,
  });
});

it("fails closed if recipient lookup fails after a claim, keeping sends retryable", async () => {
  const find = db.user.findMany.getMockImplementation()!;
  let failLookups = true;
  db.user.findMany.mockImplementation(async (args) => {
    if (failLookups && state.rows.some((row) => row.leaseToken))
      throw new Error("recipient lookup unavailable");
    return find(args);
  });
  expect(await run()).toMatchObject({ accepted: 0, failed: 3 });
  expect(sendMail).not.toHaveBeenCalled();
  expect(state.rows.every((row) => row.acceptedAt === null)).toBe(true);
  failLookups = false;
  now = new Date(+now + hour);
  expect((await run()).accepted).toBe(3);
});

it("keeps an address authorized when its configured recipient is also still an admin", async () => {
  state.admins[0].email = "configured@example.com";
  await queue();
  vi.stubEnv("ADMIN_EMAIL", "");
  expect((await run()).accepted).toBe(2);
  expect(
    vi
      .mocked(sendMail)
      .mock.calls.map(([mail]) => mail.to)
      .sort(),
  ).toEqual(["configured@example.com", "hola@getrandomtrip.com"]);
});

it("retries on the next hourly tick despite one-second scheduler jitter near reveal", async () => {
  now = new Date(+revealAt - 24 * hour);
  vi.mocked(sendMail).mockImplementation(async (mail) => {
    if (mail.to === "admin@example.com")
      throw new Error("provider unavailable");
    return { id: "accepted" };
  });
  expect((await run()).accepted).toBe(2);
  state.admins = []; // Revoked at 10:00:02, with reveal due at 12:00.
  now = new Date(+revealAt - 2 * hour + 2_000);
  expect((await run()).accepted).toBe(0);
  state.admins = [
    { id: "admin", email: "admin@example.com", name: "Alex", locale: "en" },
  ];
  vi.mocked(sendMail).mockResolvedValue({ id: "recovered" });
  now = new Date(+revealAt - hour + 1_000); // Next tick is 11:00:01.
  expect((await run()).accepted).toBe(1);
  expect(sendMail).toHaveBeenCalledTimes(4);
});
