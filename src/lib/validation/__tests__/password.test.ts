import { describe, it, expect } from "vitest";
import { isValidPassword, PASSWORD_MIN_LENGTH } from "../password";

describe("isValidPassword", () => {
  it("exposes a minimum length constant of 8", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("rejects a 7-char password (Scenario: weak password rejected)", () => {
    expect(isValidPassword("abc123")).toBe(false);
  });

  it("rejects an 8+ char password with no letter", () => {
    expect(isValidPassword("12345678")).toBe(false);
  });

  it("rejects an 8+ char password with no digit", () => {
    expect(isValidPassword("abcdefgh")).toBe(false);
  });

  it("accepts an 8+ char password with a letter and a digit", () => {
    expect(isValidPassword("abc12345")).toBe(true);
  });
});
