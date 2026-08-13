import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE } from "../og";

describe("DEFAULT_OG_IMAGE", () => {
  it("points at the current opengraph.png asset", () => {
    expect(DEFAULT_OG_IMAGE.url).toBe("/images/opengraph.png");
  });

  it("carries the asset's real dimensions", () => {
    expect(DEFAULT_OG_IMAGE.width).toBe(1800);
    expect(DEFAULT_OG_IMAGE.height).toBe(1200);
  });

  it("has non-empty alt text", () => {
    expect(DEFAULT_OG_IMAGE.alt.length).toBeGreaterThan(0);
  });
});
