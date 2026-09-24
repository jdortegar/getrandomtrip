import { describe, it, expect } from "vitest";
import { BLOG_LABEL_MAX_LENGTH, normalizeBlogLabel } from "../label";

describe("normalizeBlogLabel", () => {
  it("returns undefined when the field was not sent", () => {
    expect(normalizeBlogLabel(undefined)).toBeUndefined();
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeBlogLabel("  XSED Nº1 (AR)  ")).toBe("XSED Nº1 (AR)");
  });

  it.each([null, "", "   "])("stores null for an empty value (%j)", (value) => {
    expect(normalizeBlogLabel(value)).toBeNull();
  });

  it("stores null for non-string values", () => {
    expect(normalizeBlogLabel(42)).toBeNull();
  });

  it("caps the label at the max length", () => {
    const long = "X".repeat(BLOG_LABEL_MAX_LENGTH + 10);
    expect(normalizeBlogLabel(long)).toHaveLength(BLOG_LABEL_MAX_LENGTH);
  });
});
