import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Hero from "@/components/Hero";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

function renderHero(element: Parameters<typeof renderToStaticMarkup>[0]) {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(element);
  return template.content;
}

describe("homepage hero", () => {
  it.each([
    {
      locale: "es",
      copy: es.home.hero,
      title: "EL ASOMBRO EMPIEZA\nDONDE TERMINA\nLA CERTEZA",
      accent: "Vuelve a sentir la magia de viajar.",
      subtitle:
        "Nosotros nos encargamos de todo.\nTú solo di que sí. El destino lo descubres 48hs antes.",
    },
    {
      locale: "en",
      copy: en.home.hero,
      title: "WONDER BEGINS\nWHERE CERTAINTY\nENDS",
      accent: "Feel the magic of travel again.",
      subtitle:
        "We take care of everything.\nYou just say yes. Discover your destination 48 hours before departure.",
    },
  ])(
    "renders the localized hierarchy and unchanged destination ($locale)",
    (test) => {
      const hero = renderHero(
        <Hero content={test.copy} scrollIndicator variant="home" />,
      );
      const heading = hero.querySelector("h1");
      const paragraphs = hero.querySelectorAll("p");
      const cta = hero.querySelector<HTMLAnchorElement>("a");

      expect(heading?.textContent).toBe(test.title);
      expect([...paragraphs].map((paragraph) => paragraph.textContent)).toEqual(
        [test.accent, test.subtitle],
      );
      expect(heading?.nextElementSibling).toBe(paragraphs[0]);
      expect(paragraphs[0].nextElementSibling).toBe(paragraphs[1]);
      expect(cta?.textContent).toBe("GET RANDOMTRIP!");
      expect(cta?.getAttribute("href")).toBe("#exploration-section");
      expect(cta?.getAttribute("aria-label")).toBe(
        test.copy.primaryCta.ariaLabel,
      );
      expect(cta?.classList.contains("bg-transparent")).toBe(true);
    },
  );

  it("scopes the responsive heading and handwritten accent to the homepage", () => {
    const hero = renderHero(<Hero content={es.home.hero} variant="home" />);
    const heading = hero.querySelector("h1");
    const accent = hero.querySelector("p");
    const body = accent?.nextElementSibling;

    expect(heading?.classList.contains("lg:text-[100px]")).toBe(true);
    expect(heading?.classList.contains("leading-none")).toBe(true);
    expect(heading?.classList.contains("whitespace-pre-line")).toBe(true);
    expect(heading?.classList.contains("font-barlow-condensed")).toBe(true);
    expect(accent?.classList.contains("font-nothing-you-could-do")).toBe(true);
    expect(accent?.classList.contains("text-feature")).toBe(true);
    expect(accent?.classList.contains("lg:text-[34px]")).toBe(true);
    expect(accent?.classList.contains("lg:leading-7")).toBe(true);
    expect(body?.classList.contains("leading-7")).toBe(true);
    expect(hero.querySelector("section")?.classList.contains("h-screen")).toBe(
      false,
    );
  });

  it("retains the existing video, branding, and decorative scroll indicator", () => {
    const hero = renderHero(
      <Hero content={es.home.hero} scrollIndicator variant="home" />,
    );
    const branding = hero.querySelector('[data-component="BrandingAnimation"]');

    expect(hero.querySelector("video")?.getAttribute("src")).toBe(
      "/videos/hero-video-1.mp4",
    );
    expect(hero.querySelector("video")?.getAttribute("poster")).toBe(
      "/images/hero-image-1.jpeg",
    );
    expect(branding?.textContent?.replaceAll("\u00a0", " ")).toBe(
      "WONDER • WANDERRepeat",
    );
    expect(hero.querySelector(".scroll-indicator")?.textContent).toBe("SCROLL");
  });
});

it("preserves the shared hero's heading, tagline, links, and styling by default", () => {
  const hero = renderHero(
    <Hero
      content={{
        accent: "Homepage-only accent",
        eyebrow: "Shared eyebrow",
        primaryCta: {
          ariaLabel: "Explore",
          href: "/experiences",
          text: "Explore",
        },
        secondaryCta: { ariaLabel: "About", href: "/about-us", text: "About" },
        subtitle: "Shared <strong>description</strong>",
        tagline: "Shared tagline",
        title: "Explore ©",
      }}
      titleClassName="custom-heading"
    />,
  );
  const heading = hero.querySelector("h2");
  const paragraphs = hero.querySelectorAll("p");

  expect(hero.querySelector("h1")).toBeNull();
  expect(heading?.textContent).toBe("Explore ©");
  expect(heading?.querySelector("sup")?.textContent).toBe("©");
  expect(heading?.classList.contains("lg:text-[130px]")).toBe(true);
  expect(heading?.classList.contains("leading-none")).toBe(true);
  expect(heading?.classList.contains("[&_sup]:leading-none")).toBe(true);
  expect(heading?.classList.contains("custom-heading")).toBe(true);
  expect([...paragraphs].map((paragraph) => paragraph.textContent)).toEqual([
    "Shared description",
    "Shared tagline",
  ]);
  expect(paragraphs[0].querySelector("strong")?.textContent).toBe(
    "description",
  );
  expect(hero.querySelector("section")?.classList.contains("h-screen")).toBe(
    true,
  );
  expect(
    [...hero.querySelectorAll("a")].map((link) => link.getAttribute("href")),
  ).toEqual(["/experiences", "/about-us"]);
  expect(hero.querySelector("a")?.classList.contains("bg-transparent")).toBe(
    false,
  );
  expect(hero.textContent).not.toContain("Homepage-only accent");
});
