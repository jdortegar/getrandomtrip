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
    "eyebrow",
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

  it("only gives honeymoon the Atelier card", () => {
    expect(getLevelIdsForType("honeymoon")).toEqual(["atelier"]);
    for (const level of [
      "xsed",
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
    expect(es.eyebrow).toBe("Sigue tu curiosidad.");
    expect(en.eyebrow).toBe("Follow your curiosity.");
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
