import { describe, it, expect } from "vitest";
import {
  isEditingExisting,
  resolveBlogPersistTarget,
  shouldSkipAutosave,
  shouldSwapFooterForReviewActions,
} from "../newBlogPostShellHelpers";

describe("shouldSkipAutosave", () => {
  it("skips autosave only in adminReadOnly mode", () => {
    expect(shouldSkipAutosave("adminReadOnly")).toBe(true);
    expect(shouldSkipAutosave("adminEdit")).toBe(false);
    expect(shouldSkipAutosave("tripper")).toBe(false);
  });
});

describe("isEditingExisting", () => {
  it("is false for tripper with no initialDraftId (the 'new' post flow — autosave stays on)", () => {
    expect(isEditingExisting("tripper", false)).toBe(false);
  });

  it("is true for tripper with an initialDraftId (an edit page — autosave is off)", () => {
    expect(isEditingExisting("tripper", true)).toBe(true);
  });

  it("is false for adminEdit even with an initialDraftId (review-copy editing keeps its own always-on autosave)", () => {
    expect(isEditingExisting("adminEdit", true)).toBe(false);
  });

  it("is false for adminReadOnly regardless (never autosaves at all)", () => {
    expect(isEditingExisting("adminReadOnly", true)).toBe(false);
  });
});

describe("shouldSwapFooterForReviewActions", () => {
  it("swaps the footer nav for reviewActionsSlot in every non-tripper mode", () => {
    expect(shouldSwapFooterForReviewActions("adminEdit")).toBe(true);
    expect(shouldSwapFooterForReviewActions("adminReadOnly")).toBe(true);
    expect(shouldSwapFooterForReviewActions("tripper")).toBe(false);
  });
});

describe("resolveBlogPersistTarget", () => {
  it("targets the admin edit-copy endpoint when mode is adminEdit and a copy id is present", () => {
    expect(resolveBlogPersistTarget("adminEdit", "copy-1", null)).toEqual({
      kind: "adminEditCopy",
      copyId: "copy-1",
    });
    expect(resolveBlogPersistTarget("adminEdit", "copy-1", "draft-1")).toEqual({
      kind: "adminEditCopy",
      copyId: "copy-1",
    });
  });

  it("falls back to the tripper create branch when there is no draft id yet", () => {
    expect(resolveBlogPersistTarget("tripper", undefined, null)).toEqual({
      kind: "createDraft",
    });
  });

  it("falls back to the tripper update branch when a draft id already exists", () => {
    expect(resolveBlogPersistTarget("tripper", undefined, "draft-1")).toEqual({
      kind: "updateDraft",
      id: "draft-1",
    });
  });

  it("falls back to the tripper create/update branch in adminEdit mode without a copy id (defensive)", () => {
    expect(resolveBlogPersistTarget("adminEdit", undefined, "draft-1")).toEqual({
      kind: "updateDraft",
      id: "draft-1",
    });
  });
});
