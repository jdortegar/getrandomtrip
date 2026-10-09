import { describe, expect, it } from "vitest";
import { routeMetadata } from "../routeMetadata";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

describe("route metadata policy", () => {
  it("provides localized public index metadata and canonical identities", () => {
    expect(routeMetadata("/en/blog", "en", en, false)).toMatchObject({
      title: `${en.blogPage.meta.title} | Randomtrip`,
      description: en.blogPage.heroDescription,
      alternates: { canonical: "https://getrandomtrip.com/en/blog" },
    });
    expect(routeMetadata("/experiences", "es", es, false)).toMatchObject({
      title: `${es.experiences.meta.title} | Randomtrip`,
    });
    expect(routeMetadata("/xsed/drops", "es", es, false)).toMatchObject({
      title: `${es.xsedDropsPage.meta.title} | Randomtrip`,
    });
  });
  it("builds index titles from sentence-case meta copy, not all-caps hero copy", () => {
    for (const dict of [es, en]) {
      for (const path of ["/blog", "/experiences", "/xsed/drops"]) {
        const title = String(routeMetadata(path, "es", dict, false).title);
        const words = title
          .replace(" | Randomtrip", "")
          .split(/\s+/)
          .filter((word) => !["XSED", "TGIS"].includes(word));
        expect(words.some((word) => word !== word.toUpperCase())).toBe(true);
      }
    }
  });
  it("falls back to the localized default description on other public pages", () => {
    expect(routeMetadata("/en/about-us", "en", en, false).description).toBe(
      en.home.meta.description,
    );
    expect(routeMetadata("/about-us", "es", es, false).description).toBe(
      es.home.meta.description,
    );
  });
  it("keeps private and gated pages out of search without changing access", () => {
    expect(routeMetadata("/en/invite/token", "en", en, false)).toEqual({
      robots: { index: false, follow: false },
    });
    expect(routeMetadata("/en/blog", "en", en, true).robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
