import { describe, expect, it } from "vitest";
import { emailsMatch, maskEmail, normalizeEmail } from "../travelerEmail";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });
  it("returns an empty string for nullish input", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("emailsMatch", () => {
  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(emailsMatch(" Ana@Example.com", "ana@example.com ")).toBe(true);
  });
  it("rejects different addresses", () => {
    expect(emailsMatch("ana@example.com", "bob@example.com")).toBe(false);
  });
  it("never matches when either side is empty", () => {
    expect(emailsMatch(null, "ana@example.com")).toBe(false);
    expect(emailsMatch("ana@example.com", "  ")).toBe(false);
    expect(emailsMatch(null, null)).toBe(false);
  });
});

describe("maskEmail", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmail("jane.doe@gmail.com")).toBe("j***@gmail.com");
  });
  it("returns null for empty or malformed input", () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail("  ")).toBeNull();
    expect(maskEmail("no-at-sign")).toBeNull();
  });
});
