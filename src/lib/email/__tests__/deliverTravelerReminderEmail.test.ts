import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: { tripTraveler: { findUnique: vi.fn() } },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));

import { deliverTravelerReminderEmail } from "../index";

const traveler = {
  email: "jane@example.com",
  tripRequest: {
    type: "xsed",
    startDate: new Date("2026-10-03T00:00:00.000Z"),
    endDate: new Date("2026-10-04T00:00:00.000Z"),
    destination: { city: "Lisbon" },
    user: { name: "Ana Ortega", locale: "es" },
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  db.tripTraveler.findUnique.mockResolvedValue(traveler);
  sendMailMock.mockResolvedValue({ id: "mail-1" });
});

describe("deliverTravelerReminderEmail", () => {
  it("sends the see-my-trip reminder with dates and type, never the destination", async () => {
    await deliverTravelerReminderEmail("trav-1", "tok");

    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe("jane@example.com");
    const html = renderToStaticMarkup(mail.content.react);
    expect(html).toContain("3–4 de octubre de 2026");
    expect(html).toContain("XSED");
    expect(html).toContain("/es/invite/tok");
    expect(html).not.toContain("Lisbon");
  });

  it("propagates provider failures so the cron does not stamp the reminder", async () => {
    sendMailMock.mockRejectedValue(new Error("provider down"));
    await expect(deliverTravelerReminderEmail("trav-1", "tok")).rejects.toThrow("provider down");
  });

  it("sends nothing for a row without an email", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({ ...traveler, email: null });
    await deliverTravelerReminderEmail("trav-1", "tok");
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
