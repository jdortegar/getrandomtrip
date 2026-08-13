import { describe, expect, it } from "vitest";
import esDict from "@/dictionaries/es.json";
import enDict from "@/dictionaries/en.json";

/**
 * i18n drift guard for the traveler trip-details redesign (design.md
 * Testing Strategy — "follows the `common.countries` drift-guard
 * precedent"). Walks every leaf string under `tripItinerary` and asserts
 * it exists, with a non-empty value, in BOTH locales — new keys included
 * (hero/nav/essentials/itinerary/documents/support/footer).
 */

type JsonRecord = Record<string, unknown>;

function collectLeafPaths(node: unknown, prefix: string): string[] {
  if (typeof node === "string") return [prefix];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    return Object.entries(node as JsonRecord).flatMap(([key, value]) =>
      collectLeafPaths(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

function getAtPath(obj: JsonRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as JsonRecord)[key];
    return undefined;
  }, obj);
}

const esTripItinerary = (esDict as JsonRecord).tripItinerary as JsonRecord;
const enTripItinerary = (enDict as JsonRecord).tripItinerary as JsonRecord;

describe("tripItinerary dictionary — es/en parity (drift guard)", () => {
  it("every leaf key in es.json has a non-empty match in en.json", () => {
    const esPaths = collectLeafPaths(esTripItinerary, "");
    expect(esPaths.length).toBeGreaterThan(0);

    for (const path of esPaths) {
      const esValue = getAtPath(esTripItinerary, path);
      const enValue = getAtPath(enTripItinerary, path);
      expect(typeof esValue, `es.json tripItinerary.${path} should be a string`).toBe("string");
      expect(esValue, `es.json tripItinerary.${path} should be non-empty`).not.toBe("");
      expect(enValue, `en.json is missing tripItinerary.${path}`).toBeTruthy();
    }
  });

  it("every leaf key in en.json has a non-empty match in es.json (no orphans)", () => {
    const enPaths = collectLeafPaths(enTripItinerary, "");
    expect(enPaths.length).toBeGreaterThan(0);

    for (const path of enPaths) {
      const enValue = getAtPath(enTripItinerary, path);
      const esValue = getAtPath(esTripItinerary, path);
      expect(typeof enValue, `en.json tripItinerary.${path} should be a string`).toBe("string");
      expect(enValue, `en.json tripItinerary.${path} should be non-empty`).not.toBe("");
      expect(esValue, `es.json is missing tripItinerary.${path}`).toBeTruthy();
    }
  });

  it("new grouped keys (hero/nav/essentials/itinerary/documents/support/footer) exist in both locales", () => {
    for (const group of [
      "hero",
      "nav",
      "essentials",
      "itinerary",
      "documents",
      "support",
      "footer",
    ]) {
      expect(esTripItinerary[group], `es.json tripItinerary.${group} missing`).toBeTruthy();
      expect(enTripItinerary[group], `en.json tripItinerary.${group} missing`).toBeTruthy();
    }
  });

  it("no dictionary value hardcodes a destination-specific word (spec: no destination-specific wording)", () => {
    const banned = [/mendoza/i, /malbec/i, /andes/i, /argentina/i];
    const esPaths = collectLeafPaths(esTripItinerary, "");
    const enPaths = collectLeafPaths(enTripItinerary, "");

    for (const path of [...esPaths, ...enPaths]) {
      const esValue = getAtPath(esTripItinerary, path);
      const enValue = getAtPath(enTripItinerary, path);
      for (const value of [esValue, enValue]) {
        if (typeof value !== "string") continue;
        for (const pattern of banned) {
          expect(pattern.test(value), `"${value}" at tripItinerary.${path} looks destination-specific`).toBe(
            false,
          );
        }
      }
    }
  });
});
