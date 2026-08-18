import { describe, expect, it } from "vitest";
import { getBasePricePerPerson } from "@/lib/data/traveler-types";
import {
  getLevelById,
  getLevelsForType,
  getPlannerContentForType,
  getPlannerLevelsForType,
} from "../levels";

describe("getPlannerLevelsForType (tripper-override-aware)", () => {
  it("uses the catalog price when no overrides are passed", () => {
    const levels = getPlannerLevelsForType("couple", "en");
    const essenza = levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(getBasePricePerPerson("couple", "essenza"));
  });

  it("uses the catalog price when overrides is explicitly null", () => {
    const levels = getPlannerLevelsForType("couple", "en", null);
    const essenza = levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(getBasePricePerPerson("couple", "essenza"));
  });

  it("prefers a tripper override over the catalog price for the matching pair", () => {
    const levels = getPlannerLevelsForType("couple", "en", {
      couple: { essenza: 999 },
    });
    const essenza = levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(999);
  });

  it("falls back to the catalog price for pairs the override doesn't touch", () => {
    const levels = getPlannerLevelsForType("couple", "en", {
      couple: { essenza: 999 },
    });
    const explora = levels.find((l) => l.id === "modo-explora");
    expect(explora?.price).toBe(getBasePricePerPerson("couple", "explora"));
  });
});

describe("getPlannerContentForType (tripper-override-aware)", () => {
  it("threads overrides through to the returned levels", () => {
    const content = getPlannerContentForType("couple", "en", {
      couple: { essenza: 777 },
    });
    const essenza = content.levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(777);
  });
});

describe("getLevelsForType (tripper-override-aware)", () => {
  it("uses the catalog price when no overrides are passed", () => {
    const levels = getLevelsForType("couple", "en");
    const essenza = levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(getBasePricePerPerson("couple", "essenza"));
  });

  it("prefers a tripper override over the catalog price for the matching pair", () => {
    const levels = getLevelsForType("couple", "en", {
      couple: { essenza: 555 },
    });
    const essenza = levels.find((l) => l.id === "essenza");
    expect(essenza?.price).toBe(555);
  });

  it("falls back to the catalog price for pairs the override doesn't touch", () => {
    const levels = getLevelsForType("couple", "en", {
      couple: { essenza: 555 },
    });
    const explora = levels.find((l) => l.id === "modo-explora");
    expect(explora?.price).toBe(getBasePricePerPerson("couple", "explora"));
  });
});

describe("getLevelById (tripper-override-aware)", () => {
  it("uses the catalog price when no overrides are passed", () => {
    const level = getLevelById("couple", "essenza", "en");
    expect(level?.price).toBe(getBasePricePerPerson("couple", "essenza"));
  });

  it("prefers a tripper override over the catalog price", () => {
    const level = getLevelById("couple", "essenza", "en", {
      couple: { essenza: 444 },
    });
    expect(level?.price).toBe(444);
  });
});
