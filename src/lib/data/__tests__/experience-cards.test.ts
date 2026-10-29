import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getExperienceCard,
  getExperienceCardPhotoSrc,
} from "@/lib/data/experience-cards";
import { getLevelIdsForType } from "@/lib/data/experience-levels";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import { getPlannerLevelsForType } from "@/lib/utils/levels";

const TYPES: TravelerTypeSlug[] = [
  "couple",
  "family",
  "group",
  "honeymoon",
  "paws",
  "solo",
];
const LOCALES = ["es", "en"] as const;

function expectCompleteCard(type: string, level: string, locale: string) {
  const card = getExperienceCard(type, level, locale);
  expect(card, `${type}/${level}/${locale}`).not.toBeNull();
  for (const key of [
    "ctaLabel",
    "description",
    "kicker",
    "name",
    "photoAlt",
    "revealNote",
    "tag",
  ] as const) {
    expect(card![key].trim(), `${type}/${level}/${locale}.${key}`).not.toBe("");
  }
  expect(card!.details.length).toBeGreaterThan(0);
  expect(
    existsSync(path.join(process.cwd(), "public", card!.photoSrc)),
    card!.photoSrc,
  ).toBe(true);
  return card!;
}

describe("getExperienceCard", () => {
  it.each(TYPES)(
    "resolves complete es + en content and an existing photo for every %s level and XSED",
    (type) => {
      const levelIds = [...getLevelIdsForType(type), "xsed"];
      for (const locale of LOCALES) {
        for (const levelId of levelIds) {
          if (type === "honeymoon" && levelId === "xsed") continue;
          expectCompleteCard(type, levelId, locale);
        }
      }
    },
  );

  it("gives honeymoon an XSED card on the couple photo", () => {
    const card = getExperienceCard("honeymoon", "xsed", "es");
    expect(card?.description).toContain("celebrar este nuevo comienzo");
    expect(card?.photoSrc).toBe("/images/experience-cards/couple/xsed.jpg");
  });

  it("uses 'mi' for solo/paws and 'nuestro' for the rest on Atelier", () => {
    for (const type of ["solo", "paws"]) {
      expect(getExperienceCard(type, "atelier-getaway", "es")?.ctaLabel).toBe(
        "EMPEZAR MI VIAJE A MEDIDA",
      );
    }
    for (const type of ["couple", "group", "family", "honeymoon"]) {
      expect(getExperienceCard(type, "atelier-getaway", "es")?.ctaLabel).toBe(
        "EMPEZAR NUESTRO VIAJE A MEDIDA",
      );
    }
  });

  it("adds the drop schedule only to XSED, above the shared reveal note", () => {
    const xsed = getExperienceCard("solo", "xsed", "es");
    expect(xsed?.availabilityNote).toBe(
      "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
    );
    expect(xsed?.revealNote).toBe("Destino revelado 48 horas antes de salir.");
    expect(getExperienceCard("solo", "essenza", "es")?.availabilityNote).toBe(
      undefined,
    );
  });

  it("only gives honeymoon the Atelier level", () => {
    expect(getLevelIdsForType("honeymoon")).toEqual(["atelier"]);
    for (const level of [
      "essenza",
      "explora",
      "explora-plus",
      "bivouac",
    ]) {
      expect(getExperienceCard("honeymoon", level, "es")).toBeNull();
    }
    expect(getExperienceCard("honeymoon", "atelier-getaway", "en")?.name).toBe(
      "ATELIER GETAWAY™",
    );
  });

  it("translates copy while keeping product names and photos", () => {
    const es = getExperienceCard("solo", "modo-explora", "es")!;
    const en = getExperienceCard("solo", "explora", "en")!;
    expect(es.name).toBe("MODO EXPLORA™");
    expect(en.name).toBe("MODO EXPLORA™");
    expect(es.kicker).toBe("Más por descubrir");
    expect(en.kicker).toBe("More to discover");
    expect(en.photoSrc).toBe(es.photoSrc);
    expect(es.photoSrc).toBe(getExperienceCardPhotoSrc("solo", "modo-explora"));
    expect(es.transport?.modes).toEqual(["train-front", "ship", "plane"]);
    expect(es.details.find((d) => d.kind === "transport")?.label).toBe(
      "Transporte",
    );
  });

  it("styles XSED and Atelier CTAs per the design", () => {
    expect(getExperienceCard("couple", "xsed", "es")?.ctaStyle).toBe("feature");
    expect(getExperienceCard("couple", "atelier", "es")?.ctaStyle).toBe(
      "outline",
    );
    expect(getExperienceCard("couple", "essenza", "es")?.ctaStyle).toBe(
      "primary",
    );
  });

  it("returns null for unknown types or levels", () => {
    expect(getExperienceCard("unknown", "essenza", "es")).toBeNull();
    expect(getExperienceCard("solo", "nope", "es")).toBeNull();
  });
});

describe("getPlannerLevelsForType card wiring", () => {
  it.each(TYPES)("attaches card content to every %s planner level", (type) => {
    for (const locale of LOCALES) {
      for (const level of getPlannerLevelsForType(type, locale)) {
        expect(level.card).toEqual(getExperienceCard(type, level.id, locale));
      }
    }
  });
});
