import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PresentTrippers } from "@/components/app/about-us/PresentTrippers";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";

const navigation = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({ useParams: () => navigation }));

const trippers = [{
  avatarUrl: null,
  bio: "Local travel expert",
  id: "tripper-1",
  name: "Alex",
  specialty: null,
  tripperSlug: "alex",
}];

describe("PresentTrippers — locale-aware directory CTA", () => {
  it.each([
    { locale: "en", copy: enCopy, href: "/en/trippers" },
    { locale: "es", copy: esCopy, href: "/trippers" },
  ])("keeps the $locale locale in the directory link", ({ locale, copy, href }) => {
    navigation.locale = locale;
    const content = copy.aboutUs.presentTrippers;
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <PresentTrippers content={content} trippers={trippers} />,
    );

    const cta = Array.from(template.content.querySelectorAll("a"))
      .find((link) => link.textContent === content.ctaLabel);
    expect(cta?.getAttribute("href")).toBe(href);
  });

  it("omits the section when no trippers are available", () => {
    expect(renderToStaticMarkup(
      <PresentTrippers content={enCopy.aboutUs.presentTrippers} trippers={[]} />,
    )).toBe("");
  });
});
