import { describe, expect, it } from "vitest";
import { fixedSlidesThatFit, slidesThatFit } from "@/hooks/useCarouselCapacity";

describe("slidesThatFit", () => {
  it("mirrors the percentage breakpoints", () => {
    expect(slidesThatFit(1200, true, 4)).toBe(4);
    expect(slidesThatFit(480, true, 4)).toBe(3);
    expect(slidesThatFit(400, true, 4)).toBe(2);
    expect(slidesThatFit(400, false, 4)).toBe(1);
  });
});

describe("fixedSlidesThatFit", () => {
  it("counts whole fixed-width slides including the gap between them", () => {
    // 2 × 300px + 12px gap = 612px
    expect(fixedSlidesThatFit(612, 300)).toBe(2);
    expect(fixedSlidesThatFit(611, 300)).toBe(1);
    expect(fixedSlidesThatFit(1248, 300)).toBe(4);
  });

  it("never reports fewer than one slide", () => {
    expect(fixedSlidesThatFit(200, 300)).toBe(1);
  });
});
