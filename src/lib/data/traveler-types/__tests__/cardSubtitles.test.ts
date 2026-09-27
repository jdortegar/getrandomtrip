import { expect, it } from "vitest";
import { getTravelerTypeOptions, TRAVELER_TYPE_SLUGS } from "..";
const en = [
  "Discover the world at your own pace",
  "Create memories together",
  "Shared experiences",
  "Adventures for everyone",
  "The perfect beginning",
  "Travel with your pet",
];
const es = [
  "Descubre el mundo a tu ritmo",
  "Creen recuerdos juntos",
  "Experiencias compartidas",
  "Aventuras para todos",
  "El comienzo perfecto",
  "Con tu mascota de viaje",
];
it.each([
  ["en", en],
  ["es", es],
  ["invalid", es],
  [undefined, es],
] as const)(
  "localizes all six card subtitles with fallback: %s",
  (locale, expected) => {
    const options = getTravelerTypeOptions(locale);
    expect(options.map((o) => o.key)).toEqual(TRAVELER_TYPE_SLUGS);
    expect(options.map((o) => o.subtitle)).toEqual(expected);
  },
);
