import { describe, it, expect } from "vitest";
import {
  canRequestSubmit,
  isEditingExisting,
  isEditingLiveRandomtrip,
  resolveFinalizeCopy,
  resolvePublishRedirectPath,
  shouldShowTripperNoteField,
} from "../newExperienceShellHelpers";

// ── resolvePublishRedirectPath ──────────────────────────────────────────────
describe("resolvePublishRedirectPath", () => {
  it("redirects adminCreate to the admin experiences list, locale-prefixed", () => {
    expect(resolvePublishRedirectPath("adminCreate", "es")).toBe(
      "/es/dashboard/admin/experiences",
    );
  });

  it("redirects tripper mode to the tripper experiences list, locale-prefixed (regression: must not change)", () => {
    expect(resolvePublishRedirectPath("tripper", "en")).toBe(
      "/en/dashboard/tripper/experiences",
    );
  });
});

// ── canRequestSubmit ─────────────────────────────────────────────────────────
describe("canRequestSubmit", () => {
  it("allows submit for tripper mode when not submitting and not read-only, regardless of status (regression: existing tripper flow / resubmit-after-edit)", () => {
    expect(canRequestSubmit("tripper", false, false, "DRAFT")).toBe(true);
    expect(canRequestSubmit("tripper", false, false, "ACTIVE")).toBe(true);
  });

  it("allows submit for adminCreate mode when status is DRAFT", () => {
    expect(canRequestSubmit("adminCreate", false, false, "DRAFT")).toBe(true);
  });

  it("blocks submit for adminCreate mode once status is ACTIVE (nothing left to publish)", () => {
    expect(canRequestSubmit("adminCreate", false, false, "ACTIVE")).toBe(false);
  });

  it("blocks submit for adminEdit mode (unchanged — only tripper/adminCreate may finalize)", () => {
    expect(canRequestSubmit("adminEdit", false, false, "DRAFT")).toBe(false);
  });

  it("blocks submit for adminReadOnly mode", () => {
    expect(canRequestSubmit("adminReadOnly", false, false, "DRAFT")).toBe(false);
  });

  it("blocks submit while already submitting, regardless of mode", () => {
    expect(canRequestSubmit("adminCreate", true, false, "DRAFT")).toBe(false);
  });

  it("blocks submit while read-only, regardless of mode", () => {
    expect(canRequestSubmit("tripper", false, true, "DRAFT")).toBe(false);
  });
});

// ── isEditingLiveRandomtrip ──────────────────────────────────────────────────
describe("isEditingLiveRandomtrip", () => {
  it("is false for adminCreate while still DRAFT (new creation in progress — autosave is safe, nothing is public yet)", () => {
    expect(isEditingLiveRandomtrip("adminCreate", "DRAFT")).toBe(false);
  });

  it("is true for adminCreate once status is ACTIVE (editing an already-published row)", () => {
    expect(isEditingLiveRandomtrip("adminCreate", "ACTIVE")).toBe(true);
  });

  it("is false for tripper mode regardless of status (tripper autosave already protected by revertToDraft)", () => {
    expect(isEditingLiveRandomtrip("tripper", "ACTIVE")).toBe(false);
    expect(isEditingLiveRandomtrip("tripper", "DRAFT")).toBe(false);
  });

  it("is false for adminEdit and adminReadOnly modes (not applicable — different flows)", () => {
    expect(isEditingLiveRandomtrip("adminEdit", "ACTIVE")).toBe(false);
    expect(isEditingLiveRandomtrip("adminReadOnly", "ACTIVE")).toBe(false);
  });
});

// ── isEditingExisting ────────────────────────────────────────────────────────
describe("isEditingExisting", () => {
  it("is false for tripper/adminCreate with no initialDraftId (the 'new' creation flow — autosave stays on)", () => {
    expect(isEditingExisting("tripper", false)).toBe(false);
    expect(isEditingExisting("adminCreate", false)).toBe(false);
  });

  it("is true for tripper/adminCreate with an initialDraftId (an edit page, regardless of status — autosave is off)", () => {
    expect(isEditingExisting("tripper", true)).toBe(true);
    expect(isEditingExisting("adminCreate", true)).toBe(true);
  });

  it("is false for adminEdit even with an initialDraftId (review-copy editing is a different, nested flow with its own always-on autosave)", () => {
    expect(isEditingExisting("adminEdit", true)).toBe(false);
  });

  it("is false for adminReadOnly regardless (never autosaves at all)", () => {
    expect(isEditingExisting("adminReadOnly", true)).toBe(false);
  });
});

// ── resolveFinalizeCopy ──────────────────────────────────────────────────────
const baseDict = {
  submitConfirmTitle: "Tripper confirm title",
  submitConfirmBody: "Tripper confirm body",
  actionBar: { submitForReview: "Submit for review" },
};

describe("resolveFinalizeCopy", () => {
  it("falls back to tripper dict copy when no finalizeCopy override is given (regression: tripper mode unaffected)", () => {
    expect(resolveFinalizeCopy(baseDict, undefined)).toEqual({
      submitLabel: "Submit for review",
      confirmTitle: "Tripper confirm title",
      confirmBody: "Tripper confirm body",
    });
  });

  it("uses the finalizeCopy override when provided (admin publish copy)", () => {
    expect(
      resolveFinalizeCopy(baseDict, {
        submitLabel: "Publish",
        confirmTitle: "Publish this experience?",
        confirmBody: "It will go live immediately.",
      }),
    ).toEqual({
      submitLabel: "Publish",
      confirmTitle: "Publish this experience?",
      confirmBody: "It will go live immediately.",
    });
  });
});

// ── shouldShowTripperNoteField ───────────────────────────────────────────────
describe("shouldShowTripperNoteField", () => {
  it("shows the tripper-note field for tripper mode (regression)", () => {
    expect(shouldShowTripperNoteField("tripper")).toBe(true);
  });

  it("hides the tripper-note field for adminCreate mode", () => {
    expect(shouldShowTripperNoteField("adminCreate")).toBe(false);
  });

  it("shows the tripper-note field for adminEdit mode (only adminCreate hides it)", () => {
    expect(shouldShowTripperNoteField("adminEdit")).toBe(true);
  });
});
