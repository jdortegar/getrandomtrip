import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildPersonSchema,
  buildBlogPostingSchema,
  buildFAQPageSchema,
  buildTravelerTypeServiceSchema,
  buildXsedServiceSchema,
} from "../schemas";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";

const discovery = vi.hoisted(() => ({ enabled: false }));
vi.mock("@/lib/deployment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/deployment")>()),
  showTripperDiscovery: () => discovery.enabled,
}));

const BASE_URL = "https://getrandomtrip.com";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = BASE_URL;
});

describe("buildOrganizationSchema", () => {
  it('returns @type "Organization"', () => {
    const schema = buildOrganizationSchema();
    expect(schema["@type"]).toBe("Organization");
  });

  it("includes name and url", () => {
    const schema = buildOrganizationSchema();
    expect(schema.name).toBe("Randomtrip");
    expect(schema.url).toBe(BASE_URL);
  });

  it('includes "@context" schema.org', () => {
    const schema = buildOrganizationSchema();
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("identifies the brand unambiguously for search and AI engines", () => {
    const schema = buildOrganizationSchema();
    expect(schema["@id"]).toBe(`${BASE_URL}/#organization`);
    expect(schema.legalName).toBe("Randomtrip Inc.");
    expect(schema.alternateName).toEqual(
      expect.arrayContaining(["getrandomtrip", "getrandomtrip.com"]),
    );
    expect(schema.sameAs).toEqual([
      "https://www.instagram.com/getrandomtrip",
      "https://www.facebook.com/getrandomtrip",
      "https://www.linkedin.com/company/getrandomtrip",
    ]);
    expect(schema.address).toMatchObject({
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Wilmington",
      addressRegion: "DE",
      postalCode: "19808",
      streetAddress: "251 Little Falls Dr",
    });
    expect(String(schema.disambiguatingDescription)).toContain(
      "getrandomtrip.com",
    );
    expect(typeof schema.description).toBe("string");
  });
});

describe("buildWebSiteSchema", () => {
  it('returns @type "WebSite"', () => {
    const schema = buildWebSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
  });

  it("names the organization as publisher by @id", () => {
    const schema = buildWebSiteSchema();
    expect(schema["@id"]).toBe(`${BASE_URL}/#website`);
    expect(schema.publisher).toEqual({ "@id": `${BASE_URL}/#organization` });
  });

  it("includes url", () => {
    const schema = buildWebSiteSchema();
    expect(typeof schema.url).toBe("string");
    expect((schema.url as string).length).toBeGreaterThan(0);
  });

  it('includes "@context" schema.org', () => {
    const schema = buildWebSiteSchema();
    expect(schema["@context"]).toBe("https://schema.org");
  });
});

describe("buildPersonSchema", () => {
  const tripper = {
    avatarUrl: "https://example.com/avatar.jpg",
    bio: "Adventure guide",
    heroImage: "https://example.com/hero.jpg",
    name: "Jane Doe",
    slug: "jane-doe",
  };

  it('returns @type "Person"', () => {
    const schema = buildPersonSchema(tripper);
    expect(schema["@type"]).toBe("Person");
  });

  it("includes name", () => {
    const schema = buildPersonSchema(tripper);
    expect(schema.name).toBe("Jane Doe");
  });

  it("includes url using tripper slug", () => {
    const schema = buildPersonSchema(tripper);
    expect(schema.url).toContain("jane-doe");
    expect(typeof schema.url).toBe("string");
  });

  it("prefers heroImage over avatarUrl when both are present", () => {
    const schema = buildPersonSchema(tripper);
    expect(schema.image).toBe("https://example.com/hero.jpg");
  });

  it("falls back to avatarUrl when heroImage is null", () => {
    const schema = buildPersonSchema({ ...tripper, heroImage: null });
    expect(schema.image).toBe("https://example.com/avatar.jpg");
  });

  it("omits image when both heroImage and avatarUrl are null", () => {
    const schema = buildPersonSchema({
      ...tripper,
      avatarUrl: null,
      heroImage: null,
    });
    expect(schema.image).toBeUndefined();
  });
});

describe("buildBlogPostingSchema", () => {
  const post = {
    authorName: "Jane Doe",
    createdAt: new Date("2024-01-15"),
    description: "An exciting travel story",
    heroImage: "https://example.com/cover.jpg",
    publishedAt: new Date("2024-01-20"),
    slug: "my-travel-story",
    title: "My Travel Story",
  };

  it('returns @type "BlogPosting"', () => {
    const schema = buildBlogPostingSchema(post);
    expect(schema["@type"]).toBe("BlogPosting");
  });

  it("includes headline (title)", () => {
    const schema = buildBlogPostingSchema(post);
    expect(schema.headline).toBe("My Travel Story");
  });

  it("includes url with slug", () => {
    const schema = buildBlogPostingSchema(post);
    expect(schema.url).toContain("my-travel-story");
    expect(typeof schema.url).toBe("string");
  });

  it("includes datePublished using publishedAt when available", () => {
    const schema = buildBlogPostingSchema(post);
    expect(schema.datePublished).toBeDefined();
    expect(schema.datePublished).toContain("2024-01-20");
  });

  it("falls back to createdAt when publishedAt is null", () => {
    const schema = buildBlogPostingSchema({ ...post, publishedAt: null });
    expect(schema.datePublished).toContain("2024-01-15");
  });

  it("includes image when heroImage is provided", () => {
    const schema = buildBlogPostingSchema(post);
    expect(schema.image).toBe("https://example.com/cover.jpg");
  });

  it("omits image when heroImage is not provided", () => {
    const schema = buildBlogPostingSchema({ ...post, heroImage: undefined });
    expect(schema.image).toBeUndefined();
  });
});

describe("buildFAQPageSchema", () => {
  const items = [
    { answer: "Answer 1", question: "Question 1" },
    { answer: "Answer 2", question: "Question 2" },
  ];

  it('returns @type "FAQPage"', () => {
    const schema = buildFAQPageSchema(items);
    expect(schema["@type"]).toBe("FAQPage");
  });

  it("includes at least one Question in mainEntity", () => {
    const schema = buildFAQPageSchema(items);
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    expect(Array.isArray(mainEntity)).toBe(true);
    expect(mainEntity.length).toBeGreaterThan(0);
    expect(mainEntity[0]["@type"]).toBe("Question");
  });

  it("maps all FAQ items to Question entities", () => {
    const schema = buildFAQPageSchema(items);
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity).toHaveLength(2);
    expect(mainEntity[0].name).toBe("Question 1");
    expect(mainEntity[1].name).toBe("Question 2");
  });

  it("each Question includes an acceptedAnswer", () => {
    const schema = buildFAQPageSchema(items);
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    const firstAnswer = mainEntity[0].acceptedAnswer as Record<string, unknown>;
    expect(firstAnswer["@type"]).toBe("Answer");
    expect(firstAnswer.text).toBe("Answer 1");
  });
});

describe("buildTravelerTypeServiceSchema", () => {
  it.each([
    ["es", "couple", "Viaje sorpresa"],
    ["en", "solo", "Surprise trip"],
  ] as const)(
    "describes the live %s %s product as a Service of the organization",
    (locale, slug, serviceType) => {
      const schema = buildTravelerTypeServiceSchema(slug, locale);
      const url = `${BASE_URL}/${locale === "en" ? "en/" : ""}experiences/by-type/${slug}`;
      expect(schema).toMatchObject({
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${url}#service`,
        inLanguage: locale,
        provider: { "@id": `${BASE_URL}/#organization` },
        serviceType,
        url,
      });
      expect(typeof schema?.name).toBe("string");
      expect(String(schema?.description).length).toBeGreaterThan(0);
      expect(schema?.audience).toMatchObject({ "@type": "Audience" });
    },
  );

  it("resolves aliases to the canonical slug URL", () => {
    expect(buildTravelerTypeServiceSchema("parejas", "es")?.url).toBe(
      `${BASE_URL}/experiences/by-type/couple`,
    );
  });

  it.each(["family", "honeymoon", "paws", "unknown"])(
    "emits nothing for %s (preview or unknown types are not marketed)",
    (slug) => {
      expect(buildTravelerTypeServiceSchema(slug, "es")).toBeNull();
    },
  );

  describe("hidden products, once activated", () => {
    beforeAll(() => {
      discovery.enabled = true;
    });
    afterAll(() => {
      discovery.enabled = false;
    });

    it.each([
      ["family", "Kin© Randomtrip", "es", "Viaje sorpresa"],
      ["honeymoon", "Nuptia© Randomtrip", "es", "Viaje sorpresa"],
      ["paws", "Paws© Randomtrip", "es", "Viaje sorpresa"],
      ["family", "Kin© Randomtrip", "en", "Surprise trip"],
      ["honeymoon", "Nuptia© Randomtrip", "en", "Surprise trip"],
      ["paws", "Paws© Randomtrip", "en", "Surprise trip"],
    ] as const)(
      "builds a complete Service for %s (%s, %s)",
      (slug, name, locale, serviceType) => {
        const schema = buildTravelerTypeServiceSchema(slug, locale);
        const url = `${BASE_URL}/${locale === "en" ? "en/" : ""}experiences/by-type/${slug}`;
        expect(schema).toMatchObject({
          "@id": `${url}#service`,
          "@type": "Service",
          inLanguage: locale,
          name,
          provider: { "@id": `${BASE_URL}/#organization` },
          serviceType,
          url,
        });
        expect(String(schema?.description).trim().length).toBeGreaterThan(20);
        expect(
          String((schema?.audience as { audienceType?: string }).audienceType),
        ).not.toBe("");
        expect(JSON.stringify(schema)).not.toMatch(/price|offers|USD/i);
      },
    );
  });

  it("never includes prices", () => {
    expect(
      JSON.stringify(buildTravelerTypeServiceSchema("couple", "en")),
    ).not.toMatch(/price|offers|USD/i);
  });
});

describe("buildXsedServiceSchema", () => {
  it.each([
    ["es", esDict, "XSED© Randomtrip", "Viaje sorpresa", `${BASE_URL}/xsed`],
    ["en", enDict, "TGIS© Randomtrip", "Surprise trip", `${BASE_URL}/en/xsed`],
  ] as const)(
    "describes the %s 1-night experience as the same surprise-trip service as the other levels",
    (locale, dict, name, serviceType, url) => {
      const schema = buildXsedServiceSchema(locale, {
        description: dict.xsedPage.meta.description,
        label: dict.nav.labelXsed,
      });
      expect(schema).toEqual({
        "@context": "https://schema.org",
        "@id": `${url}#service`,
        "@type": "Service",
        description: dict.xsedPage.meta.description,
        inLanguage: locale,
        name,
        provider: { "@id": `${BASE_URL}/#organization` },
        serviceType,
        url,
      });
    },
  );
});
