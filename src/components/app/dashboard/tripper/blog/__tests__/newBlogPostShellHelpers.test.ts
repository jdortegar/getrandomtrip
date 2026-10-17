import { describe, it, expect } from "vitest";
import { resolveBlogChangedFieldsForLocale } from "@/lib/blog/blog-form-peek";
import {
  isEditingExisting,
  resolveBlogPersistTarget,
  resolveBlogPublishRedirectPath,
  shouldShowTripperNoteField,
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

describe("resolveBlogPublishRedirectPath", () => {
  it("goes to the admin blog list in adminCreate mode regardless of source", () => {
    expect(resolveBlogPublishRedirectPath("adminCreate", "es")).toBe(
      "/es/dashboard/admin/blog",
    );
    expect(resolveBlogPublishRedirectPath("adminCreate", "es", "TRIPPER")).toBe(
      "/es/dashboard/admin/blog",
    );
  });

  it("goes to the tripper blog list in tripper mode for a TRIPPER-sourced post", () => {
    expect(resolveBlogPublishRedirectPath("tripper", "es", "TRIPPER")).toBe(
      "/es/dashboard/tripper/blog",
    );
  });

  it("goes to the tripper blog list in tripper mode when source is unknown (default)", () => {
    expect(resolveBlogPublishRedirectPath("tripper", "es")).toBe(
      "/es/dashboard/tripper/blog",
    );
  });

  it("goes to the admin blog list in tripper mode for a RANDOMTRIP-sourced post — an admin finishing their own draft through the tripper edit page still belongs on the admin list", () => {
    expect(resolveBlogPublishRedirectPath("tripper", "es", "RANDOMTRIP")).toBe(
      "/es/dashboard/admin/blog",
    );
  });
});

describe("shouldShowTripperNoteField", () => {
  it("shows the note field for a regular tripper submitting their own TRIPPER-sourced post", () => {
    expect(shouldShowTripperNoteField("tripper", "TRIPPER")).toBe(true);
  });

  it("shows the note field when source is unknown (default, backward compatible)", () => {
    expect(shouldShowTripperNoteField("tripper")).toBe(true);
  });

  it("hides the note field in adminCreate mode — there is no reviewer to note", () => {
    expect(shouldShowTripperNoteField("adminCreate")).toBe(false);
  });

  it("hides the note field in tripper mode for a RANDOMTRIP-sourced post — it publishes directly, skipping review", () => {
    expect(shouldShowTripperNoteField("tripper", "RANDOMTRIP")).toBe(false);
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

// NewBlogPostShell highlights fields of the displayed content language by
// mapping the stored changedFields tokens through this resolver.
describe("displayed changed fields (shell token mapping)", () => {
  const highlighted = (tokens: string[] | undefined, locale: "es" | "en") =>
    new Set(resolveBlogChangedFieldsForLocale(tokens ?? [], locale));

  it("highlights a per-locale change only in its own language", () => {
    const tokens = ["es.title", "en.blocks"];
    expect(highlighted(tokens, "es").has("title")).toBe(true);
    expect(highlighted(tokens, "es").has("blocks")).toBe(false);
    expect(highlighted(tokens, "en").has("blocks")).toBe(true);
    expect(highlighted(tokens, "en").has("title")).toBe(false);
  });

  it("highlights every localized step of a locale added or removed by the admin", () => {
    const en = highlighted(["en.*"], "en");
    for (const field of ["title", "subtitle", "tagline", "blocks", "faq", "seo"])
      expect(en.has(field)).toBe(true);
    expect(highlighted(["en.*"], "es").size).toBe(0);
  });

  it("highlights shared fields (cover, tags, sourceLocale) in both languages", () => {
    for (const locale of ["es", "en"] as const)
      expect([...highlighted(["coverUrl", "sourceLocale"], locale)]).toEqual([
        "coverUrl",
        "sourceLocale",
      ]);
  });

  it("keeps copies stored before T5 working: legacy columns are Spanish, `translations` is English", () => {
    const legacy = ["title", "faq", "translations"];
    expect([...highlighted(legacy, "es")]).toEqual(["title", "faq"]);
    const en = highlighted(legacy, "en");
    expect(en.has("title")).toBe(true);
    expect(en.has("blocks")).toBe(true);
    expect(en.has("translations")).toBe(false);
  });

  it("treats missing changedFields as no highlights", () => {
    expect(highlighted(undefined, "es").size).toBe(0);
  });
});
