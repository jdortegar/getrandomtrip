import { describe, it, expect } from "vitest";
import { resolveBlogRowAction, isBlogRowLockedForDeletion } from "../row-actions";

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

describe("isBlogRowLockedForDeletion", () => {
  it("locks a post pending admin review", () => {
    expect(isBlogRowLockedForDeletion("pending_review")).toBe(true);
  });

  it("locks a post pending tripper review", () => {
    expect(isBlogRowLockedForDeletion("pending_tripper_review")).toBe(true);
  });

  it("does not lock a draft post", () => {
    expect(isBlogRowLockedForDeletion("draft")).toBe(false);
  });

  it("does not lock a published post", () => {
    expect(isBlogRowLockedForDeletion("published")).toBe(false);
  });
});
