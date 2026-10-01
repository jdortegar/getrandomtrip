import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => vi.unstubAllEnvs());

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
