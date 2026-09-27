import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "owner" } })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/randomtrip-user", () => ({
  getRandomtripUserId: vi.fn(async () => "owner"),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    blogPost: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
import {
  getBlogTeaserPosts,
  getRecentPublishedBlogs,
  getTripperPublishedBlogs,
} from "@/lib/db/tripper-queries";
import { getPublicXsedBlogDropEntries } from "@/lib/data/xsed";
import { prisma } from "@/lib/prisma";
import { POST, GET as getManagementList } from "@/app/api/tripper/blogs/route";
import {
  PATCH,
  GET as getManagementDetail,
} from "@/app/api/tripper/blogs/[id]/route";
import { PATCH as patchCopy } from "@/app/api/admin/blogs/[id]/edit-copy/route";
import { GET as getPublicList } from "@/app/api/blogs/route";
import { GET as getPublicDetail } from "@/app/api/blogs/[id]/route";
import {
  computeChangedFields,
  overwriteOriginalWithCopy,
} from "../changed-fields";

const en = { title: "English", content: "<p>Article</p>" };
const base = {
  id: "post",
  slug: "original-slug",
  authorId: "owner",
  source: "TRIPPER",
  title: "Español",
  subtitle: "Subtítulo",
  content: "<p>Original</p>",
  tagline: "Bajada",
  coverUrl: "/shared.jpg",
  blocks: [],
  faq: null,
  seo: { title: "SEO Español" },
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
});

describe("localized write boundary", () => {
  it("saves partial translation drafts but ignores forged readiness", async () => {
    const response = await POST(
      request(
        "/api/tripper/blogs",
        {
          title: "Español",
          translations: { en: { title: "Draft", ready: true } },
        },
        "POST",
      ),
    );
    expect(response.status).toBe(201);
    expect(
      vi.mocked(prisma.blogPost.create).mock.calls[0][0].data,
    ).toMatchObject({
      title: "Español",
      translations: { en: { title: "Draft", ready: false } },
    });
  });
  it.each(["TRIPPER", "RANDOMTRIP"])(
    "English-only %s edits preserve Spanish and slug and honor review semantics",
    async (source) => {
      vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
        ...base,
        source,
      } as never);
      const response = await PATCH(
        request("/api/tripper/blogs/post", { translations: { en } }),
        params,
      );
      expect(response.status).toBe(200);
      const data = vi.mocked(prisma.blogPost.update).mock.calls[0][0].data;
      expect(data).toMatchObject({
        translations: { en: { ...en, ready: true } },
      });
      expect(data).not.toHaveProperty("title");
      expect(data).not.toHaveProperty("slug");
      expect(data).not.toHaveProperty("content");
      if (source === "TRIPPER")
        expect(data).toMatchObject({ status: "DRAFT", isActive: false });
      else expect(data).not.toHaveProperty("status");
    },
  );
  it("preserves omitted English, recognizes no-op and supports explicit clear", async () => {
    const translations = { en: { ...en, ready: true } };
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      translations,
    } as never);
    await PATCH(request("/api/tripper/blogs/post", { isActive: true }), params);
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[0][0].data,
    ).not.toHaveProperty("translations");
    await PATCH(request("/api/tripper/blogs/post", { translations }), params);
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[1][0].data,
    ).not.toHaveProperty("status");
    await PATCH(
      request("/api/tripper/blogs/post", { translations: null }),
      params,
    );
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[2][0].data,
    ).toMatchObject({ translations: Prisma.DbNull, status: "DRAFT" });
  });
  it("does not unpublish a no-op English edit after JSONB reorders object keys", async () => {
    const stored = {
      en: { ready: true, content: en.content, title: en.title },
    };
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      translations: stored,
    } as never);
    await PATCH(
      request("/api/tripper/blogs/post", { translations: { en } }),
      params,
    );
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[0][0].data,
    ).not.toHaveProperty("status");
    expect(
      computeChangedFields(
        { translations: stored },
        { translations: { en: { ...en, ready: true } } },
      ),
    ).toEqual([]);
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
  it("validates and persists review-copy translations and approves both languages", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "owner",
      roles: ["ADMIN"],
    } as never);
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
      ...base,
      isReviewCopy: true,
    } as never);
    const translations = { en: { ...en, ready: true } };
    const response = await patchCopy(
      request("/api/admin/blogs/post/edit-copy", { translations }),
      params,
    );
    expect(response.status).toBe(200);
    expect(
      vi.mocked(prisma.blogPost.update).mock.calls[0][0].data,
    ).toMatchObject({ translations });
    expect(computeChangedFields({ ...base, translations }, base)).toEqual([
      "translations",
    ]);
    const tx = {
      blogPost: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ ...base, translations })
          .mockResolvedValueOnce(base),
        update: vi.fn(),
      },
    };
    await overwriteOriginalWithCopy(tx, "original", "copy");
    expect(tx.blogPost.update.mock.calls[0][0].data).toMatchObject({
      title: "Español",
      translations,
      status: "PUBLISHED",
    });
  });
});

describe("locale-aware reads", () => {
  it("filters English readiness before pagination/count and never emits Spanish optional copy", async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      base,
      {
        ...base,
        id: "translated",
        translations: { en: { ...en, ready: true } },
      },
    ] as never);
    const response = await getPublicList(
      request("/api/blogs?locale=en&limit=1"),
    );
    const data = await response.json();
    expect(
      vi.mocked(prisma.blogPost.findMany).mock.calls[0][0]?.where,
    ).toMatchObject({
      isActive: true,
      isReviewCopy: false,
      status: "PUBLISHED",
      translations: { path: ["en", "ready"], equals: true },
    });
    expect(data.pagination).toMatchObject({
      total: 1,
      totalPages: 1,
      hasMore: false,
    });
    expect(data.blogs).toHaveLength(1);
    expect(data.blogs[0]).toMatchObject({
      title: "English",
      subtitle: "",
      tagline: "",
    });
  });
  it("returns EN 404 for Spanish-only details and translated detail without Spanish SEO/FAQ", async () => {
    expect(
      (await getPublicDetail(request("/api/blogs/post?locale=en"), params))
        .status,
    ).toBe(404);
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      translations: { en: { ...en, ready: true } },
    } as never);
    const response = await getPublicDetail(
      request("/api/blogs/post?locale=en"),
      params,
    );
    expect((await response.json()).blog).toMatchObject({
      title: "English",
      content: en.content,
      seo: null,
      faq: null,
      subtitle: "",
    });
  });
  it("keeps raw management lists/details discoverable on English UI", async () => {
    const list = await getManagementList(
      request("/api/tripper/blogs?locale=en"),
    );
    expect((await list.json()).blogs[0].title).toBe("Español");
    expect(
      vi.mocked(prisma.blogPost.findMany).mock.calls[0][0]?.where,
    ).not.toHaveProperty("translations");
    const translations = { en: { ...en, ready: true } };
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      translations,
    } as never);
    const detail = await getManagementDetail(
      request("/api/tripper/blogs/post?locale=en"),
      params,
    );
    expect((await detail.json()).blog).toMatchObject({
      title: "Español",
      translations,
    });
  });
});

describe("server-side cards and XSED archive", () => {
  it("queries translated readiness before every teaser limit and resolves all card titles", async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      { ...base, translations: { en: { ...en, ready: true } } },
    ] as never);
    const home = await getRecentPublishedBlogs(5, "en");
    const profile = await getTripperPublishedBlogs("owner", 6, "en");
    const teaser = await getBlogTeaserPosts(3, "en");
    expect([home[0].title, profile[0].title, teaser[0].title]).toEqual([
      "English",
      "English",
      "English",
    ]);
    for (const [query] of vi.mocked(prisma.blogPost.findMany).mock.calls) {
      expect(query?.where?.translations).toEqual({
        path: ["en", "ready"],
        equals: true,
      });
      expect(query?.take).toBeGreaterThan(0);
    }
  });
  it("omits untranslated XSED archive posts before pagination and hasMore", async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      base,
      { ...base, id: "en", translations: { en: { ...en, ready: true } } },
    ] as never);
    const result = await getPublicXsedBlogDropEntries("en", 0, 1);
    expect(result.drops).toHaveLength(1);
    expect(result.drops[0].title).toBe("English");
    expect(result.hasMore).toBe(false);
    expect(
      vi.mocked(prisma.blogPost.findMany).mock.calls[0][0]?.where,
    ).toMatchObject({
      level: "xsed",
      translations: { path: ["en", "ready"], equals: true },
    });
  });
});
