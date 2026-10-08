import { describe, expect, it } from "vitest";
import { travelerTypeOf } from "@/lib/db/tripRequestFamily";

describe("travelerTypeOf", () => {
  it("returns type for journey trips", () => {
    expect(travelerTypeOf({ type: "couple", level: "bivouac" })).toBe("couple");
    expect(travelerTypeOf({ type: "paws" })).toBe("paws");
  });

  it("returns level (the traveler type) for xsed trips", () => {
    expect(travelerTypeOf({ type: "xsed", level: "family" })).toBe("family");
  });

  it("returns an empty string for xsed trips without level", () => {
    expect(travelerTypeOf({ type: "xsed", level: null })).toBe("");
  });
});
