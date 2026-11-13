import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { renderMaintenanceHtml } from "../html";

/** Strips <link> tags so the test DOM never fetches the font stylesheet. */
function parse(html: string) {
  return new DOMParser().parseFromString(
    html.replace(/<link[^>]*>/g, ""),
    "text/html",
  );
}

describe("renderMaintenanceHtml", () => {
  it.each([
    ["es", es.maintenance],
    ["en", en.maintenance],
  ] as const)("renders the %s logo and centered copy", (locale, copy) => {
    const doc = parse(renderMaintenanceHtml(locale));

    expect(doc.documentElement.lang).toBe(locale);
    expect(
      doc.querySelector('img[alt="Randomtrip"]')?.getAttribute("src"),
    ).toBe("/assets/logos/logo_randomtrip_no_tag.svg");
    expect(doc.querySelector("h1")?.textContent).toBe(copy.title);
    expect(doc.body.textContent).toContain(copy.eyebrow);
    expect(doc.body.textContent).toContain(copy.message);
    expect(doc.title).toBe(`${copy.title} | Randomtrip`);
  });

  it("is only the logo and text: no links, buttons, forms or scripts", () => {
    const doc = parse(renderMaintenanceHtml("es"));

    expect(doc.querySelectorAll("img")).toHaveLength(1);
    expect(doc.querySelector("a, button, form, input, script")).toBeNull();
  });

  it("asks crawlers not to index the maintenance page itself", () => {
    const doc = parse(renderMaintenanceHtml("en"));

    expect(
      doc.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex");
  });

  it("loads the brand fonts and escapes copy", () => {
    const html = renderMaintenanceHtml("es");

    expect(html).toContain("family=Barlow+Condensed:wght@700");
    expect(html).not.toMatch(/<h1>[^<]*[<>"][^<]*<\/h1>/);
  });
});
