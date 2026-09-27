import { describe, it, expect } from "vitest";
import {
  buildBlogSubmitPayload,
  getBlogLocaleDraft,
  pickBlogContentDraft,
  getBlogCompleteness,
  isBlogTabComplete,
  isBlogTabEligible,
  mapBlogPostToDraft,
} from "../blog-form";
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
  travelType: [],
  excuseKey: [],
  level: "",
  label: "",
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

  it("only shows FAQ completion for filled entries; gallery has no required fields", () => {
    expect(isBlogTabComplete("faq", baseDraft)).toBe(false);
    expect(isBlogTabComplete("faq", { ...baseDraft, faq: [] })).toBe(false);
    expect(
      isBlogTabComplete("faq", {
        ...baseDraft,
        faq: [{ question: "When?", answer: "Tomorrow" }],
      }),
    ).toBe(true);
    expect(
      isBlogTabComplete("faq", {
        ...baseDraft,
        faq: [{ question: "When?", answer: " " }],
      }),
    ).toBe(false);
    expect(isBlogTabComplete("gallery", baseDraft)).toBe(true);
  });

  it("returns false for an unknown tab id", () => {
    expect(isBlogTabComplete("nonexistent", baseDraft)).toBe(false);
  });
});

describe("isBlogTabEligible", () => {
  it.each(
    [
      [],
      [{ question: "", answer: "" }],
      [{ question: "When?", answer: "" }],
      [{ question: "", answer: "Tomorrow" }],
      [{ question: "When?", answer: "Tomorrow" }],
    ].map((faq) => ({ faq })),
  )(
    "allows optional FAQ content without adding backend restrictions: $faq",
    ({ faq }) => {
      expect(isBlogTabEligible("faq", { ...baseDraft, faq })).toBe(true);
    },
  );

  it("preserves required tab checks and rejects unknown tabs", () => {
    expect(isBlogTabEligible("general", baseDraft)).toBe(true);
    expect(isBlogTabEligible("general", { ...baseDraft, title: " " })).toBe(
      false,
    );
    expect(isBlogTabEligible("general", { ...baseDraft, coverUrl: " " })).toBe(
      false,
    );
    expect(isBlogTabEligible("content", baseDraft)).toBe(false);
    expect(
      isBlogTabEligible("content", { ...baseDraft, featureText: "A quote" }),
    ).toBe(true);
    expect(isBlogTabEligible("gallery", baseDraft)).toBe(true);
    expect(isBlogTabEligible("unknown", baseDraft)).toBe(false);
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

  it("round-trips travelType/excuseKey arrays from a fetched BlogPost into the draft", () => {
    const post: Partial<BlogPost> = {
      status: "draft",
      title: "My Trip",
      blocks: [],
      travelType: ["solo", "couple"],
      excuseKey: ["x", "y"],
    };
    const draft = mapBlogPostToDraft(post);
    expect(draft.travelType).toEqual(["solo", "couple"]);
    expect(draft.excuseKey).toEqual(["x", "y"]);
  });

  it("defaults travelType/excuseKey to [] when absent on the fetched post", () => {
    const post: Partial<BlogPost> = { status: "draft", title: "My Trip", blocks: [] };
    const draft = mapBlogPostToDraft(post);
    expect(draft.travelType).toEqual([]);
    expect(draft.excuseKey).toEqual([]);
  });

  it("maps a set level from the fetched post into the draft", () => {
    const post: Partial<BlogPost> = {
      status: "draft",
      title: "My Trip",
      blocks: [],
      level: "xsed",
    };
    const draft = mapBlogPostToDraft(post);
    expect(draft.level).toBe("xsed");
  });

  it("defaults level to '' when absent or null on the fetched post", () => {
    const post: Partial<BlogPost> = { status: "draft", title: "My Trip", blocks: [], level: null };
    const draft = mapBlogPostToDraft(post);
    expect(draft.level).toBe("");
  });
});

describe("buildBlogSubmitPayload", () => {
  it("passes travelType/excuseKey arrays through to the submit payload unchanged", () => {
    const draft: BlogFormDraft = {
      ...baseDraft,
      travelType: ["solo", "couple"],
      excuseKey: ["x", "y"],
    };
    const payload = buildBlogSubmitPayload(draft);
    expect(payload.travelType).toEqual(["solo", "couple"]);
    expect(payload.excuseKey).toEqual(["x", "y"]);
  });

  it("round-trips travelType/excuseKey through buildBlogSubmitPayload -> mapBlogPostToDraft", () => {
    const draft: BlogFormDraft = {
      ...baseDraft,
      travelType: ["solo", "couple"],
      excuseKey: ["x", "y"],
    };
    const payload = buildBlogSubmitPayload(draft);
    const roundTripped = mapBlogPostToDraft(payload as unknown as Partial<BlogPost>);
    expect(roundTripped.travelType).toEqual(["solo", "couple"]);
    expect(roundTripped.excuseKey).toEqual(["x", "y"]);
  });

  it("normalizes a raw Prisma (uppercase) status so server pages map like the API", () => {
    const post = { status: "PUBLISHED", title: "T", blocks: [] } as unknown as Partial<BlogPost>;
    expect(mapBlogPostToDraft(post).status).toBe("published");
  });

  it("maps label between the fetched post, the draft and the submit payload", () => {
    const post: Partial<BlogPost> = { status: "draft", title: "T", blocks: [], label: "XSED Nº1 (AR)" };
    expect(mapBlogPostToDraft(post).label).toBe("XSED Nº1 (AR)");
    expect(mapBlogPostToDraft({ ...post, label: null }).label).toBe("");
    expect(buildBlogSubmitPayload({ ...baseDraft, label: "XSED Nº1 (AR)" }).label).toBe("XSED Nº1 (AR)");
    expect(buildBlogSubmitPayload({ ...baseDraft, label: "" }).label).toBeNull();
  });

  it("converts a set level to its string value, and an empty level to null", () => {
    expect(buildBlogSubmitPayload({ ...baseDraft, level: "xsed" }).level).toBe("xsed");
    expect(buildBlogSubmitPayload({ ...baseDraft, level: "" }).level).toBeNull();
  });

  it("round-trips level through buildBlogSubmitPayload -> mapBlogPostToDraft", () => {
    const draft: BlogFormDraft = { ...baseDraft, level: "essenza" };
    const payload = buildBlogSubmitPayload(draft);
    const roundTripped = mapBlogPostToDraft(payload as unknown as Partial<BlogPost>);
    expect(roundTripped.level).toBe("essenza");
  });
});


describe("bilingual blog round-trip", () => {
  it("does not copy Spanish into an empty English draft and shares media", () => {
    const draft = mapBlogPostToDraft({ title: "Español", content: "<p>Hola</p>", coverUrl: "/cover.jpg", blocks: [{ type: "image", url: "/shared.jpg", caption: "Español" }] });
    expect(getBlogLocaleDraft(draft, "en")).toMatchObject({ title: "", subtitle: "", coverUrl: "/cover.jpg", gallery: ["/shared.jpg"] });
    expect(getBlogLocaleDraft(draft, "en").sections).toEqual([{ title: "", description: "" }]);
  });
  it("preserves exact legacy Spanish HTML, FAQ, SEO and captions when saving English", () => {
    const post: Partial<BlogPost> = { title: "Español", tagline: "Bajada", content: "  <p>Contenido legacy</p>  ", blocks: [{ type: "paragraph", text: "Legacy" }, { type: "image", url: "/shared.jpg", caption: "Español" }], faq: { items: [{ question: "¿Qué?", answer: "Viajar" }] }, seo: { title: "SEO español" } };
    const draft = mapBlogPostToDraft(post);
    draft.english = { ...pickBlogContentDraft(getBlogLocaleDraft(draft, "en")), title: "English", sections: [{ title: "Heading", description: "<p>English</p>" }] };
    const payload = buildBlogSubmitPayload(draft);
    expect(payload).toMatchObject(post);
    expect(payload).toMatchObject({ translations: { en: { title: "English", blocks: [{ type: "section", title: "Heading", description: "<p>English</p>" }] } } });
    expect(mapBlogPostToDraft(payload as Partial<BlogPost>).english?.title).toBe("English");
  });
  it("preserves Spanish block ordering and duplicate URLs with distinct captions verbatim", () => {
    const post: Partial<BlogPost> = { title: "Español", subtitle: "  Subtítulo  ", content: "<p>Texto original</p>", blocks: [
      { type: "image", url: "/same.jpg", caption: "Primera" },
      { type: "section", title: "Sección", description: "<p>Texto original</p>" },
      { type: "image", url: "/same.jpg", caption: "Segunda" },
    ] };
    const draft = mapBlogPostToDraft(post);
    draft.english = { ...pickBlogContentDraft(getBlogLocaleDraft(draft, "en")), title: "English" };
    const payload = buildBlogSubmitPayload(draft);
    expect(payload.blocks).toEqual(post.blocks);
    expect(payload.content).toBe(post.content);
    expect(payload.subtitle).toBe(post.subtitle);
  });
  it("round-trips partial English and clears without changing Spanish", () => {
    const draft = mapBlogPostToDraft({ title: "Español", translations: { en: { title: "Work in progress" } } });
    expect(buildBlogSubmitPayload(draft)).toMatchObject({ title: "Español", translations: { en: { title: "Work in progress", content: null } } });
    expect(buildBlogSubmitPayload({ ...draft, english: null })).toMatchObject({ title: "Español", translations: null });
  });
});
