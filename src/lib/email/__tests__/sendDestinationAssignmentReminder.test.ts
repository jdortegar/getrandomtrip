import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
import { sendMail } from "@/lib/helpers/sendMail";
import {
  buildAssignmentReminderEmail,
  getAssignmentReminderNotification,
  sendDestinationAssignmentReminder,
} from "../sendDestinationAssignmentReminder";

const window = {
  milestoneHours: 48 as const,
  revealAt: new Date("2026-10-08T12:00:00Z"),
  expiresAt: new Date("2026-10-07T12:00:00Z"),
};
const input = {
  tripId: "trip",
  clientName: "Ana",
  recipient: { email: "admin@example.com", name: "Alex", locale: "en" },
  window,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("EMAIL_FROM", "Team <team@example.com>");
  vi.mocked(sendMail).mockResolvedValue({ id: "accepted" });
});
afterEach(() => vi.unstubAllEnvs());

it("snapshots the personalized sender, subject, recipient and rendered HTML", async () => {
  const payload = await buildAssignmentReminderEmail(input);
  expect(payload).toMatchObject({
    fromAddress: "Team <team@example.com>",
    recipientEmail: "admin@example.com",
  });
  expect(payload.subject).toContain("48");
  expect(payload.subject).toContain("reveal");
  expect(payload.html).toContain("Alex");
  expect(payload.html).toContain("Ana");
  expect(payload.html).toContain("2026-10-08 12:00 UTC");
  vi.stubEnv("EMAIL_FROM", "Changed <changed@example.com>");
  expect(
    await sendDestinationAssignmentReminder({ ...payload, id: "stable-job" }),
  ).toBe("accepted");
  expect(sendMail).toHaveBeenCalledExactlyOnceWith({
    from: payload.fromAddress,
    to: payload.recipientEmail,
    subject: payload.subject,
    content: { html: payload.html },
    idempotencyKey: "destination-assignment/stable-job",
  });
});

it.each(["es", "unknown", null])(
  "defaults Spanish notification copy and keeps the traveler fallback (%s)",
  (locale) => {
    const copy = getAssignmentReminderNotification({
      tripId: "trip",
      clientName: "",
      locale,
      window,
    });
    expect(copy.title).toContain("48");
    expect(copy.body).toContain("trip");
    expect(copy.body).toContain("revelación del destino");
    expect(copy.body).toContain("2026-10-08 12:00 UTC");
  },
);

it("uses English for an English admin's in-app notice", () => {
  const copy = getAssignmentReminderNotification({
    tripId: "trip",
    clientName: "Ana",
    locale: "en",
    window,
  });
  expect(copy.body).toContain("Ana");
  expect(copy.body).toContain("within 48 hours");
});

it.each([null, {}])(
  "rejects a missing provider acknowledgement (%s)",
  async (result) => {
    vi.mocked(sendMail).mockResolvedValue(result as never);
    const payload = await buildAssignmentReminderEmail(input);
    await expect(
      sendDestinationAssignmentReminder({ ...payload, id: "job" }),
    ).rejects.toThrow("acceptance");
  },
);

it("propagates a provider failure so the caller can retry", async () => {
  vi.mocked(sendMail).mockRejectedValue(new Error("provider down"));
  const payload = await buildAssignmentReminderEmail(input);
  await expect(
    sendDestinationAssignmentReminder({ ...payload, id: "job" }),
  ).rejects.toThrow("provider down");
});
