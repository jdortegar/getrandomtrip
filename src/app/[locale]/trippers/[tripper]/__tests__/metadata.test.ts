import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperBySlug: vi.fn(),
  getTripperFeaturedTrips: vi.fn(),
  getTripperExperiencesByTypeAndLevel: vi.fn(),
  getTripperPublishedBlogs: vi.fn(),
}));

vi.mock("@/content/trippers", () => ({
  TRIPPERS: [],
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(),
}));

vi.mock("@/lib/helpers/Tripper", () => ({
  getAllTestimonialsForTripper: vi.fn().mockResolvedValue([]),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────
import { getTripperBySlug } from "@/lib/db/tripper-queries";

type PageModule = typeof import("../page");

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractOgImageUrl(metadata: Awaited<ReturnType<PageModule["generateMetadata"]>>): string | undefined {
  const ogImages = metadata.openGraph?.images;
  if (!ogImages) return undefined;
  const firstImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
  if (!firstImage) return undefined;
  if (typeof firstImage === "string") return firstImage;
  if ("url" in firstImage) return firstImage.url as string;
  return undefined;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_TRIPPER_PROFILE = {
  avatarUrl: "https://example.com/avatar.jpg",
  availableTypes: [] as string[],
  bio: "Travel guide",
  commission: 0,
  createdAt: new Date("2024-01-01"),
  destinations: [] as string[],
  email: "jane@example.com",
  heroImage: null as string | null,
  heroImageOriginal: null as string | null,
  id: "tripper-1",
  interests: [] as string[],
  isActive: true,
  location: null as string | null,
  name: "Jane Doe",
  role: "TRIPPER" as const,
  tierLevel: null as string | null,
  tripperSlug: "jane-doe",
  updatedAt: new Date("2024-01-01"),
};

const BASE_TRIPPER = { status: "ok" as const, tripper: BASE_TRIPPER_PROFILE };

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("generateMetadata — tripper hero-image OG fallback", () => {
  let generateMetadata: PageModule["generateMetadata"];

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ generateMetadata } = await import("../page"));
  });

  it("uses heroImage as og:image when heroImage is set", async () => {
    const heroUrl = "https://example.com/hero.jpg";
    vi.mocked(getTripperBySlug).mockResolvedValue({
      status: "ok",
      tripper: { ...BASE_TRIPPER_PROFILE, heroImage: heroUrl },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tripper: "jane-doe" }),
    });

    expect(extractOgImageUrl(metadata)).toBe(heroUrl);
  });

  it("falls back to avatarUrl when heroImage is null but avatarUrl is set", async () => {
    vi.mocked(getTripperBySlug).mockResolvedValue({
      status: "ok",
      tripper: {
        ...BASE_TRIPPER_PROFILE,
        avatarUrl: "https://example.com/avatar.jpg",
        heroImage: null,
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tripper: "jane-doe" }),
    });

    expect(extractOgImageUrl(metadata)).toBe("https://example.com/avatar.jpg");
  });

  it("falls back to /images/opengraph.png when both heroImage and avatarUrl are null", async () => {
    vi.mocked(getTripperBySlug).mockResolvedValue({
      status: "ok",
      tripper: { ...BASE_TRIPPER_PROFILE, avatarUrl: null, heroImage: null },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tripper: "jane-doe" }),
    });

    expect(extractOgImageUrl(metadata)).toBe("/images/opengraph.png");
  });

  it("returns minimal metadata when tripper is not found", async () => {
    vi.mocked(getTripperBySlug).mockResolvedValue({ status: "not_found" });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tripper: "unknown" }),
    });

    expect(metadata.title).toBe("Randomtrip");
    expect(metadata.openGraph).toBeUndefined();
  });
});
