import { describe, expect, it } from "vitest";
import { isEnglishBlogReady } from "../content-locale";
import {
  findMediaMismatch,
  hasBlogArticleContent,
  isBlogTranslationComplete,
} from "../translation-completeness";
import type { BlogTranslationContent } from "@/types/blog";

const article = { title: "Title", content: "<p>Article</p>" };

describe("isBlogTranslationComplete", () => {
  it("requires a title and real article content", () => {
    expect(isBlogTranslationComplete(article)).toBe(true);
    expect(isBlogTranslationComplete({ ...article, title: "  " })).toBe(false);
    expect(isBlogTranslationComplete({ ...article, content: null })).toBe(false);
    expect(
      isBlogTranslationComplete({ ...article, content: "<p>&nbsp; </p>" }),
    ).toBe(false);
    expect(isBlogTranslationComplete(null)).toBe(false);
    expect(isBlogTranslationComplete(undefined)).toBe(false);
  });

  it("accepts media-only HTML as article content", () => {
    expect(
      isBlogTranslationComplete({
        title: "Photo essay",
        content: '<p><img src="/a.jpg"></p>',
      }),
    ).toBe(true);
  });

  it("rejects blank structural sections even when flattened HTML is nonempty", () => {
    expect(
      isBlogTranslationComplete({
        ...article,
        blocks: [{ type: "section", title: "", description: "<p><br></p>" }],
      }),
    ).toBe(false);
    expect(
      isBlogTranslationComplete({
        ...article,
        blocks: [
          { type: "section", title: "", description: "<p><br></p>" },
          { type: "quote", text: "A quote" },
        ],
      }),
    ).toBe(true);
    expect(
      isBlogTranslationComplete({
        ...article,
        blocks: [{ type: "section", title: "Day 1", description: "" }],
      }),
    ).toBe(true);
  });

  it("allows full blocks with media alongside text", () => {
    expect(
      isBlogTranslationComplete({
        ...article,
        blocks: [
          { type: "section", title: "Day 1", description: "<p>Hi</p>" },
          { type: "image", url: "/a.jpg", caption: "Caption" },
          { type: "video", url: "/v.mp4" },
          { type: "embed", provider: "youtube", url: "https://y/1", title: "T" },
        ],
      }),
    ).toBe(true);
  });

  it("matches the legacy English readiness for every locale-agnostic case", () => {
    const cases: BlogTranslationContent[] = [
      article,
      { ...article, title: "" },
      { ...article, content: "<p>​</p>" },
      {
        ...article,
        blocks: [{ type: "section", title: "", description: "<p><br></p>" }],
      },
      {
        ...article,
        blocks: [
          { type: "section", title: "", description: "" },
          { type: "quote", text: "  " },
        ],
      },
    ];
    for (const copy of cases) {
      expect(isBlogTranslationComplete(copy)).toBe(isEnglishBlogReady(copy));
    }
  });

  it("keeps hasBlogArticleContent behavior", () => {
    expect(hasBlogArticleContent("<p>&nbsp;</p>")).toBe(false);
    expect(hasBlogArticleContent("<p>x</p>")).toBe(true);
    expect(hasBlogArticleContent('<iframe src="https://x"></iframe>')).toBe(true);
    expect(hasBlogArticleContent(undefined)).toBe(false);
  });
});

describe("findMediaMismatch", () => {
  const source: BlogTranslationContent = {
    title: "Fuente",
    blocks: [
      { type: "paragraph", text: "x" },
      { type: "image", url: "/a.jpg", caption: "Uno" },
      { type: "video", url: "/v.mp4" },
      { type: "embed", provider: "youtube", url: "https://y/1" },
    ],
  };

  it("reports nothing when the target carries the same media", () => {
    const target: BlogTranslationContent = {
      title: "Target",
      blocks: [
        { type: "embed", provider: "youtube", url: "https://y/1", title: "T" },
        { type: "image", url: "/a.jpg", caption: "One" },
        { type: "video", url: "/v.mp4" },
      ],
    };
    expect(findMediaMismatch(source, target)).toEqual({
      missing: [],
      extra: [],
    });
  });

  it("reports media missing from and extra in the target", () => {
    const target: BlogTranslationContent = {
      title: "Target",
      blocks: [
        { type: "image", url: "/a.jpg" },
        { type: "image", url: "/b.jpg" },
      ],
    };
    expect(findMediaMismatch(source, target)).toEqual({
      missing: ["/v.mp4", "https://y/1"],
      extra: ["/b.jpg"],
    });
  });

  it("treats absent blocks as no media", () => {
    expect(findMediaMismatch({}, null)).toEqual({
      missing: [],
      extra: [],
    });
    expect(findMediaMismatch(source, {}).missing).toHaveLength(3);
  });
});
