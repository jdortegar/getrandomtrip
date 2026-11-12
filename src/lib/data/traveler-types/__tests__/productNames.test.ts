import { describe, expect, it } from "vitest";
import { getTravelerType, TRAVELER_TYPE_SLUGS } from "../index";

describe("traveler-type product names", () => {
  it.each(
    TRAVELER_TYPE_SLUGS.flatMap((slug) => [
      [slug, "es"],
      [slug, "en"],
    ]),
  )("%s (%s) uses the shared 'Name© Randomtrip' casing", (slug, locale) => {
    const title = getTravelerType(slug, locale)?.content.hero.title;
    expect(title).toMatch(/^[A-Z][a-z]+© Randomtrip$/);
  });
});
