import { describe, expect, it } from "vitest";
import { isAllowedDocumentMime } from "../documentMimeTypes";

describe("isAllowedDocumentMime", () => {
  it("accepts application/pdf", () => {
    expect(isAllowedDocumentMime("application/pdf")).toBe(true);
  });

  it("accepts image/jpeg", () => {
    expect(isAllowedDocumentMime("image/jpeg")).toBe(true);
  });

  it("accepts image/png", () => {
    expect(isAllowedDocumentMime("image/png")).toBe(true);
  });

  it("rejects image/svg+xml (inline-SVG XSS risk on the View action)", () => {
    expect(isAllowedDocumentMime("image/svg+xml")).toBe(false);
  });

  it("rejects an arbitrary unsupported type", () => {
    expect(isAllowedDocumentMime("application/zip")).toBe(false);
  });
});
