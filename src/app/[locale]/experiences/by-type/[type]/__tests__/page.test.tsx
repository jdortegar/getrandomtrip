import { describe, expect, it, vi, beforeEach } from "vitest";

// `page.tsx` imports `@/lib/db/tripper-queries` (prisma-touching) via
// `getReviewsForTripType` — mock it away, same pattern as
// `journey/__tests__/page.test.ts`.
const getReviewsForTripTypeMock = vi.fn();
const getPublishedBlogsForTravelTypeMock = vi.fn();
vi.mock("@/lib/db/tripper-queries", () => ({
  getPublishedBlogsForTravelType: (travelType: string, locale: string) =>
    getPublishedBlogsForTravelTypeMock(travelType, locale),
  getReviewsForTripType: (tripType: string) =>
    getReviewsForTripTypeMock(tripType),
}));

const readAttributionSlugMock = vi.fn();
const resolveLiveAttributionMock = vi.fn();
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: () => readAttributionSlugMock(),
  resolveLiveAttribution: (slug: string | null) =>
    resolveLiveAttributionMock(slug),
}));

const getDictionaryMock = vi.fn();
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: (locale: string) => getDictionaryMock(locale),
}));

vi.mock("@/lib/deployment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/deployment")>()),
  showTripperDiscovery: () => false,
}));

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import TravelerTypePage from "@/app/[locale]/experiences/by-type/[type]/page";

async function serviceSchemaFor(type: string) {
  const page = (await TravelerTypePage({
    params: Promise.resolve({ locale: "es", type }),
    searchParams: Promise.resolve({ catalog: "randomtrip" }),
  })) as ReactElement<{ children: ReactNode }>;
  const jsonLd = Children.toArray(page.props.children).find(
    (child) => isValidElement(child) && child.type === JsonLd,
  ) as ReactElement<{ schema: Record<string, unknown> }> | undefined;
  return jsonLd?.props.schema;
}

const FAKE_DICT = {
  packagesByType: {
    blogEyebrow: "Blog",
    inspirationBanner: {
      buttonText: "Ver más",
      eyebrow: "Inspiración",
      labelText: "Label",
      title: "Title",
    },
  },
};

function delayed<T>(value: T, ms: number, log: number[], tag: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      log.push(tag);
      resolve(value);
    }, ms);
  });
}

describe("TravelerTypePage — parallel data fetching (review finding #10)", () => {
  beforeEach(() => {
    getPublishedBlogsForTravelTypeMock.mockReset();
    getPublishedBlogsForTravelTypeMock.mockResolvedValue([]);
    getReviewsForTripTypeMock.mockReset();
    readAttributionSlugMock.mockReset();
    resolveLiveAttributionMock.mockReset();
    getDictionaryMock.mockReset();
  });

  it("runs attribution resolution, getDictionary, and getReviewsForTripType concurrently, not sequentially", async () => {
    const resolveOrder: number[] = [];
    readAttributionSlugMock.mockReturnValue(delayed(null, 30, resolveOrder, 1));
    resolveLiveAttributionMock.mockResolvedValue(null);
    getDictionaryMock.mockReturnValue(delayed(FAKE_DICT, 30, resolveOrder, 2));
    getReviewsForTripTypeMock.mockReturnValue(delayed([], 30, resolveOrder, 3));

    const start = Date.now();
    await TravelerTypePage({
      params: Promise.resolve({ locale: "es", type: "couple" }),
      searchParams: Promise.resolve({}),
    });
    const elapsed = Date.now() - start;

    // Sequential would take ~90ms (30+30+30); concurrent should stay well
    // under that — generous threshold to avoid CI flakiness while still
    // catching a regression to sequential awaits.
    expect(elapsed).toBeLessThan(70);
    expect(resolveOrder).toHaveLength(3);
  });

  it("skips attribution resolution entirely when ?catalog=randomtrip is set", async () => {
    getDictionaryMock.mockResolvedValue(FAKE_DICT);
    getReviewsForTripTypeMock.mockResolvedValue([]);

    await TravelerTypePage({
      params: Promise.resolve({ locale: "es", type: "couple" }),
      searchParams: Promise.resolve({ catalog: "randomtrip" }),
    });

    expect(readAttributionSlugMock).not.toHaveBeenCalled();
    expect(resolveLiveAttributionMock).not.toHaveBeenCalled();
  });

  it("still resolves attribution and gates price overrides when no catalog opt-out is present", async () => {
    readAttributionSlugMock.mockResolvedValue("maria");
    resolveLiveAttributionMock.mockResolvedValue({
      name: "Maria",
      avatarUrl: null,
      location: null,
      allowedTypes: ["Couple"],
      allowedLevelsByType: {},
      priceOverrides: { couple: { essenza: 999 } },
    });
    getDictionaryMock.mockResolvedValue(FAKE_DICT);
    getReviewsForTripTypeMock.mockResolvedValue([]);

    const element = await TravelerTypePage({
      params: Promise.resolve({ locale: "es", type: "couple" }),
      searchParams: Promise.resolve({}),
    });

    expect(readAttributionSlugMock).toHaveBeenCalledTimes(1);
    expect(resolveLiveAttributionMock).toHaveBeenCalledWith("maria");
    expect(element).toBeTruthy();
  });

  it("keeps the solo, couple, and group cards and points them at their articles", async () => {
    getDictionaryMock.mockResolvedValue(FAKE_DICT);
    getReviewsForTripTypeMock.mockResolvedValue([]);

    const solo = JSON.stringify(
      await TravelerTypePage({
        params: Promise.resolve({ locale: "es", type: "solo" }),
        searchParams: Promise.resolve({ catalog: "randomtrip" }),
      }),
    );
    const couple = JSON.stringify(
      await TravelerTypePage({
        params: Promise.resolve({ locale: "es", type: "couple" }),
        searchParams: Promise.resolve({ catalog: "randomtrip" }),
      }),
    );
    const group = JSON.stringify(
      await TravelerTypePage({
        params: Promise.resolve({ locale: "es", type: "group" }),
        searchParams: Promise.resolve({ catalog: "randomtrip" }),
      }),
    );

    expect(solo).toContain("Viajar Solo: La Mejor Decisión que Puedes Tomar");
    expect(solo).toContain("/blog/viajar-solo-la-mejor-decision");
    expect(solo).not.toContain("/blog/solo");
    expect(couple).toContain("/blog/razones-para-un-viaje-sorpresa-en-pareja");
    expect(couple).not.toContain("/blogs/couple");
    expect(group).toContain("10 momentos que solo pasan viajando en grupo");
    expect(group).toContain("/blog/momentos-que-solo-pasan-viajando-en-grupo");
    expect(group).not.toContain("/blogs/group");
  });

  it("appends published posts for that travel type after the story cards", async () => {
    getDictionaryMock.mockResolvedValue(FAKE_DICT);
    getReviewsForTripTypeMock.mockResolvedValue([]);
    getPublishedBlogsForTravelTypeMock.mockResolvedValue([
      {
        category: "Viajes",
        href: "/blog/momentos-que-solo-pasan-viajando-en-grupo",
        image: "/cover-story.jpg",
        title: "Duplicate story",
      },
      {
        category: "Viajes",
        href: "/blog/alto-paraiso-de-goias",
        image: "/cover.jpg",
        title: "Alto Paraíso de Goiás",
      },
    ]);

    const markup = JSON.stringify(
      await TravelerTypePage({
        params: Promise.resolve({ locale: "es", type: "group" }),
        searchParams: Promise.resolve({ catalog: "randomtrip" }),
      }),
    );
    const storyAt = markup.indexOf("/blog/momentos-que-solo-pasan-viajando-en-grupo");
    const publishedAt = markup.indexOf("/blog/alto-paraiso-de-goias");

    expect(getPublishedBlogsForTravelTypeMock).toHaveBeenCalledWith("group", "es");
    expect(storyAt).toBeGreaterThan(-1);
    expect(publishedAt).toBeGreaterThan(storyAt);
    expect(markup).not.toContain("Duplicate story");
  });
});

describe("TravelerTypePage — Service structured data", () => {
  beforeEach(() => {
    getPublishedBlogsForTravelTypeMock.mockResolvedValue([]);
    getReviewsForTripTypeMock.mockResolvedValue([]);
    getDictionaryMock.mockResolvedValue(FAKE_DICT);
  });

  it("emits a Service JSON-LD for a live traveler type", async () => {
    expect(await serviceSchemaFor("couple")).toMatchObject({
      "@type": "Service",
      url: "https://getrandomtrip.com/experiences/by-type/couple",
    });
  });

  it("emits no Service JSON-LD for a preview traveler type", async () => {
    expect(await serviceSchemaFor("paws")).toBeUndefined();
  });
});
