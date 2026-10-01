import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: { tripTraveler: { findUnique: vi.fn() } },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));

import { deliverTravelerInviteEmail, sendTravelerInviteEmail } from "../index";

const traveler = {
  email: "jane@example.com",
  tripRequest: {
    type: "XSED",
    startDate: new Date("2026-10-03T00:00:00.000Z"),
    endDate: new Date("2026-10-04T00:00:00.000Z"),
    // The destination must never reach the email.
    destination: { city: "Lisbon" },
    user: { name: "Ana Ortega", locale: "es" },
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  db.tripTraveler.findUnique.mockResolvedValue(traveler);
  sendMailMock.mockResolvedValue({ id: "mail-1" });
});

describe("deliverTravelerInviteEmail", () => {
  it("sends the buyer-named subject and a dated body without the destination", async () => {
    await deliverTravelerInviteEmail("trav-1", "tok");

    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe("jane@example.com");
    expect(mail.subject).toBe("Ana te sumó a su randomtrip");
    const html = renderToStaticMarkup(mail.content.react);
    expect(html).toContain("3–4 de octubre de 2026");
    expect(html).toContain("XSED");
    expect(html).toContain("/es/invite/tok");
    expect(html).not.toContain("Lisbon");
  });

  it("uses the buyer's locale for the subject", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({
      ...traveler,
      tripRequest: { ...traveler.tripRequest, user: { name: "Ana Ortega", locale: "en" } },
    });

    await deliverTravelerInviteEmail("trav-1", "tok");

    expect(sendMailMock.mock.calls[0][0].subject).toBe("Ana added you to their randomtrip");
  });

  it("propagates provider failures (callers that need a result, e.g. the backfill)", async () => {
    sendMailMock.mockRejectedValue(new Error("provider down"));
    await expect(deliverTravelerInviteEmail("trav-1", "tok")).rejects.toThrow("provider down");
  });

  it("sends nothing for a row without an email", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({ ...traveler, email: null });
    await deliverTravelerInviteEmail("trav-1", "tok");
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe("sendTravelerInviteEmail (fire-and-forget)", () => {
  it("swallows provider failures", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMailMock.mockRejectedValue(new Error("provider down"));

    expect(() => sendTravelerInviteEmail("trav-1", "tok")).not.toThrow();
    await vi.waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });
});
