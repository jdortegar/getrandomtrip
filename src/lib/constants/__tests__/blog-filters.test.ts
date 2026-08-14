import { describe, expect, it } from "vitest";
import {
  getBlogExcuseOptions,
  getBlogTravelTypeOptions,
} from "@/lib/constants/blog-filters";

describe("getBlogExcuseOptions — regression: blog filter labels must be localized", () => {
  it("returns Spanish titles verbatim for es", () => {
    const options = getBlogExcuseOptions("es");
    const adventure = options.find((o) => o.key === "solo-aventura-desafio");
    expect(adventure?.label).toBe("Aventura & Desafío");
  });

  it("returns English titles for en, not the raw Spanish source data", () => {
    const options = getBlogExcuseOptions("en");
    const adventure = options.find((o) => o.key === "solo-aventura-desafio");
    expect(adventure?.label).toBe("Adventure & Challenge");
  });

  it("has a real English label for every excuse in the shared catalog (no Spanish leftover)", () => {
    // Guards against a new excuses.ts entry silently falling back to its
    // (untranslated) Spanish title on the en locale.
    const options = getBlogExcuseOptions("en");
    const spanishLeftover = options.filter((opt) =>
      /[áéíóúñÁÉÍÓÚÑ]/.test(opt.label),
    );
    expect(spanishLeftover).toEqual([]);
  });
});

describe("getBlogTravelTypeOptions — locale passthrough", () => {
  it("passes the locale through to traveler-type labels (es vs en differ)", () => {
    const es = getBlogTravelTypeOptions("es");
    const en = getBlogTravelTypeOptions("en");
    expect(es.length).toBeGreaterThan(0);
    expect(es).not.toEqual(en);
  });
});
