import { describe, it, expect } from "vitest";
import { subjects, toParagraphs } from "../AdminTripContactMessage";

describe("toParagraphs", () => {
  it("splits a multi-newline body into one trimmed paragraph per line", () => {
    const body = "Hello there,\n\nWe wanted to check in.\n\nBest,\nThe team";
    expect(toParagraphs(body)).toEqual([
      "Hello there,",
      "We wanted to check in.",
      "Best,",
      "The team",
    ]);
  });

  it("drops blank lines produced by extra newlines", () => {
    const body = "First paragraph\n\n\n\nSecond paragraph";
    expect(toParagraphs(body)).toEqual(["First paragraph", "Second paragraph"]);
  });

  it("returns a single paragraph for a single-line body", () => {
    expect(toParagraphs("Just one line")).toEqual(["Just one line"]);
  });

  it("trims leading/trailing whitespace from each paragraph", () => {
    const body = "  padded start\n\n  padded end  ";
    expect(toParagraphs(body)).toEqual(["padded start", "padded end"]);
  });

  it("handles \\r\\n line endings", () => {
    const body = "line one\r\n\r\nline two";
    expect(toParagraphs(body)).toEqual(["line one", "line two"]);
  });
});

describe("subjects", () => {
  it("has distinct, non-empty es and en subjects", () => {
    expect(subjects.es).toBeTruthy();
    expect(subjects.en).toBeTruthy();
    expect(subjects.es).not.toBe(subjects.en);
  });
});
