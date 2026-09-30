import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Hero from "@/components/Hero";
import { AboutUsFounder } from "@/components/app/about-us/AboutUsFounder";
import { AboutUsPhilosophy } from "@/components/app/about-us/AboutUsPhilosophy";
import { AboutUsSteps } from "@/components/app/about-us/AboutUsSteps";
import { AboutUsValues } from "@/components/app/about-us/AboutUsValues";
import { PresentTrippers } from "@/components/app/about-us/PresentTrippers";
import { TeamSection } from "@/components/app/about-us/TeamSection";
import { TrustHero } from "@/components/app/about-us/TrustHero";
import { LayoutExamples } from "@/components/app/design-system/LayoutExamples";
import { FaqBlock } from "@/components/display/FaqBlock";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Locale } from "@/lib/i18n/config";
import type { DesignSystemDict } from "@/lib/types/dictionary";

vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "es" }) }));

describe.each([
  { locale: "en" as Locale, dictionary: en },
  { locale: "es" as Locale, dictionary: es },
])("About Us content layout in $locale", ({ locale, dictionary }) => {
  it("uses one gutter owner for every section, keeping backgrounds full bleed", () => {
    const copy = dictionary.aboutUs;
    const examples = [
      { name: "hero", element: <Hero content={copy.hero} /> },
      {
        name: "values",
        element: <AboutUsValues items={copy.valueProps.items} />,
      },
      {
        name: "philosophy",
        element: <AboutUsPhilosophy content={copy.philosophy} />,
      },
      { name: "founder", element: <AboutUsFounder content={copy.founder} /> },
      { name: "team", element: <TeamSection content={copy.curators} /> },
      {
        name: "steps",
        element: (
          <AboutUsSteps content={copy.steps} cta={copy.cta} locale={locale} />
        ),
      },
      {
        name: "trust",
        element: <TrustHero content={copy.trust} locale={locale} />,
      },
      { name: "faq", element: <FaqBlock copy={copy.faq} /> },
    ];

    for (const { element, name } of examples) {
      const template = document.createElement("template");
      template.innerHTML = renderToStaticMarkup(element);
      const section = template.content.querySelector("section")!;

      expect(section.classList.contains("rt-container"), name).toBe(false);
      expect(section.querySelectorAll(".rt-container"), name).toHaveLength(1);
      expect(
        section.querySelector(".rt-container .rt-container"),
        name,
      ).toBeNull();
      const extraPagePadding = [
        ...section.querySelectorAll("div, article"),
      ].filter(
        (element) =>
          element.classList.contains("px-10") ||
          element.classList.contains("p-10"),
      );
      expect(extraPagePadding, name).toEqual([]);
    }
  });

  it("keeps populated tripper carousel, heading, and CTA gutters as siblings", () => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <PresentTrippers
        content={dictionary.aboutUs.presentTrippers}
        trippers={[
          {
            avatarUrl: null,
            bio: "Local travel expert",
            id: "tripper-1",
            name: "Alex",
            specialty: null,
            tripperSlug: "alex",
          },
        ]}
      />,
    );

    expect(
      template.content.querySelectorAll(".rt-container").length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      template.content.querySelector(".rt-container .rt-container"),
    ).toBeNull();
  });

  it("lets the trust feature panel grow around all localized content", () => {
    const template = document.createElement("template");
    const content = dictionary.aboutUs.trust;
    template.innerHTML = renderToStaticMarkup(
      <TrustHero content={content} locale={locale} />,
    );
    const panel = template.content.querySelector(".backdrop-blur-md")!;

    expect(
      [...panel.classList].filter((name) => name.startsWith("max-h-")),
    ).toEqual([]);
    for (const item of content.items) {
      expect(panel.textContent).toContain(item.title);
      expect(panel.textContent).toContain(item.description);
    }
  });

  it("uses the feature CTA styling without overriding localized navigation", () => {
    const template = document.createElement("template");
    const content = dictionary.aboutUs.trust;
    template.innerHTML = renderToStaticMarkup(
      <TrustHero content={content} locale={locale} />,
    );
    const cta = template.content.querySelector("a")!;

    for (const name of [
      "bg-feature",
      "border-feature",
      "text-white",
      "min-h-14",
    ]) {
      expect(cta.classList.contains(name), name).toBe(true);
    }
    expect(cta.classList.contains("text-ink")).toBe(false);
    expect(cta.classList.contains("bg-white")).toBe(false);
    expect(cta.textContent).toBe(content.ctaLabel);
    expect(cta.getAttribute("aria-label")).toBe(content.ctaAriaLabel);
    expect(cta.getAttribute("href")).toBe(
      locale === "en" ? "/en#exploration-section" : "/#exploration-section",
    );
  });

  it("demonstrates the actual shared content layout in the localized gallery", () => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <LayoutExamples copy={dictionary.designSystem as DesignSystemDict} />,
    );
    const example = template.content.querySelector(".rt-content-layout")!;

    expect(example.classList.contains("bg-secondary")).toBe(true);
    expect(
      example.querySelector(":scope > .rt-container")?.textContent,
    ).toContain(dictionary.designSystem.layout.title);
  });
});

it("compiles scoped 32px content gutters while preserving shared container and hero defaults", async () => {
  const stylesheet = resolve(process.cwd(), "src/app/globals.css");
  const result = await postcss([tailwindcss({ optimize: false })]).process(
    readFileSync(stylesheet, "utf8"),
    { from: stylesheet },
  );
  const gutters: string[] = [];
  const scopes: string[] = [];
  const heroGutters: string[] = [];
  result.root.walkRules((rule) => {
    if (rule.selector === ".rt-container") {
      rule.walkDecls("padding-inline", (declaration) => {
        gutters.push(declaration.value);
      });
    }
    if (rule.selector === ".rt-content-layout") scopes.push(rule.toString());
    rule.walkDecls("padding-inline", (declaration) => {
      if (declaration.value === "var(--rt-content-gutter,5rem)") {
        heroGutters.push(declaration.value);
        expect(declaration.important).toBe(true);
      }
    });
  });

  expect(gutters).toEqual([
    "var(--rt-content-gutter, calc(var(--spacing) * 4))",
    "var(--rt-content-gutter, calc(var(--spacing) * 6))",
    "var(--rt-content-gutter, calc(var(--spacing) * 8))",
  ]);
  expect(result.css).toContain("--spacing-content-gutter: 2rem;");
  expect(scopes).toHaveLength(1);
  expect(scopes[0]).toContain(
    "--rt-content-gutter: var(--spacing-content-gutter)",
  );
  expect(scopes[0]).not.toContain("padding");
  expect(heroGutters.length).toBeGreaterThan(0);
});
