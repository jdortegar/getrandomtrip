// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  diffTranslationFields,
  planBlogTranslationBackfill,
  runBlogTranslationBackfill,
  type ExistingSlugHistoryRow,
  type ExistingTranslationRow,
  type LegacyBlogPostRow,
} from "../backfill-blog-translations";

vi.mock("dotenv/config", () => {
  throw new Error("Importing a script must not load environment files");
});

const SPANISH_HTML = "<p>Contenido en español</p>";
const ENGLISH_HTML = "<p>English content</p>";

function post(overrides: Partial<LegacyBlogPostRow> = {}): LegacyBlogPostRow {
  return {
    id: "p1",
    slug: "viaje-a-peru",
    title: "Viaje a Perú",
    subtitle: "Sub",
    tagline: null,
    content: SPANISH_HTML,
    blocks: [],
    faq: null,
    seo: null,
    translations: null,
    publishedAt: new Date("2026-01-02T00:00:00Z"),
    isReviewCopy: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const NONE = { translations: [], slugHistory: [] };

describe("planBlogTranslationBackfill", () => {
  it("plans one es row per post from the legacy columns, keeping every block and caption", async () => {
    const blocks = [
      { type: "paragraph", text: "Hola" },
      { type: "image", url: "https://img/1.jpg", caption: "Lima" },
      { type: "embed", provider: "youtube", url: "https://yt/1", title: "Video" },
    ];
    const plan = await planBlogTranslationBackfill(
      [post({ blocks }), post({ id: "p2", slug: "otro", title: "Otro" })],
      NONE,
    );

    const es = plan.translations.filter((row) => row.locale === "es");
    expect(es).toHaveLength(2);
    expect(es[0]).toMatchObject({
      postId: "p1",
      action: "create",
      data: {
        title: "Viaje a Perú",
        subtitle: "Sub",
        tagline: null,
        content: SPANISH_HTML,
        blocks,
      },
    });
    expect(plan.report.posts).toBe(2);
    expect(plan.report.es).toEqual({ planned: 2, existing: 0 });
  });

  it("plans an en row only for valid translations.en, appending Spanish media in order with captions", async () => {
    const blocks = [
      { type: "paragraph", text: "Hola" },
      { type: "image", url: "https://img/1.jpg", caption: "Lima de noche" },
      { type: "section", title: "Día 1", description: "<p>Cusco</p>" },
      { type: "video", url: "https://vid/1.mp4", caption: "Machu Picchu" },
      { type: "embed", provider: "map", url: "https://map/1", title: "Mapa" },
    ];
    const plan = await planBlogTranslationBackfill(
      [
        post({
          blocks,
          translations: {
            en: {
              title: "Trip to Peru",
              content: ENGLISH_HTML,
              blocks: [{ type: "section", title: "Day 1", description: "<p>Cusco</p>" }],
              ready: true,
            },
          },
        }),
        post({ id: "p2", slug: "sin-ingles", title: "Sin inglés" }),
      ],
      NONE,
    );

    const en = plan.translations.filter((row) => row.locale === "en");
    expect(en).toHaveLength(1);
    expect(en[0].postId).toBe("p1");
    expect(en[0].data.title).toBe("Trip to Peru");
    expect(en[0].data.blocks).toEqual([
      { type: "section", title: "Day 1", description: "<p>Cusco</p>" },
      { type: "image", url: "https://img/1.jpg", caption: "Lima de noche" },
      { type: "video", url: "https://vid/1.mp4", caption: "Machu Picchu" },
      { type: "embed", provider: "map", url: "https://map/1", title: "Mapa" },
    ]);
    expect(en[0].data).not.toHaveProperty("ready");
    expect(plan.report.en).toEqual({ planned: 1, existing: 0 });
  });

  it("skips and reports invalid translations JSON without blocking the es row", async () => {
    const plan = await planBlogTranslationBackfill(
      [post({ translations: { en: { title: 42 } } }), post({ id: "p2", slug: "b", title: "B", translations: { fr: {} } })],
      NONE,
    );

    expect(plan.translations.filter((row) => row.locale === "en")).toHaveLength(0);
    expect(plan.translations.filter((row) => row.locale === "es")).toHaveLength(2);
    expect(plan.invalidEnJson.map((entry) => entry.postId)).toEqual(["p1", "p2"]);
    expect(plan.report.invalidEnJson).toBe(2);
  });

  it("recomputes isComplete instead of trusting the legacy ready flag", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({
          translations: { en: { title: "Trip", content: "<p></p>", ready: true } },
        }),
      ],
      NONE,
    );

    const byLocale = Object.fromEntries(plan.translations.map((row) => [row.locale, row]));
    expect(byLocale.es.data.isComplete).toBe(true);
    expect(byLocale.en.data.isComplete).toBe(false);
    expect(plan.report.incomplete).toEqual({ es: 0, en: 1 });
  });

  it("derives each locale's slug from its own title with diacritics folded", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({
          slug: "legacy",
          title: "Perú",
          translations: { en: { title: "Peru Trip", content: ENGLISH_HTML } },
        }),
      ],
      NONE,
    );

    const slugs = Object.fromEntries(plan.translations.map((row) => [row.locale, row.slug]));
    expect(slugs).toEqual({ es: "peru", en: "peru-trip" });
  });

  it("suffixes colliding slugs per locale deterministically by createdAt then id", async () => {
    const posts = [
      post({ id: "b", slug: "b-old", title: "Perú", createdAt: new Date("2026-01-01") }),
      post({ id: "c", slug: "c-old", title: "Peru", createdAt: new Date("2026-02-01") }),
      post({ id: "a", slug: "a-old", title: "Perú", createdAt: new Date("2026-01-01") }),
    ];

    const first = await planBlogTranslationBackfill(posts, NONE);
    const second = await planBlogTranslationBackfill([...posts].reverse(), NONE);

    const slugOf = (plan: typeof first, id: string) =>
      plan.translations.find((row) => row.postId === id && row.locale === "es")?.slug;
    expect([slugOf(first, "a"), slugOf(first, "b"), slugOf(first, "c")]).toEqual([
      "peru",
      "peru-2",
      "peru-3",
    ]);
    expect(second.translations).toEqual(first.translations);
    expect(first.report.slugCollisionsResolved).toBe(2);
  });

  it("never hands another post's legacy slug to a new translation", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({ id: "a", slug: "lima", title: "Perú", createdAt: new Date("2026-01-01") }),
        post({
          id: "b",
          slug: "peru",
          title: "Otro",
          createdAt: new Date("2026-01-02"),
          translations: { en: { title: "Peru", content: ENGLISH_HTML } },
        }),
      ],
      NONE,
    );

    const slugOf = (id: string, locale: string) =>
      plan.translations.find((row) => row.postId === id && row.locale === locale)?.slug;
    // "peru" is b's legacy URL: a's es row must not take it, b may keep it.
    expect(slugOf("a", "es")).toBe("peru-2");
    expect(slugOf("b", "en")).toBe("peru");
  });

  it("plans slug history per locale only where the new slug differs from the legacy slug", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({
          slug: "viaje-a-peru",
          title: "Viaje a Perú",
          translations: { en: { title: "Trip to Peru", content: ENGLISH_HTML } },
        }),
        post({ id: "p2", slug: null, title: "Sin slug" }),
      ],
      NONE,
    );

    expect(plan.slugHistory).toEqual([
      { postId: "p1", locale: "en", slug: "viaje-a-peru" },
    ]);
    expect(plan.report.slugHistory).toBe(1);
  });

  it("skips slug history when (locale, slug) is already taken in history", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({
          slug: "viaje-a-peru",
          translations: { en: { title: "Trip to Peru", content: ENGLISH_HTML } },
        }),
      ],
      {
        translations: [],
        slugHistory: [{ locale: "en", slug: "viaje-a-peru", translationId: "other" }],
      },
    );

    expect(plan.slugHistory).toEqual([]);
  });

  it("gives review copies a null slug and no slug history", async () => {
    const plan = await planBlogTranslationBackfill(
      [
        post({
          id: "copy",
          slug: null,
          isReviewCopy: true,
          translations: { en: { title: "Trip", content: ENGLISH_HTML } },
        }),
      ],
      NONE,
    );

    expect(plan.translations.map((row) => row.slug)).toEqual([null, null]);
    expect(plan.slugHistory).toEqual([]);
  });

  it("is idempotent: existing rows keep their frozen slug and a second plan creates nothing", async () => {
    const posts = [
      post({ translations: { en: { title: "Trip to Peru", content: ENGLISH_HTML } } }),
    ];
    const first = await planBlogTranslationBackfill(posts, NONE);
    const existing: ExistingTranslationRow[] = first.translations.map((row, index) => ({
      id: `t${index}`,
      postId: row.postId,
      locale: row.locale,
      ...row.data,
      slug: row.locale === "es" ? "frozen-es" : row.slug,
    }));
    const history: ExistingSlugHistoryRow[] = first.slugHistory.map((row) => ({
      locale: row.locale,
      slug: row.slug,
      translationId: "t1",
    }));

    const second = await planBlogTranslationBackfill(posts, {
      translations: existing,
      slugHistory: history,
    });

    expect(second.translations.every((row) => row.action === "keep")).toBe(true);
    expect(second.translations.find((row) => row.locale === "es")?.slug).toBe("frozen-es");
    expect(second.report.es).toEqual({ planned: 0, existing: 1 });
    expect(second.report.en).toEqual({ planned: 0, existing: 1 });
    expect(second.drift).toEqual([]);
  });

  it("reports content drift between legacy columns and existing rows without changing them", async () => {
    const plan = await planBlogTranslationBackfill([post()], {
      translations: [
        {
          id: "t0",
          postId: "p1",
          locale: "es",
          title: "Viaje a Perú (editado)",
          subtitle: "Sub",
          tagline: null,
          content: SPANISH_HTML,
          blocks: [],
          faq: null,
          seo: null,
          slug: "viaje-a-peru",
          isComplete: true,
        },
      ],
      slugHistory: [],
    });

    expect(plan.translations[0].action).toBe("keep");
    expect(plan.drift).toEqual([{ postId: "p1", locale: "es", fields: ["title"] }]);
    expect(plan.report.drift).toBe(1);
  });
});

describe("diffTranslationFields", () => {
  it("ignores JSON key order and null/undefined differences", () => {
    expect(
      diffTranslationFields(
        {
          title: "T",
          subtitle: null,
          tagline: null,
          content: "<p>x</p>",
          blocks: [{ type: "image", url: "u", caption: "c" }],
          faq: null,
          seo: { title: "a", description: "b" },
          isComplete: true,
        },
        {
          title: "T",
          subtitle: undefined,
          tagline: null,
          content: "<p>x</p>",
          blocks: [{ caption: "c", url: "u", type: "image" }],
          faq: null,
          seo: { description: "b", title: "a" },
          isComplete: true,
        },
      ),
    ).toEqual([]);
  });
});

function makeClient(
  posts: LegacyBlogPostRow[],
  { esCount = posts.length }: { esCount?: number } = {},
) {
  let created = 0;
  const tx = {
    blogPostTranslation: {
      upsert: vi.fn().mockImplementation(() => Promise.resolve({ id: `new-${created++}` })),
    },
    blogPostSlugHistory: { upsert: vi.fn().mockResolvedValue({}) },
  };
  return {
    tx,
    client: {
      blogPost: { findMany: vi.fn().mockResolvedValue(posts) },
      blogPostTranslation: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(esCount),
      },
      blogPostSlugHistory: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn().mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
}

describe("runBlogTranslationBackfill", () => {
  const silent = { log: () => {} };
  const posts = [
    post({ translations: { en: { title: "Trip to Peru", content: ENGLISH_HTML } } }),
  ];

  it("writes nothing in dry-run mode", async () => {
    const { client, tx } = makeClient(posts);
    const result = await runBlogTranslationBackfill(client as never, "dry-run", silent);

    expect(client.$transaction).not.toHaveBeenCalled();
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("upserts by (postId, locale) without overwriting, then links slug history, one transaction per post", async () => {
    const { client, tx } = makeClient(posts);
    const result = await runBlogTranslationBackfill(client as never, "apply", silent);

    expect(client.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.blogPostTranslation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId_locale: { postId: "p1", locale: "es" } },
        update: {},
        create: expect.objectContaining({ postId: "p1", locale: "es", slug: "viaje-a-peru", isComplete: true }),
      }),
    );
    expect(tx.blogPostSlugHistory.upsert).toHaveBeenCalledWith({
      where: { locale_slug: { locale: "en", slug: "viaje-a-peru" } },
      update: {},
      create: { locale: "en", slug: "viaje-a-peru", translationId: "new-1" },
    });
    expect(result.ok).toBe(true);
  });

  it("fails the consistency check when es rows do not match posts after apply", async () => {
    const { client } = makeClient(posts, { esCount: 0 });
    const result = await runBlogTranslationBackfill(client as never, "apply", silent);
    expect(result.ok).toBe(false);
  });

  it("diff-only writes nothing and fails when es rows are missing", async () => {
    const { client } = makeClient(posts);
    const result = await runBlogTranslationBackfill(client as never, "diff-only", silent);

    expect(client.$transaction).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});
