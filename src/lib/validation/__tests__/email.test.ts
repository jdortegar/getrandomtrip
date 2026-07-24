import { describe, it, expect } from "vitest";
import { isValidEmail } from "../email";

describe("isValidEmail", () => {
  it("rejects a string with no @ or domain (Scenario: invalid email format rejected on register)", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("accepts a well-formed email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
