// @vitest-environment node
import { expect, it } from "vitest";
import {
  captionOnly,
  selectedCopyLocks,
  SOLO_REVIEWED_COPY,
  SOCIAL_BRAND_POLICY,
} from "../socialBrandPolicy";
it("never selects approved example by similarity or matching shortcode alone", () => {
  expect(selectedCopyLocks("De0IMw8jOGl", undefined, false)).toEqual({});
  expect(() => selectedCopyLocks("OTHER123", undefined, true)).toThrow(
    "REVIEWED_ASSET_MISMATCH",
  );
});
it("explicit fixture selection preserves exact field boundaries and four caption paragraphs", () => {
  const selected = selectedCopyLocks("De0IMw8jOGl", undefined, true);
  expect(selected.artworkHeadline).toBe("GET LOST TO FIND YOURSELF");
  expect(selected.caption).toBe(
    "Lose the plan. Find yourself.\n\nSometimes, the best thing you can do is put the map away.\n\nAt Randomtrip, we take care of the details so you can simply enjoy what unfolds.\n\nWould you travel solo without knowing where you’re going?",
  );
  expect(selected.caption?.split("\n\n")).toHaveLength(4);
  expect(selected.caption).not.toContain("GET LOST");
  expect(selected.caption).not.toContain("rationale");
  expect(selected.caption).not.toContain("#");
});
it("current explicit field locks take precedence over reviewed examples without changing whitespace", () => {
  const caption = "  My exact caption.\n\nSecond paragraph.  ";
  expect(selectedCopyLocks("De0IMw8jOGl", { caption }, true)).toEqual({
    ...SOLO_REVIEWED_COPY,
    caption,
  });
  expect(() =>
    selectedCopyLocks(
      "OTHER123",
      { caption: "EDITORIAL RATIONALE — NOT PUBLISHABLE CAPTION" },
      false,
    ),
  ).toThrow();
});
it("keeps rationale out of generated caption and encodes corrected shared policy", () => {
  expect(() =>
    captionOnly("Caption\n\nEDITORIAL RATIONALE: Why this works"),
  ).toThrow();
  expect(SOCIAL_BRAND_POLICY).toContain("not a human approval");
  expect(SOCIAL_BRAND_POLICY).toContain("Do not add hashtags");
  expect(SOCIAL_BRAND_POLICY).toContain("post-specific");
});
