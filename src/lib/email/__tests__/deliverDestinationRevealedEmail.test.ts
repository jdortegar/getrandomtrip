import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
  },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));

import { deliverDestinationRevealedEmail } from "../index";

const originalTz = process.env.TZ;

const trip = {
  actualDestination: "Lisbon, Portugal",
  startDate: new Date("2026-10-03T00:00:00.000Z"),
  endDate: new Date("2026-10-04T00:00:00.000Z"),
};

beforeEach(() => {
  vi.resetAllMocks();
  db.tripRequest.findUnique.mockResolvedValue(trip);
  db.user.findUnique.mockResolvedValue({ email: "ana@example.com", name: "Ana", locale: "es" });
  sendMailMock.mockResolvedValue({ id: "mail-1" });
});

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe("deliverDestinationRevealedEmail", () => {
  it("formats the trip calendar dates in UTC, not the server zone (no previous-day bug west of UTC)", async () => {
    process.env.TZ = "America/Los_Angeles";
    await deliverDestinationRevealedEmail("trip-1", "user-1");

    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("3 de octubre de 2026");
    expect(html).toContain("4 de octubre de 2026");
    expect(html).not.toContain("2 de octubre");
  });

  it("sends in the recipient's own locale, never leaks the destination, and links to the reveal page", async () => {
    db.user.findUnique.mockResolvedValue({ email: "bob@example.com", name: "Bob", locale: "en" });

    await expect(deliverDestinationRevealedEmail("trip-1", "user-2")).resolves.toBe("sent");

    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe("bob@example.com");
    expect(mail.subject).toBe("Your destination is ready");
    const html = renderToStaticMarkup(mail.content.react);
    expect(html).toContain("October 3, 2026");
    expect(html).toContain("/en/dashboard/trips/trip-1/reveal");
    expect(html).not.toContain("Lisbon");
  });

  it("uses a per-recipient idempotency key so a lost stamp cannot double-send", async () => {
    await deliverDestinationRevealedEmail("trip-1", "user-1");
    await deliverDestinationRevealedEmail("trip-1", "user-2");
    expect(sendMailMock.mock.calls[0][0].idempotencyKey).toBe("destination-revealed/trip-1/user-1");
    expect(sendMailMock.mock.calls[1][0].idempotencyKey).toBe("destination-revealed/trip-1/user-2");
  });

  it("rejects when the provider does not confirm acceptance", async () => {
    sendMailMock.mockResolvedValue(null);
    await expect(deliverDestinationRevealedEmail("trip-1", "user-1")).rejects.toThrow(/accept/i);
  });

  it("propagates provider errors so the caller leaves the recipient unstamped", async () => {
    sendMailMock.mockRejectedValue(new Error("resend down"));
    await expect(deliverDestinationRevealedEmail("trip-1", "user-1")).rejects.toThrow("resend down");
  });

  it("skips a recipient without an email address", async () => {
    db.user.findUnique.mockResolvedValue({ email: null, name: "Ghost", locale: "es" });
    await expect(deliverDestinationRevealedEmail("trip-1", "user-1")).resolves.toBe("skipped");
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects while the trip has no revealed destination yet", async () => {
    db.tripRequest.findUnique.mockResolvedValue({ ...trip, actualDestination: null });
    await expect(deliverDestinationRevealedEmail("trip-1", "user-1")).rejects.toThrow(/destination/i);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
