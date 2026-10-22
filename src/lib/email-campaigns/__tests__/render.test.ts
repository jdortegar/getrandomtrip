// @vitest-environment node
import { describe, expect, it } from "vitest";

import { renderCampaignEmail } from "../render";

const campaign = {
  subject: "Tu escapada",
  preheader: "Solo esta semana",
  title: "Llegó el momento",
  bodyMarkdown: "Hola **viajero**, mirá [esto](https://getrandomtrip.com/es).",
  ctaLabel: "Reservar",
  ctaUrl: "https://getrandomtrip.com/es/xsed",
  locale: "es" as const,
};

describe("renderCampaignEmail", () => {
  it("returns the subject, html and a plain-text alternative", async () => {
    const result = await renderCampaignEmail(campaign, {
      unsubscribeUrl: "https://getrandomtrip.com/es/unsubscribe?token=t",
      promo: {
        code: "FUNDADOR30",
        discountLabel: "30% de descuento",
        expiresAt: null,
      },
    });

    expect(result.subject).toBe("Tu escapada");
    expect(result.html).toMatch(/^<!DOCTYPE html/i);
    expect(result.html).toContain("FUNDADOR30");
    expect(result.html).toContain('href="https://getrandomtrip.com/es/xsed"');
    expect(result.text).toContain("Hola viajero");
    expect(result.text).toContain("FUNDADOR30");
    expect(result.text).toContain(
      "https://getrandomtrip.com/es/unsubscribe?token=t",
    );
    expect(result.text).not.toContain("<");
  });

  it("omits the CTA when the campaign has none", async () => {
    const result = await renderCampaignEmail(
      { ...campaign, ctaLabel: null, ctaUrl: null },
      { unsubscribeUrl: "https://getrandomtrip.com/es/unsubscribe" },
    );

    expect(result.html).not.toContain("Reservar");
  });
});
