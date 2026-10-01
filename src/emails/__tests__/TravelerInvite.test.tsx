import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import TravelerInvite, { getSubject } from "../TravelerInvite";

const props = {
  inviteUrl: "https://getrandomtrip.com/es/invite/tok123",
  buyerFirstName: "Ana",
  startDate: new Date("2026-10-03T00:00:00.000Z"),
  endDate: new Date("2026-10-04T00:00:00.000Z"),
  tripType: "xsed",
};

describe("TravelerInvite subject", () => {
  it("names the buyer in both locales", () => {
    expect(getSubject("es", "Ana")).toBe("Ana te sumó a su randomtrip");
    expect(getSubject("en", "Ana")).toBe("Ana added you to their randomtrip");
  });
});

describe("TravelerInvite with an empty buyer name", () => {
  it("falls back to neutral subjects instead of a leading blank", () => {
    expect(getSubject("es", "")).toBe("Te sumaron a un randomtrip");
    expect(getSubject("en", "")).toBe("You've been added to a randomtrip");
    expect(getSubject("es", "   ")).toBe("Te sumaron a un randomtrip");
  });

  it("renders a neutral body", async () => {
    const html = await render(<TravelerInvite {...props} buyerFirstName="" locale="es" />);
    expect(html).toContain("Te sumaron a un randomtrip.");
    expect(html).not.toContain("  te sumó");
  });
});

describe("TravelerInvite body", () => {
  it("renders es copy with dates, trip type, account hint, CTA and expiry", async () => {
    const html = await render(<TravelerInvite {...props} locale="es" />);

    expect(html).toContain("Ana te sumó a su randomtrip");
    expect(html).toContain("3–4 de octubre de 2026");
    expect(html).toContain("XSED");
    expect(html).toContain("Creá tu cuenta");
    expect(html).toContain("VER MI VIAJE");
    expect(html).toContain("Este enlace vence en 7 días.");
    expect(html).toContain('href="https://getrandomtrip.com/es/invite/tok123"');
  });

  it("renders en copy with dates, trip type, account hint, CTA and expiry", async () => {
    // Intl range separators use thin/non-breaking spaces; compare plainly.
    const html = (
      await render(
        <TravelerInvite {...props} locale="en" tripType="group" inviteUrl="https://getrandomtrip.com/en/invite/tok123" />,
      )
    ).replace(/[\u00a0\u2009\u202f]/g, " ");

    expect(html).toContain("Ana added you to their randomtrip");
    expect(html).toContain("October 3 – 4, 2026");
    expect(html).toContain("Group");
    expect(html).toContain("Create an account");
    expect(html).toContain("SEE MY TRIP");
    expect(html).toContain("This link expires in 7 days.");
  });

  it("labels XSED trips as TGIS in en", async () => {
    const html = await render(<TravelerInvite {...props} locale="en" />);

    expect(html).toContain("TGIS");
    expect(html).not.toContain("XSED");
  });

  it("omits the date and type lines when the trip has neither, without breaking", async () => {
    const html = await render(
      <TravelerInvite {...props} locale="en" startDate={null} endDate={null} tripType={null} />,
    );

    expect(html).toContain("SEE MY TRIP");
    expect(html).not.toContain("October");
  });

  it("never carries a destination field", async () => {
    const html = await render(
      <TravelerInvite {...props} locale="en" {...({ destination: "Lisbon" } as object)} />,
    );
    expect(html).not.toContain("Lisbon");
  });
});
