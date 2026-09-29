// @vitest-environment node
import { expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { parseHotelVoucher } from "../../parsers/hotelVoucher";
import { prepareHtmlDocument } from "../html/prepareHtmlDocument";
import { hotelFixture } from "./referenceFixtures";

for (const locale of ["en", "es"] as const) {
  const copy = (locale === "en" ? en : es).pdfLayout;
  for (const field of ["providerUrl", "locationUrl"] as const) {
    it(`uses truthful ${locale} link instructions for a valid oversized ${field}`, async () => {
      const input = structuredClone(hotelFixture);
      input.locale = locale;
      delete input.data.supplierConfirmationUrl;
      delete input.data.property.providerUrl;
      const url = `https://example.com/${"é".repeat(1000)}`;
      input.data.property[field] = url;
      expect(Buffer.byteLength(url, "utf8")).toBeGreaterThan(2000);
      const parsed = parseHotelVoucher(input, "generation");
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));

      const { html } = await prepareHtmlDocument(parsed.value);
      expect(html.includes(`href="${url}"`)).toBe(true);
      expect(html.includes(`<p>${copy.linkHint}</p>`)).toBe(true);
      expect(html.includes(copy.qrHint)).toBe(false);
      expect(html.includes('class="qr-image"')).toBe(false);
    });
  }
  it(`retains ${locale} scan instructions when a link QR is present`, async () => {
    const input = structuredClone(hotelFixture);
    input.locale = locale;
    delete input.data.supplierConfirmationUrl;
    const { html } = await prepareHtmlDocument(input);
    expect(html.includes(`<p>${copy.qrHint}</p>`)).toBe(true);
    expect(html.includes('class="qr-image"')).toBe(true);
  });
}
