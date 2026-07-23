import { describe, it, expect } from "vitest";
import { getBlogCompleteness, isBlogTabComplete, mapBlogPostToDraft } from "../blog-form";
import type { BlogFormDraft, BlogPost } from "@/types/blog";

const baseDraft: BlogFormDraft = {
  status: "draft",
  title: "My Trip",
  subtitle: "",
  coverUrl: "https://example.com/cover.jpg",
  featureText: "",
  featureAttribution: "",
  sections: [{ title: "", description: "" }],
  faq: [{ question: "", answer: "" }],
  gallery: [],
  tripperNote: null,
};

describe("getBlogCompleteness", () => {
  const complete = {
    title: "My Trip",
    coverUrl: "https://example.com/cover.jpg",
    content: "<p>Some content</p>",
  };

  it("is complete when title, coverUrl, and content are all present", () => {
    const { complete: isComplete, missing } = getBlogCompleteness(complete);
    expect(isComplete).toBe(true);
    expect(missing).toEqual([]);
  });

  it("is incomplete when title is missing", () => {
    const { complete: isComplete, missing } = getBlogCompleteness({
      ...complete,
      title: "",
    });
    expect(isComplete).toBe(false);
    expect(missing).toContain("title");
  });

  it("is incomplete when coverUrl is missing", () => {
    const { complete: isComplete, missing } = getBlogCompleteness({
      ...complete,
      coverUrl: "",
    });
    expect(isComplete).toBe(false);
    expect(missing).toContain("coverUrl");
  });

  it("is incomplete when content is missing", () => {
    const { complete: isComplete, missing } = getBlogCompleteness({
      ...complete,
      content: "",
    });
    expect(isComplete).toBe(false);
    expect(missing).toContain("content");
  });

  it("treats null/undefined content as missing", () => {
    const { complete: isComplete, missing } = getBlogCompleteness({
      ...complete,
      content: null,
    });
    expect(isComplete).toBe(false);
    expect(missing).toContain("content");
  });

  it("reports all missing fields at once", () => {
    const { complete: isComplete, missing } = getBlogCompleteness({
      title: "",
      coverUrl: "",
      content: "",
    });
    expect(isComplete).toBe(false);
    expect(missing).toEqual(["title", "coverUrl", "content"]);
  });
});

describe("isBlogTabComplete", () => {
  it("'general' requires title and coverUrl only", () => {
    expect(isBlogTabComplete("general", baseDraft)).toBe(true);
    expect(isBlogTabComplete("general", { ...baseDraft, title: "" })).toBe(false);
    expect(isBlogTabComplete("general", { ...baseDraft, coverUrl: "" })).toBe(false);
  });

  it("'content' is NOT complete with the default untouched section (empty title and description)", () => {
    expect(isBlogTabComplete("content", baseDraft)).toBe(false);
  });

  it("'content' is complete once at least one section has a title or description filled — this is what buildBlogSubmitPayload turns into the submitted content", () => {
    expect(
      isBlogTabComplete("content", {
        ...baseDraft,
        sections: [{ title: "Day one", description: "" }],
      }),
    ).toBe(true);
    expect(
      isBlogTabComplete("content", {
        ...baseDraft,
        sections: [{ title: "", description: "<p>Something</p>" }],
      }),
    ).toBe(true);
  });

  it("'content' is complete with only a Feature Quote filled and no sections — buildBlogSubmitPayload derives content from both", () => {
    expect(
      isBlogTabComplete("content", {
        ...baseDraft,
        featureText: "The road less traveled.",
      }),
    ).toBe(true);
  });

  it("'faq' and 'gallery' are vacuously complete — no required fields", () => {
    expect(isBlogTabComplete("faq", baseDraft)).toBe(true);
    expect(isBlogTabComplete("gallery", baseDraft)).toBe(true);
  });

  it("returns false for an unknown tab id", () => {
    expect(isBlogTabComplete("nonexistent", baseDraft)).toBe(false);
  });
});

describe("mapBlogPostToDraft", () => {
  it("does NOT duplicate the feature quote into a phantom section for a quote-only post (has blocks, zero sections)", () => {
    const post: Partial<BlogPost> = {
      status: "draft",
      title: "My Trip",
      blocks: [{ type: "quote", text: "The road less traveled.", cite: "Frost" }],
      content: "<blockquote>The road less traveled.<cite>— Frost</cite></blockquote>",
    };
    const draft = mapBlogPostToDraft(post);
    expect(draft.featureText).toBe("The road less traveled.");
    expect(draft.sections).toEqual([]);
  });

  it("still applies the legacy-content fallback for a genuinely pre-migration post (no blocks at all)", () => {
    const post: Partial<BlogPost> = {
      status: "draft",
      title: "Old Post",
      blocks: [],
      content: "<p>Legacy free-text body</p>",
    };
    const draft = mapBlogPostToDraft(post);
    expect(draft.featureText).toBe("");
    expect(draft.sections).toEqual([
      { title: "", description: "<p>Legacy free-text body</p>" },
    ]);
  });

  it("maps real section blocks normally, ignoring post.content entirely", () => {
    const post: Partial<BlogPost> = {
      status: "draft",
      title: "My Trip",
      blocks: [{ type: "section", title: "Day 1", description: "<p>Arrival</p>" }],
      content: "<h2>Day 1</h2><p>Arrival</p>",
    };
    const draft = mapBlogPostToDraft(post);
    expect(draft.sections).toEqual([{ title: "Day 1", description: "<p>Arrival</p>" }]);
  });
});
