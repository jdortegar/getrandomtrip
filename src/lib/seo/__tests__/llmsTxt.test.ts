import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { buildLlmsTxt } from "../llmsTxt";
import { canonicalUrl } from "../urls";

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt();

  it("follows the llms.txt shape: H1 title then a blockquote summary", () => {
    const [title, blank, summary] = txt.split("\n");

    expect(title).toBe("# Randomtrip");
    expect(blank).toBe("");
    expect(summary).toBe(`> ${en.home.meta.description}`);
  });

  it("states who operates the brand and on which domain", () => {
    expect(txt).toContain(
      "Randomtrip is operated by Randomtrip Inc. at getrandomtrip.com.",
    );
  });

  it("includes the Spanish summary", () => {
    expect(txt).toContain(es.home.meta.description);
  });

  it.each([
    ["en", en],
    ["es", es],
  ])(
    "includes every %s how-it-works step, FAQ and XSED FAQ answer",
    (_, dict) => {
      for (const step of dict.home.homeInfo.howItWorksSteps) {
        expect(txt).toContain(step.description);
      }
      for (const item of [
        ...dict.faqPage.block.items,
        ...dict.xsedPage.faq.items,
      ]) {
        expect(txt).toContain(item.question);
        expect(txt).toContain(item.answer);
      }
    },
  );

  it("links key pages with canonical URLs in both locales", () => {
    for (const locale of ["en", "es"] as const) {
      for (const path of ["/", "/experiences", "/xsed", "/faq", "/about-us"]) {
        expect(txt).toContain(`(${canonicalUrl(locale, path)})`);
      }
    }
  });

  it("states the reveal timing and never uses 'drop day' jargon", () => {
    expect(txt).toContain("48 hours before departure");
    expect(txt).toContain("48 horas antes de salir");
    expect(txt).not.toMatch(/drop day|día del drop/i);
  });
});
