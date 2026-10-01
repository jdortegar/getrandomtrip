import { Children, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaqBlock } from "@/components/display/FaqBlock";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { PresentTrippers } from "@/components/app/about-us/PresentTrippers";
import AboutUsPage from "../page";

vi.mock("@/lib/db/tripper-queries", () => ({
  getAllTrippers: vi.fn(),
}));

const tripper: Awaited<ReturnType<typeof getAllTrippers>>[number] = {
  avatarUrl: null,
  bio: "Local travel expert",
  commission: null,
  id: "tripper-1",
  location: null,
  name: "Alex",
  travelerType: null,
  tripperSlug: "alex",
};

async function renderFaq(locale: string) {
  const page = await AboutUsPage({ params: Promise.resolve({ locale }) });
  const faq = Children.toArray(page.props.children).find(
    (child) => isValidElement(child) && child.type === FaqBlock,
  );
  expect(faq).toBeDefined();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(faq);
  return {
    classes: container.querySelector("section > div")!.classList,
    container,
  };
}

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
  vi.mocked(getAllTrippers).mockReset();
  vi.mocked(getAllTrippers).mockResolvedValue([]);
});

describe.each([
  { locale: "en", copy: en.aboutUs.faq },
  { locale: "es", copy: es.aboutUs.faq },
])("About Us FAQ spacing in $locale", ({ locale, copy }) => {
  it("opts into shared content gutters without padding the full-bleed page", async () => {
    const page = await AboutUsPage({ params: Promise.resolve({ locale }) });

    expect(page.props.className.split(" ")).toContain("rt-content-layout");
    expect(page.props.className.split(" ")).not.toContain("rt-container");
  });

  it("restores standard spacing after the trust banner without trippers", async () => {
    const { classes, container } = await renderFaq(locale);

    expect(classes).not.toContain("pt-0!");
    expect(classes).toContain("py-24");
    expect(classes).toContain("md:py-32");
    expect(container.textContent).toContain(copy.title);
    expect(container.textContent).toContain(copy.items[0].question);
  });

  it("restores spacing when all raw trippers are filtered out", async () => {
    vi.mocked(getAllTrippers).mockResolvedValue([
      { ...tripper, bio: "   " },
      { ...tripper, tripperSlug: "" },
    ]);

    const { classes } = await renderFaq(locale);

    expect(classes).not.toContain("pt-0!");
    expect(classes).toContain("py-24");
    expect(classes).toContain("md:py-32");
  });

  it("avoids doubled top spacing after a populated trippers section", async () => {
    vi.mocked(getAllTrippers).mockResolvedValue([tripper]);

    const { classes } = await renderFaq(locale);

    expect(classes).toContain("pt-0!");
  });
});

describe("About Us in production", () => {
  it("skips the trippers section and its spacing override", async () => {
    vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "production");
    vi.mocked(getAllTrippers).mockResolvedValue([tripper]);

    const page = await AboutUsPage({ params: Promise.resolve({ locale: "es" }) });
    const children = Children.toArray(page.props.children);
    const { classes } = await renderFaq("es");

    expect(children.some((c) => isValidElement(c) && c.type === PresentTrippers)).toBe(false);
    expect(getAllTrippers).not.toHaveBeenCalled();
    expect(classes).not.toContain("pt-0!");
  });
});
