import { describe, expect, it } from "vitest";

import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";

const IN_SCOPE_TYPES = ["couple", "solo", "family", "group", "paws"] as const;

type LocalizedJourney = {
  excuses: Array<{ key: string }>;
  refineDetailOptions: Record<string, Record<string, Array<{ key: string }>>>;
};

const dictionaries: Array<[string, LocalizedJourney]> = [
  ["es", es.journey as unknown as LocalizedJourney],
  ["en", en.journey as unknown as LocalizedJourney],
];

describe("excuse catalog", () => {
  it.each(IN_SCOPE_TYPES)("%s has at least 3 excuses", (type) => {
    expect(getExcusesByTravelerType(type).length).toBeGreaterThanOrEqual(3);
  });

  it.each(IN_SCOPE_TYPES)(
    "%s excuses have unique keys and 3+ options with unique keys",
    (type) => {
      const excuses = getExcusesByTravelerType(type);
      const excuseKeys = excuses.map((e) => e.key);
      expect(new Set(excuseKeys).size).toBe(excuseKeys.length);
      for (const excuse of excuses) {
        const optionKeys = excuse.details.options.map((o) => o.key);
        expect(optionKeys.length).toBeGreaterThanOrEqual(3);
        expect(new Set(optionKeys).size).toBe(optionKeys.length);
      }
    },
  );

  it("excuse keys are unique across every type", () => {
    const keys = IN_SCOPE_TYPES.flatMap((t) =>
      getExcusesByTravelerType(t).map((e) => e.key),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(["family", "paws"] as const)(
    "%s has a localized override in es and en for each excuse and option",
    (type) => {
      for (const [locale, journey] of dictionaries) {
        for (const excuse of getExcusesByTravelerType(type)) {
          expect(
            journey.excuses.some((e) => e.key === excuse.key),
            `${locale} excuse ${excuse.key}`,
          ).toBe(true);
          const localized = journey.refineDetailOptions[type]?.[excuse.key];
          expect(localized, `${locale} options ${excuse.key}`).toBeDefined();
          for (const option of excuse.details.options) {
            expect(
              localized.some((o) => o.key === option.key),
              `${locale} option ${option.key}`,
            ).toBe(true);
          }
        }
      }
    },
  );
});
