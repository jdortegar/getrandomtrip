import { availableBlogLocales, blogLocalePaths } from "../blogLocales";
import { describe, expect, it } from "vitest";
import { buildAlternates, canonicalUrl, isIndexablePath } from "../urls";

describe("public URL identity", () => {
  it("uses unprefixed Spanish, prefixed English and no query/hash", () => {
    expect(canonicalUrl("es", "/es/blog/story?token=secret#x")).toBe(
      "https://getrandomtrip.com/blog/story",
    );
    expect(canonicalUrl("en", "/blog/story")).toBe(
      "https://getrandomtrip.com/en/blog/story",
    );
    expect(canonicalUrl("en", "/")).toBe("https://getrandomtrip.com/en");
  });
  it("includes reciprocal self references for available translations only", () => {
    expect(buildAlternates("es", "/blog/story", ["es"])).toEqual({
      canonical: "https://getrandomtrip.com/blog/story",
      languages: { es: "https://getrandomtrip.com/blog/story" },
    });
    expect(Object.keys(buildAlternates("en", "/blog").languages)).toEqual([
      "es",
      "en",
    ]);
  });
  it.each([
    "/login",
    "/en/reset-password",
    "/invite/secret",
    "/dashboard",
    "/review/secret",
    "/checkout/success",
    "/trips/id",
    "/email-signatures",
    "/verify-email",
    "/unknown",
  ])("excludes utility/private route %s", (path) => {
    expect(isIndexablePath(path)).toBe(false);
  });
  it.each([
    "/",
    "/en",
    "/blog/story",
    "/en/trippers/alex",
    "/experiences/by-type/solo",
  ])("includes public route %s", (path) => {
    expect(isIndexablePath(path)).toBe(true);
  });
});

it("advertises only complete translations, each at its own slug", () => {
  expect(availableBlogLocales({ es: "viaje" })).toEqual(["es"]);
  expect(availableBlogLocales({ en: "trip", es: "viaje" })).toEqual([
    "es",
    "en",
  ]);
  expect(blogLocalePaths({ es: "viaje", en: "trip" })).toEqual({
    es: "/blog/viaje",
    en: "/blog/trip",
  });
});

it("builds per-locale alternates when each locale has its own path", () => {
  expect(
    buildAlternates("en", { es: "/blog/viaje", en: "/blog/trip" }),
  ).toEqual({
    canonical: "https://getrandomtrip.com/en/blog/trip",
    languages: {
      es: "https://getrandomtrip.com/blog/viaje",
      en: "https://getrandomtrip.com/en/blog/trip",
    },
  });
});
