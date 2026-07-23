import { describe, it, expect, vi } from "vitest";
import { resolveBlogFieldPeek, resolveBlogEntryPeek } from "../blog-form-peek";
import type { BlogFormDraft } from "@/types/blog";

const baseDraft: BlogFormDraft = {
  status: "pending_tripper_review",
  title: "Original title",
  subtitle: "Original subtitle",
  coverUrl: "https://example.com/original-cover.jpg",
  featureText: "Original feature quote",
  featureAttribution: "Original attribution",
  sections: [{ title: "Original section", description: "Original body" }],
  faq: [{ question: "Original question?", answer: "Original answer" }],
  gallery: [],
  tripperNote: null,
};

const copy = {
  peekShowOriginal: "Click to see original content",
  peekShowSuggestion: "Click to see admin's suggestion",
  noContent: "(no content)",
};

describe("resolveBlogFieldPeek", () => {
  it("returns undefined when the field is not in changedFieldSet", () => {
    const result = resolveBlogFieldPeek({
      field: "title",
      changedFieldSet: new Set(["subtitle"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when originalDraft is undefined", () => {
    const result = resolveBlogFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: undefined,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns a FieldPeek when the field is changed and originalDraft is present (1:1 field name)", () => {
    const onToggle = vi.fn();
    const result = resolveBlogFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle,
      copy,
    });
    expect(result).toEqual({
      originalValue: "Original title",
      active: false,
      onToggle,
      tooltip: {
        showOriginal: copy.peekShowOriginal,
        showSuggestion: copy.peekShowSuggestion,
      },
      emptyLabel: copy.noContent,
    });
  });

  it("uses diffKey for eligibility when the form field maps to a different server column (featureText -> blocks)", () => {
    const eligibleViaBlocks = resolveBlogFieldPeek({
      field: "featureText",
      diffKey: "blocks",
      changedFieldSet: new Set(["blocks"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(eligibleViaBlocks?.originalValue).toBe("Original feature quote");

    const notEligible = resolveBlogFieldPeek({
      field: "featureText",
      diffKey: "blocks",
      changedFieldSet: new Set(["title"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(notEligible).toBeUndefined();
  });

  it("marks active true when the field is in peekedFields", () => {
    const result = resolveBlogFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: baseDraft,
      peekedFields: new Set(["title"]),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.active).toBe(true);
  });

  it("yields an empty originalValue (placeholder-driving) when the original field was empty", () => {
    const result = resolveBlogFieldPeek({
      field: "subtitle",
      changedFieldSet: new Set(["subtitle"]),
      originalDraft: { ...baseDraft, subtitle: "" },
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.originalValue).toBe("");
  });
});

const originalFaqEntry = { question: "Original question?", answer: "Original answer" };

describe("resolveBlogEntryPeek", () => {
  it("returns undefined when the array diffKey is not in changedFieldSet", () => {
    const result = resolveBlogEntryPeek({
      diffKey: "faq",
      changedFieldSet: new Set(["title"]),
      originalEntry: originalFaqEntry,
      entryKey: "question",
      currentValue: "Edited question?",
      peekKey: "faq.0.question",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when the entry has no original counterpart (admin added it)", () => {
    const result = resolveBlogEntryPeek<{ question: string; answer: string }>({
      diffKey: "faq",
      changedFieldSet: new Set(["faq"]),
      originalEntry: undefined,
      entryKey: "question",
      currentValue: "New question?",
      peekKey: "faq.1.question",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when this specific sub-field did not change", () => {
    const result = resolveBlogEntryPeek({
      diffKey: "faq",
      changedFieldSet: new Set(["faq"]),
      originalEntry: originalFaqEntry,
      entryKey: "question",
      currentValue: "Original question?",
      peekKey: "faq.0.question",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns a FieldPeek when the array changed and this sub-field differs", () => {
    const onToggle = vi.fn();
    const result = resolveBlogEntryPeek({
      diffKey: "faq",
      changedFieldSet: new Set(["faq"]),
      originalEntry: originalFaqEntry,
      entryKey: "question",
      currentValue: "Edited question?",
      peekKey: "faq.0.question",
      peekedFields: new Set(),
      onToggle,
      copy,
    });
    expect(result).toEqual({
      originalValue: "Original question?",
      active: false,
      onToggle,
      tooltip: {
        showOriginal: copy.peekShowOriginal,
        showSuggestion: copy.peekShowSuggestion,
      },
      emptyLabel: copy.noContent,
    });
  });

  it("marks active true when the composite peekKey is in peekedFields", () => {
    const result = resolveBlogEntryPeek({
      diffKey: "faq",
      changedFieldSet: new Set(["faq"]),
      originalEntry: originalFaqEntry,
      entryKey: "question",
      currentValue: "Edited question?",
      peekKey: "faq.0.question",
      peekedFields: new Set(["faq.0.question"]),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.active).toBe(true);
  });
});
