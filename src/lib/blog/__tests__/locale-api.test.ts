import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "owner" } })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/randomtrip-user", () => ({
  getRandomtripUserId: vi.fn(async () => "owner"),
}));
vi.mock("@/lib/prisma", () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    blogPost: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});
vi.mock("@/lib/blog/blogRepository", () => ({
  syncTranslationsFromLegacy: vi.fn(),
  writeTranslationsFromEditor: vi.fn().mockResolvedValue({}),
  getForEditor: vi.fn(),
  overwriteTranslationsFromCopy: vi.fn(),
}));
import { prisma } from "@/lib/prisma";
import {
  getForEditor,
  overwriteTranslationsFromCopy,
  writeTranslationsFromEditor,
} from "@/lib/blog/blogRepository";
import { POST, GET as getManagementList } from "@/app/api/tripper/blogs/route";
import {
  PATCH,
  GET as getManagementDetail,
} from "@/app/api/tripper/blogs/[id]/route";
import { PATCH as patchCopy } from "@/app/api/admin/blogs/[id]/edit-copy/route";
import {
  computeChangedFields,
  overwriteOriginalWithCopy,
} from "../changed-fields";

const ES = { title: "Español", content: "<p>Original</p>" };
const EN = { title: "English", content: "<p>Article</p>" };
const base = {
  id: "post",
  slug: "original-slug",
  authorId: "owner",
  source: "TRIPPER",
  sourceLocale: "es",
  title: "Español",
  subtitle: "Subtítulo",
  content: "<p>Original</p>",
  tagline: "Bajada",
  coverUrl: "/shared.jpg",
  blocks: [],
  faq: null,
  seo: { title: "SEO Español" },
  translationRows: [
    {
      locale: "es",
      title: "Español",
      subtitle: "Subtítulo",
      tagline: "Bajada",
      content: "<p>Original</p>",
      blocks: [],
      faq: null,
      seo: { title: "SEO Español" },
      slug: "original-slug",
      isComplete: true,
    },
  ],
  tags: [],
  travelType: [],
  excuseKey: [],
  isReviewCopy: false,
  status: "PUBLISHED",
  format: "ARTICLE",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
  author: { id: "owner", name: "Person", tripperSlug: "person" },
};
const editorPost = {
  id: "post",
  sourceLocale: "es",
  translations: {
    es: { ...ES, slug: "espanol", isComplete: true },
    en: { ...EN, slug: "english", isComplete: true },
  },
};
const params = { params: Promise.resolve({ id: "post" }) };
function request(path: string, body?: unknown, method = "PATCH") {
  return new NextRequest(
    `http://localhost${path}`,
    body === undefined
      ? undefined
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "owner",
    roles: ["TRIPPER"],
  } as never);
  vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(base as never);
  vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.blogPost.findMany).mockResolvedValue([base] as never);
  vi.mocked(prisma.blogPost.count).mockResolvedValue(1);
  vi.mocked(prisma.blogPost.update).mockImplementation(
    ({ data }) => Promise.resolve({ ...base, ...data }) as never,
  );
  vi.mocked(prisma.blogPost.create).mockImplementation(
    ({ data }) => Promise.resolve({ ...base, ...data }) as never,
  );
  vi.mocked(getForEditor).mockResolvedValue(editorPost as never);
  vi.mocked(writeTranslationsFromEditor).mockResolvedValue({
    es: { ...ES, slug: "espanol", isComplete: true },
    en: { ...EN, slug: "english", isComplete: true },
  } as never);
});

describe("localized write boundary", () => {
  it("writes rows and does not write dropped BlogPost columns", async () => {
    await POST(
      request("/api/tripper/blogs", { sourceLocale: "es", translations: { es: ES, en: EN } }, "POST"),
    );
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      status: "DRAFT",
    } as never);
    await PATCH(
      request("/api/tripper/blogs/post", { sourceLocale: "es", translations: { es: ES, en: EN } }),
      params,
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "owner",
      roles: ["ADMIN"],
    } as never);
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
      ...base,
      isReviewCopy: true,
    } as never);
    await patchCopy(
      request("/api/admin/blogs/post/edit-copy", {
        sourceLocale: "es",
        translations: { es: ES, en: EN },
      }),
      params,
    );

    expect(vi.mocked(prisma.blogPost.create).mock.calls[0][0].data).toMatchObject({
      sourceLocale: "es",
    });
    expect(vi.mocked(prisma.blogPost.create).mock.calls[0][0].data).not.toHaveProperty("title");
    expect(writeTranslationsFromEditor).toHaveBeenCalledTimes(3);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("saves an incomplete non-source locale", async () => {
    const response = await POST(
      request(
        "/api/tripper/blogs",
        { sourceLocale: "es", translations: { es: ES, en: { title: "Draft" } } },
        "POST",
      ),
    );
    expect(response.status).toBe(201);
    expect(vi.mocked(writeTranslationsFromEditor).mock.calls[0][2]).toMatchObject({
      es: ES,
      en: { title: "Draft" },
    });
  });

  it.each(["TRIPPER", "RANDOMTRIP"])(
    "English-only %s edits keep Spanish rows and honor review semantics",
    async (source) => {
      vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
        ...base,
        source,
      } as never);
      const response = await PATCH(
        request("/api/tripper/blogs/post", {
          translations: { es: ES, en: EN },
        }),
        params,
      );
      expect(response.status).toBe(200);
      const data = vi.mocked(prisma.blogPost.update).mock.calls[0][0].data;
      expect(data).not.toHaveProperty("title");
      expect(data).not.toHaveProperty("translations");
      expect(writeTranslationsFromEditor).toHaveBeenCalled();
      if (source === "TRIPPER")
        expect(data).toMatchObject({ status: "DRAFT", isActive: false });
      else expect(data).not.toHaveProperty("status");
    },
  );

  it("leaves rows untouched when neither translations nor localized fields are sent", async () => {
    await PATCH(request("/api/tripper/blogs/post", { isActive: true }), params);
    expect(writeTranslationsFromEditor).not.toHaveBeenCalled();
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[0][0].data,
    ).not.toHaveProperty("translations");
  });

  it("rejects malformed translated values before writing", async () => {
    const response = await PATCH(
      request("/api/tripper/blogs/post", {
        translations: { en: { title: 12 } },
      }),
      params,
    );
    expect(response.status).toBe(400);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("validates review-copy translations and still overwrites both languages on approve", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "owner",
      roles: ["ADMIN"],
    } as never);
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
      ...base,
      isReviewCopy: true,
    } as never);
    const response = await patchCopy(
      request("/api/admin/blogs/post/edit-copy", {
        translations: { es: ES, en: EN },
      }),
      params,
    );
    expect(response.status).toBe(200);
    expect(writeTranslationsFromEditor).toHaveBeenCalled();
    const esRow = {
      locale: "es",
      title: base.title,
      subtitle: base.subtitle,
      tagline: base.tagline,
      content: base.content,
      blocks: [],
      faq: null,
      seo: base.seo,
      isComplete: true,
    };
    const enRow = { ...esRow, locale: "en", ...EN, subtitle: null, tagline: null, seo: null };
    expect(
      computeChangedFields({ ...base, translations: { en: EN } }, base, {
        copy: [esRow, enRow],
        original: [esRow],
      }),
    ).toEqual(["en.*"]);
    const copy = { ...base, id: "copy", translations: { en: EN } };
    const tx = {
      blogPost: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(copy)
          .mockResolvedValueOnce(base),
        update: vi.fn(),
      },
    };
    await overwriteOriginalWithCopy(tx, "original", "copy");
    expect(overwriteTranslationsFromCopy).toHaveBeenCalledWith(tx, "original", copy, {
      requireCompleteSource: true,
    });
  });
});

describe("locale-aware reads", () => {
  it("flattens the source-locale title on the list and returns the editor shape on detail GET", async () => {
    const list = await getManagementList(
      request("/api/tripper/blogs?locale=en"),
    );
    expect((await list.json()).blogs[0].title).toBe("Español");
    const detail = await getManagementDetail(
      request("/api/tripper/blogs/post?locale=en"),
      params,
    );
    expect(getForEditor).toHaveBeenCalledWith("post");
    expect((await detail.json()).blog).toMatchObject(editorPost);
  });
});
