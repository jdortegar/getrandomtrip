import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: { tripTraveler: { findUnique: vi.fn() }, paymentShare: { findUnique: vi.fn() } },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));
const maxTopUp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments/invitee-top-up.server", () => ({ loadInviteeMaxTopUp: maxTopUp }));

import { deliverTopUpDueEmail, deliverTravelerInviteEmail, sendTravelerInviteEmail } from "../index";

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

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.resetAllMocks();
  db.tripTraveler.findUnique.mockResolvedValue(traveler);
  sendMailMock.mockResolvedValue({ id: "mail-1" });
});

describe("deliverTravelerInviteEmail", () => {
  it("states the companion's share and deadline for an individually paid trip", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({
      ...traveler,
      paymentShares: [{ amount: 1023.33, currency: "USD" }],
      tripRequest: {
        ...traveler.tripRequest,
        paymentMode: "INDIVIDUAL",
        paymentDeadline: new Date("2026-10-30T12:00:00.000Z"),
        departureTimeZone: "America/Argentina/Buenos_Aires",
      },
    });

    maxTopUp.mockResolvedValue(11.67);
    await deliverTravelerInviteEmail("trav-1", "tok");

    expect(db.tripTraveler.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ paymentShares: { where: { kind: "SHARE" } } }),
    }));
    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("USD 1023.33");
    expect(html).toContain("Paga tu parte antes del 30 de octubre de 2026 a las 09:00. Si no pagas a tiempo");
    expect(html).toContain("así que podrías pagar hasta USD 11.67 más.");
  });

  it("never mentions a share on a trip paid in total", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({
      ...traveler,
      paymentShares: [],
      tripRequest: { ...traveler.tripRequest, paymentMode: "TOTAL", paymentDeadline: null },
    });
    await deliverTravelerInviteEmail("trav-1", "tok");
    expect(renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react)).not.toContain("Tu parte");
  });

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

  it("builds the link from the deploy origin outside production", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
    vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", "https://develop--getrandomtrip-1.netlify.app");

    await deliverTravelerInviteEmail("trav-1", "tok");

    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("https://develop--getrandomtrip-1.netlify.app/es/invite/tok");
    expect(html).not.toContain("https://getrandomtrip.com/es/invite/");
  });

  it("keeps the production link in production", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");

    await deliverTravelerInviteEmail("trav-1", "tok");

    const html = renderToStaticMarkup(sendMailMock.mock.calls[0][0].content.react);
    expect(html).toContain("https://getrandomtrip.com/es/invite/tok");
  });

  it("uses a neutral subject when the buyer has no name", async () => {
    db.tripTraveler.findUnique.mockResolvedValue({
      ...traveler,
      tripRequest: { ...traveler.tripRequest, user: { name: "", locale: "es" } },
    });

    await deliverTravelerInviteEmail("trav-1", "tok");

    expect(sendMailMock.mock.calls[0][0].subject).toBe("Te sumaron a un randomtrip");
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

describe("deliverTopUpDueEmail", () => {
  it("emails the payer their top-up with the trip's pay-by time", async () => {
    db.paymentShare.findUnique.mockResolvedValue({
      kind: "TOP_UP",
      amount: 17.5,
      currency: "USD",
      userId: "organizer",
      user: { email: "lucia@example.com", locale: "en" },
      payment: {
        tripRequest: {
          userId: "organizer",
          pax: 2,
          topUpDeadline: new Date("2026-11-01T12:00:00.000Z"),
          departureTimeZone: "America/Argentina/Buenos_Aires",
        },
      },
    });
    await deliverTopUpDueEmail("topup-1");
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe("lucia@example.com");
    expect(mail.subject).toBe("Your group changed: USD 17.50 left to pay");
    const html = renderToStaticMarkup(mail.content.react);
    expect(html).toContain("before November 1, 2026 at 09:00");
    expect(html).toContain("/en/dashboard");
    expect(html).toContain("you cover it.");
  });

  it("sends nothing for a share that is not a top-up", async () => {
    db.paymentShare.findUnique.mockResolvedValue({ kind: "SHARE", user: { email: "x@example.com" } });
    await deliverTopUpDueEmail("share-1");
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
