import { describe, expect, it } from "vitest";
import { canonicalizeExperienceTypeFilter } from "../experienceTypeFilter";

describe("canonicalizeExperienceTypeFilter", () => {
  it("uppercases the XSED sentinel regardless of caller casing", () => {
    expect(canonicalizeExperienceTypeFilter("xsed")).toBe("XSED");
    expect(canonicalizeExperienceTypeFilter("Xsed")).toBe("XSED");
    expect(canonicalizeExperienceTypeFilter("XSED")).toBe("XSED");
  });

  it("leaves lowercase traveler-type tokens untouched", () => {
    expect(canonicalizeExperienceTypeFilter("couple")).toBe("couple");
  });

  it("lowercases an uppercase traveler-type token to match stored casing", () => {
    expect(canonicalizeExperienceTypeFilter("COUPLE")).toBe("couple");
  });

  it("passes unknown tokens through trimmed, never silently mangled", () => {
    expect(canonicalizeExperienceTypeFilter("  something-else  ")).toBe(
      "something-else",
    );
  });
});
