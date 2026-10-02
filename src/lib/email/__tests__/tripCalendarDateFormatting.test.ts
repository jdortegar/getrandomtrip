import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    payment: { findUnique: vi.fn() },
  },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));
vi.mock("@/lib/email/getAdminRecipients", () => ({
  getAdminEmails: vi.fn().mockResolvedValue(["admin@example.com"]),
}));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

import { renderToStaticMarkup } from "react-dom/server";
import { sendAdminNewBooking, sendBookingConfirmed } from "../index";

const originalTz = process.env.TZ;
const startDate = new Date("2026-10-03T00:00:00.000Z");

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.TZ = "America/Los_Angeles";
  sendMailMock.mockResolvedValue({ id: "mail" });
  db.user.findUnique.mockResolvedValue({ email: "ana@example.com", name: "Ana", locale: "en" });
  db.payment.findUnique.mockResolvedValue({ stripePaymentIntentId: null, amount: 100, currency: "USD" });
  db.tripRequest.findUnique.mockResolvedValue({
    type: "couple",
    level: "essenza",
    nights: 2,
    startDate,
    originCity: "Buenos Aires",
    originCountry: "Argentina",
  });
});

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe("trip emails format calendar dates in UTC", () => {
  it("booking confirmation shows October 3, not October 2, when the server is west of UTC", async () => {
    sendBookingConfirmed("trip-1", "user-1");
    await flush();
    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("October 3, 2026");
    expect(html).not.toContain("October 2");
  });

  it("admin new-booking notice shows 3 de octubre de 2026", async () => {
    sendAdminNewBooking("trip-1", "user-1");
    await flush();
    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("3 de octubre de 2026");
  });
});
