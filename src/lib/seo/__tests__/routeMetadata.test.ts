import { describe, expect, it } from "vitest";
import { routeMetadata } from "../routeMetadata";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

describe("route metadata policy", () => {
  it("provides localized public index metadata and canonical identities", () => {
    expect(routeMetadata("/en/blog", "en", en)).toMatchObject({
      title: `${en.blogPage.meta.title} | Randomtrip`,
      description: en.blogPage.heroDescription,
      alternates: { canonical: "https://getrandomtrip.com/en/blog" },
    });
    expect(routeMetadata("/experiences", "es", es)).toMatchObject({
      title: `${es.experiences.meta.title} | Randomtrip`,
    });
    expect(routeMetadata("/xsed/drops", "es", es)).toMatchObject({
      title: `${es.xsedDropsPage.meta.title} | Randomtrip`,
    });
  });
  it("builds index titles from sentence-case meta copy, not all-caps hero copy", () => {
    for (const dict of [es, en]) {
      for (const path of ["/blog", "/experiences", "/xsed/drops"]) {
        const title = String(routeMetadata(path, "es", dict).title);
        const words = title
          .replace(" | Randomtrip", "")
          .split(/\s+/)
          .filter((word) => !["XSED", "TGIS"].includes(word));
        expect(words.some((word) => word !== word.toUpperCase())).toBe(true);
      }
    }
  });
  it("falls back to the localized default description on other public pages", () => {
    expect(routeMetadata("/en/about-us", "en", en).description).toBe(
      en.home.meta.description,
    );
    expect(routeMetadata("/about-us", "es", es).description).toBe(
      es.home.meta.description,
    );
  });
  it("keeps private pages out of search", () => {
    expect(routeMetadata("/en/invite/token", "en", en)).toEqual({
      robots: { index: false, follow: false },
    });
  });
  it("never emits noindex for public pages, so maintenance mode cannot deindex them", () => {
    for (const path of ["/", "/en/blog", "/experiences", "/about-us"]) {
      expect(routeMetadata(path, "es", es).robots).toBeUndefined();
    }
  });
});
