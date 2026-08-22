import { describe, expect, it } from "vitest";
import {
  getEffectiveTripperPriceOverrides,
  isPairOffered,
  parseTripperPriceOverrides,
  parseTripperPriceOverridesPayload,
} from "./tripper-price-overrides";

describe("isPairOffered", () => {
  it("is true for a pair with a non-zero catalog price", () => {
    expect(isPairOffered("couple", "essenza")).toBe(true);
  });

  it("is false for a pair the catalog prices at 0 (honeymoon below atelier)", () => {
    expect(isPairOffered("honeymoon", "essenza")).toBe(false);
  });

  it("is true for the one honeymoon pair the catalog does offer (atelier)", () => {
    expect(isPairOffered("honeymoon", "atelier")).toBe(true);
  });
});

describe("parseTripperPriceOverrides (read side, lenient)", () => {
  it("returns null for null input", () => {
    expect(parseTripperPriceOverrides(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseTripperPriceOverrides("nonsense")).toBeNull();
    expect(parseTripperPriceOverrides(42)).toBeNull();
  });

  it("keeps a valid override for an offered pair", () => {
    const result = parseTripperPriceOverrides({
      couple: { explora: 350 },
    });
    expect(result).toEqual({ couple: { explora: 350 } });
  });

  it("drops an unknown traveler type key", () => {
    const result = parseTripperPriceOverrides({
      bogus: { explora: 350 },
      couple: { explora: 350 },
    });
    expect(result).toEqual({ couple: { explora: 350 } });
  });

  it("drops an unknown level key", () => {
    const result = parseTripperPriceOverrides({
      couple: { bogusLevel: 350, explora: 350 },
    });
    expect(result).toEqual({ couple: { explora: 350 } });
  });

  it("drops a non-finite or negative cell value", () => {
    const result = parseTripperPriceOverrides({
      couple: { atelier: -10, bivouac: Number.NaN, explora: 350 },
    });
    expect(result).toEqual({ couple: { explora: 350 } });
  });

  it("treats a null cell value as absent (inherit)", () => {
    const result = parseTripperPriceOverrides({
      couple: { essenza: null, explora: 350 },
    });
    expect(result).toEqual({ couple: { explora: 350 } });
  });

  it("keeps an explicit 0 override", () => {
    const result = parseTripperPriceOverrides({ couple: { explora: 0 } });
    expect(result).toEqual({ couple: { explora: 0 } });
  });
});

describe("parseTripperPriceOverridesPayload (write side, strict)", () => {
  it("accepts a valid payload with only offered pairs", () => {
    const result = parseTripperPriceOverridesPayload({
      couple: { essenza: 220, explora: 350 },
    });
    expect(result).toEqual({
      ok: true,
      value: { couple: { essenza: 220, explora: 350 } },
    });
  });

  it("rejects a non-object payload with invalid-shape", () => {
    expect(parseTripperPriceOverridesPayload("nope")).toEqual({
      error: "invalid-shape",
      ok: false,
    });
    expect(parseTripperPriceOverridesPayload(null)).toEqual({
      error: "invalid-shape",
      ok: false,
    });
  });

  it("rejects an unknown traveler type with unknown-type", () => {
    expect(
      parseTripperPriceOverridesPayload({ bogus: { essenza: 100 } }),
    ).toEqual({ error: "unknown-type", ok: false });
  });

  it("rejects an unknown level with unknown-level", () => {
    expect(
      parseTripperPriceOverridesPayload({ couple: { bogusLevel: 100 } }),
    ).toEqual({ error: "unknown-level", ok: false });
  });

  it("rejects a NaN cell value with not-finite", () => {
    expect(
      parseTripperPriceOverridesPayload({ couple: { essenza: Number.NaN } }),
    ).toEqual({ error: "not-finite", ok: false });
  });

  it("rejects a negative cell value with negative", () => {
    expect(
      parseTripperPriceOverridesPayload({ couple: { essenza: -5 } }),
    ).toEqual({ error: "negative", ok: false });
  });

  it("rejects an override on a not-offered pair with not-offered", () => {
    expect(
      parseTripperPriceOverridesPayload({ honeymoon: { essenza: 100 } }),
    ).toEqual({ error: "not-offered", ok: false });
  });

  it("a null cell value clears that key (does not error)", () => {
    expect(
      parseTripperPriceOverridesPayload({
        couple: { essenza: null, explora: 350 },
      }),
    ).toEqual({ ok: true, value: { couple: { explora: 350 } } });
  });

  it("strips an empty-object type entry from the result", () => {
    expect(
      parseTripperPriceOverridesPayload({
        couple: { essenza: null },
        solo: { essenza: 300 },
      }),
    ).toEqual({ ok: true, value: { solo: { essenza: 300 } } });
  });

  it("accepts an empty payload", () => {
    expect(parseTripperPriceOverridesPayload({})).toEqual({
      ok: true,
      value: {},
    });
  });
});

describe("getEffectiveTripperPriceOverrides", () => {
  const overrides = { couple: { explora: 350 } };

  it("returns null when there is no tripper context", () => {
    expect(getEffectiveTripperPriceOverrides(null, "couple")).toBeNull();
    expect(getEffectiveTripperPriceOverrides(undefined, "couple")).toBeNull();
  });

  it("returns null when the tripper doesn't offer the requested type", () => {
    const context = { allowedTypes: ["solo"], priceOverrides: overrides };
    expect(getEffectiveTripperPriceOverrides(context, "couple")).toBeNull();
  });

  it("returns the tripper's overrides when the type is offered", () => {
    const context = { allowedTypes: ["couple", "solo"], priceOverrides: overrides };
    expect(getEffectiveTripperPriceOverrides(context, "couple")).toBe(
      overrides,
    );
  });

  it("returns null (not the stale object) when overrides exist but the type isn't offered, even case-insensitively", () => {
    const context = { allowedTypes: ["Couple"], priceOverrides: overrides };
    expect(getEffectiveTripperPriceOverrides(context, "couple")).toBe(
      overrides,
    );
    expect(getEffectiveTripperPriceOverrides(context, "solo")).toBeNull();
  });

  it("returns null when the tripper offers the type but has no overrides configured", () => {
    const context = { allowedTypes: ["couple"], priceOverrides: null };
    expect(getEffectiveTripperPriceOverrides(context, "couple")).toBeNull();
  });
});
