import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/config";
import {
  CONTENT_LOCALES,
  contentLocaleSchema,
  isContentLocale,
} from "../locales";

describe("blog content locales", () => {
  it("reuses the app locales as the single source of truth", () => {
    expect(CONTENT_LOCALES).toEqual(LOCALES);
  });

  it("accepts supported locales and rejects anything else", () => {
    expect(isContentLocale("es")).toBe(true);
    expect(isContentLocale("en")).toBe(true);
    expect(isContentLocale("fr")).toBe(false);
    expect(isContentLocale("EN")).toBe(false);
    expect(isContentLocale(undefined)).toBe(false);
    expect(isContentLocale(42)).toBe(false);
  });

  it("validates locales with zod", () => {
    expect(contentLocaleSchema.parse("en")).toBe("en");
    expect(contentLocaleSchema.safeParse("fr").success).toBe(false);
    expect(contentLocaleSchema.safeParse("").success).toBe(false);
  });
});
