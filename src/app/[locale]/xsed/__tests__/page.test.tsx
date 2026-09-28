import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dictionary from "@/dictionaries/en.json";
import { getCurrentXsedDrop, getXsedBlogDropsForGrid } from "@/lib/data/xsed";
import { CountDown } from "@/components/app/xsed/CountDown";
import type { DropEntry } from "@/types/core";
import XsedPage from "../page";
import XsedDropsPage from "../drops/page";

vi.mock("@/lib/data/xsed", () => ({
  getCurrentXsedDrop: vi.fn().mockResolvedValue(null),
  getXsedBlogDropsForGrid: vi.fn(),
  getPublicXsedBlogDropEntries: vi
    .fn()
    .mockResolvedValue({ drops: [], hasMore: false }),
}));
vi.mock("@/lib/siteSettings", () => ({
  getXsedCampaignCounter: vi
    .fn()
    .mockResolvedValue({ startDate: "2026-09-27", weekNumber: 2 }),
}));
vi.mock("@/components/app/xsed/AllDropsGrid", () => ({
  AllDropsGrid: () => null,
}));
vi.mock("@/components/app/xsed/XsedInternalHero", () => ({
  XsedInternalHero: () => null,
}));
vi.mock("@/lib/xsed/get-xsed-drop-testimonials", () => ({
  getAllXsedTestimonials: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/components/app/xsed/SecondaryHero", () => ({
  SecondaryHero: () => null,
}));
vi.mock("@/components/app/xsed/CountDown", () => ({
  CountDown: vi.fn(() => null),
}));
vi.mock("@/components/app/xsed/MultiColumnIconText", () => ({
  MultiColumnIconText: () => null,
}));
vi.mock("@/components/app/xsed/XsedHero", () => ({ XsedHero: () => null }));
vi.mock("@/components/Testimonials/Testimonials", () => ({
  default: () => null,
}));

const drop: DropEntry = {
  date: "20 FEBRUARY 2026",
  image: "/images/drops/drops-mendoza.jpg",
  number: 1,
  slug: "drop-1",
  title: "Drop 1",
};

async function renderPage() {
  const page = await XsedPage({ params: Promise.resolve({ locale: "en" }) });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(page);
  const faqHeading = Array.from(container.querySelectorAll("h2")).find(
    (heading) => heading.textContent === dictionary.xsedPage.faq.title,
  );
  const faqClasses =
    faqHeading?.closest("section")?.firstElementChild?.classList;

  return { container, faqClasses };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentXsedDrop).mockResolvedValue(null);
  vi.mocked(getXsedBlogDropsForGrid).mockResolvedValue([]);
});

describe("campaign counter page wiring", () => {
  it.each([XsedPage, XsedDropsPage])(
    "uses the campaign week without changing drop identity or capacity",
    async (page) => {
      vi.mocked(getCurrentXsedDrop).mockResolvedValue({
        id: "drop-id",
        slug: "23",
        number: 23,
        soldCount: 4,
        totalSlots: 10,
      });
      renderToStaticMarkup(
        await page({ params: Promise.resolve({ locale: "en" }) }),
      );
      expect(vi.mocked(CountDown).mock.calls[0][0]).toMatchObject({
        campaignStartDate: "2026-09-27",
        initialWeekNumber: 2,
        dropSlug: "23",
        soldCount: 4,
        totalSlots: 10,
      });
    },
  );

  it("still hides the countdown without a bookable current drop", async () => {
    await renderPage();
    expect(CountDown).not.toHaveBeenCalled();
  });
});

describe("XSED FAQ spacing", () => {
  it("restores standard FAQ padding when Previous Drops is omitted", async () => {
    vi.mocked(getXsedBlogDropsForGrid).mockResolvedValue([]);

    const { container, faqClasses } = await renderPage();

    expect(container.textContent).not.toContain(
      dictionary.xsedPage.dropGrid.eyebrow,
    );
    expect(faqClasses).not.toContain("pt-0!");
    expect(faqClasses).toContain("py-24");
    expect(faqClasses).toContain("md:py-32");
  });

  it("preserves compact FAQ padding after populated Previous Drops", async () => {
    vi.mocked(getXsedBlogDropsForGrid).mockResolvedValue([drop]);

    const { container, faqClasses } = await renderPage();

    expect(container.textContent).toContain(
      dictionary.xsedPage.dropGrid.eyebrow,
    );
    expect(container.textContent).toContain(drop.title);
    expect(faqClasses).toContain("pt-0!");
  });
});
