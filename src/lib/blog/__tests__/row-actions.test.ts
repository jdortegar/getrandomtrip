import { describe, it, expect } from "vitest";
import { resolveBlogRowAction } from "../row-actions";

describe("resolveBlogRowAction", () => {
  it("returns 'none' for a draft post — submitting only happens inside the wizard, no list-page shortcut", () => {
    expect(resolveBlogRowAction("draft")).toBe("none");
  });

  it("returns 'waiting' for a post pending admin review", () => {
    expect(resolveBlogRowAction("pending_review")).toBe("waiting");
  });

  it("returns 'review' for a post pending tripper review (admin proposed a copy)", () => {
    expect(resolveBlogRowAction("pending_tripper_review")).toBe("review");
  });

  it("returns 'none' for a published post — no manual unpublish", () => {
    expect(resolveBlogRowAction("published")).toBe("none");
  });
});
