import { describe, expect, it } from "vitest";
import { generateSlug } from "../slug";

describe("generateSlug", () => {
  it("produces YYYY-MM-DD-city format for a simple ASCII city", () => {
    const result = generateSlug("2025-06-07", "Madrid");
    expect(result).toBe("2025-06-07-madrid");
  });

  it("converts city name to lowercase (triangulation)", () => {
    const result = generateSlug("2025-01-05", "Buenos Aires");
    expect(result).toBe("2025-01-05-buenos-aires");
  });

  it("replaces spaces and special characters with hyphens", () => {
    const result = generateSlug("2025-03-15", "São Paulo");
    expect(result).toBe("2025-03-15-sao-paulo");
  });

  it("falls back to 'unknown' when city is empty string", () => {
    const result = generateSlug("2025-06-07", "");
    expect(result).toBe("2025-06-07-unknown");
  });

  it("collapses multiple consecutive hyphens into one", () => {
    const result = generateSlug("2025-06-07", "New  York");
    expect(result).toBe("2025-06-07-new-york");
  });
});
