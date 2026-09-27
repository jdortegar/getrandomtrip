import { describe, expect, it } from "vitest";
import { routeMetadata } from "../routeMetadata";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

describe("route metadata policy", () => {
  it("provides localized public index metadata and canonical identities", () => {
    expect(routeMetadata("/en/blog", "en", en, false)).toMatchObject({
      title: `${en.blogPage.heroTitleDefault} | Randomtrip`,
      description: en.blogPage.heroDescription,
      alternates: { canonical: "https://getrandomtrip.com/en/blog" },
    });
    expect(routeMetadata("/experiences", "es", es, false)).toMatchObject({
      title: `${es.experiences.hero.title} | Randomtrip`,
    });
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
