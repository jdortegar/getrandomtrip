import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";

import CampaignEmail from "../CampaignEmail";

const props = {
  title: "Llegó tu escapada",
  bodyMarkdown:
    "Hola **viajero**.\n\n- Destino sorpresa\n- [Ver más](https://getrandomtrip.com/es/xsed)\n\n<script>alert(1)</script>",
  unsubscribeUrl: "https://getrandomtrip.com/es/unsubscribe?token=abc.def",
};

describe("CampaignEmail", () => {
  it("renders the markdown body as email markup with HTML escaped", async () => {
    const html = await render(<CampaignEmail {...props} locale="es" />);

    expect(html).toContain("Llegó tu escapada");
    expect(html).toMatch(/<strong[^>]*>viajero<\/strong>/);
    expect(html).toMatch(/<li[^>]*>Destino sorpresa<\/li>/);
    expect(html).toContain('href="https://getrandomtrip.com/es/xsed"');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders the unsubscribe link with localized footer copy", async () => {
    const es = await render(<CampaignEmail {...props} locale="es" />);
    const en = await render(<CampaignEmail {...props} locale="en" />);

    expect(es).toContain(
      'href="https://getrandomtrip.com/es/unsubscribe?token=abc.def"',
    );
    expect(es).toContain("Darme de baja");
    expect(en).toContain("Unsubscribe");
    expect(en).toContain('lang="en"');
  });

  it("renders the CTA button only when provided", async () => {
    const without = await render(<CampaignEmail {...props} locale="es" />);
    const withCta = await render(
      <CampaignEmail
        {...props}
        cta={{ label: "Reservar", url: "https://getrandomtrip.com/es" }}
        locale="es"
      />,
    );

    expect(without).not.toContain("Reservar");
    expect(withCta).toContain("Reservar");
    expect(withCta).toContain('href="https://getrandomtrip.com/es"');
  });

  it("highlights the promo code with discount and expiry in each locale", async () => {
    const promo = {
      code: "FUNDADOR30",
      discountLabel: "30% de descuento",
      expiresAt: "2026-12-31T12:00:00.000Z",
    };
    const es = await render(
      <CampaignEmail {...props} locale="es" promo={promo} />,
    );
    const en = await render(
      <CampaignEmail
        {...props}
        locale="en"
        promo={{ ...promo, discountLabel: "30% off" }}
      />,
    );

    expect(es).toContain("FUNDADOR30");
    expect(es).toContain("Tu código");
    expect(es).toContain("30% de descuento");
    expect(es).toContain("Válido hasta el 31 de diciembre de 2026");
    expect(en).toContain("Your code");
    expect(en).toContain("Valid until December 31, 2026");
  });

  it("omits the promo block and expiry when absent", async () => {
    const none = await render(<CampaignEmail {...props} locale="es" />);
    const noExpiry = await render(
      <CampaignEmail
        {...props}
        locale="es"
        promo={{ code: "AMIGOS30", discountLabel: "30% de descuento" }}
      />,
    );

    expect(none).not.toContain("Tu código");
    expect(noExpiry).toContain("AMIGOS30");
    expect(noExpiry).not.toContain("Válido hasta");
  });

  it("uses the preheader as preview text", async () => {
    const html = await render(
      <CampaignEmail {...props} locale="es" preheader="Solo esta semana" />,
    );
    expect(html).toContain("Solo esta semana");
  });
});
