import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dictionary from "@/dictionaries/en.json";
import { getXsedBlogDropsForGrid } from "@/lib/data/xsed";
import type { DropEntry } from "@/types/core";
import XsedPage from "../page";

vi.mock("@/lib/data/xsed", () => ({
  getCurrentXsedDrop: vi.fn().mockResolvedValue(null),
  getXsedBlogDropsForGrid: vi.fn(),
}));
vi.mock("@/lib/xsed/get-xsed-drop-testimonials", () => ({
  getAllXsedTestimonials: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/components/app/xsed/SecondaryHero", () => ({
  SecondaryHero: () => null,
}));
vi.mock("@/components/app/xsed/CountDown", () => ({ CountDown: () => null }));
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
