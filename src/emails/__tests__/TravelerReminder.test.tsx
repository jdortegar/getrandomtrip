import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import TravelerReminder, { getSubject } from "../TravelerReminder";

const props = {
  inviteUrl: "https://getrandomtrip.com/es/invite/tok123",
  buyerFirstName: "Ana",
  startDate: new Date("2026-10-03T00:00:00.000Z"),
  endDate: new Date("2026-10-04T00:00:00.000Z"),
  tripType: "xsed",
};

const plain = (html: string) => html.replace(/[   ]/g, " ");

describe("TravelerReminder", () => {
  it("renders es 'see my trip' copy with dates and type, never asking to complete details", async () => {
    const html = await render(<TravelerReminder {...props} locale="es" />);

    expect(html).toContain("Ana te sumó a su randomtrip");
    expect(html).toContain("3–4 de octubre de 2026");
    expect(html).toContain("XSED");
    expect(html).toContain("VER MI VIAJE");
    expect(html).toContain("Este enlace vence en 7 días.");
    expect(html).toContain('href="https://getrandomtrip.com/es/invite/tok123"');
    expect(html).not.toContain("COMPLETAR MIS DATOS");
  });

  it("renders en copy and labels XSED as TGIS", async () => {
    const html = plain(await render(<TravelerReminder {...props} locale="en" />));

    expect(html).toContain("Ana added you to their randomtrip");
    expect(html).toContain("October 3 – 4, 2026");
    expect(html).toContain("TGIS");
    expect(html).not.toContain("XSED");
    expect(html).toContain("SEE MY TRIP");
  });

  it("falls back to neutral copy when the buyer name is empty", async () => {
    const es = await render(<TravelerReminder {...props} buyerFirstName="" locale="es" />);
    const en = await render(<TravelerReminder {...props} buyerFirstName="" locale="en" />);

    expect(es).toContain("Te sumaron a un randomtrip");
    expect(en).toContain("You&#x27;ve been added to a randomtrip");
    expect(es).not.toContain(" te sumó a su randomtrip");
  });

  it("never carries a destination", async () => {
    const html = await render(
      <TravelerReminder {...props} locale="en" {...({ destination: "Lisbon" } as object)} />,
    );
    expect(html).not.toContain("Lisbon");
  });

  it("has a localized static subject", () => {
    expect(getSubject("es")).toMatch(/randomtrip/i);
    expect(getSubject("en")).toMatch(/randomtrip/i);
  });
});
