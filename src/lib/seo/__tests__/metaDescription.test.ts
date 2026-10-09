import { describe, expect, it } from "vitest";
import { META_DESCRIPTION_MAX, toMetaDescription } from "../metaDescription";

describe("toMetaDescription", () => {
  it("collapses whitespace and trims", () => {
    expect(toMetaDescription("  Hola\n\n  mundo\t ")).toBe("Hola mundo");
  });

  it("returns an empty string for missing text", () => {
    expect(toMetaDescription(undefined)).toBe("");
    expect(toMetaDescription(null)).toBe("");
    expect(toMetaDescription("   ")).toBe("");
  });

  it("keeps text that already fits", () => {
    const text = "a".repeat(META_DESCRIPTION_MAX);
    expect(toMetaDescription(text)).toBe(text);
  });

  it("cuts long text at a word boundary and adds an ellipsis", () => {
    const text = "palabra ".repeat(40);
    const result = toMetaDescription(text);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(result.endsWith("palabra…")).toBe(true);
  });

  it("hard-cuts a single word longer than the limit", () => {
    const result = toMetaDescription("x".repeat(400));
    expect(result).toBe(`${"x".repeat(META_DESCRIPTION_MAX - 1)}…`);
  });
});
