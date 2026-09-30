import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss, { type Rule } from "postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { AboutUsFounder } from "@/components/app/about-us/AboutUsFounder";
import { AboutUsPhilosophy } from "@/components/app/about-us/AboutUsPhilosophy";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

describe("AboutUsFounder", () => {
  it.each([
    { locale: "en", copy: en.aboutUs.founder },
    { locale: "es", copy: es.aboutUs.founder },
  ])("renders the localized founder story in $locale", ({ copy }) => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <AboutUsFounder content={copy} />,
    );

    const section = template.content.querySelector("section")!;
    const heading = section.querySelector("h2")!;
    expect(heading.textContent).toBe(copy.sectionTitle);
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(
      [...section.querySelectorAll("p")].map((p) => p.textContent),
    ).toEqual([copy.p1, copy.p2]);
    expect(section.querySelectorAll(".rt-container")).toHaveLength(1);

    const image = section.querySelector("img")!;
    const imageUrl = new URL(image.getAttribute("src")!, "http://localhost");
    expect(imageUrl.searchParams.get("url") ?? imageUrl.pathname).toBe(
      "/images/about-us-founder.png",
    );
    expect(image.getAttribute("alt")).toBe(copy.imageAlt);
    expect(image.getAttribute("width")).toBe("662");
    expect(image.getAttribute("height")).toBe("452");
    expect(image.classList.contains("h-auto")).toBe(true);
    expect(image.classList.contains("w-full")).toBe(true);
    expect(image.classList.contains("object-cover")).toBe(false);
    expect(image.classList.contains("absolute")).toBe(false);
    expect(image.getAttribute("sizes")).not.toBe("100vw");

    const layout = section.querySelector(".rt-editorial-split")!;
    expect(
      layout.firstElementChild?.classList.contains("rt-editorial-copy"),
    ).toBe(true);
    expect(layout.lastElementChild).toBe(image);
  });

  it("preserves the existing philosophy section and image", () => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <AboutUsPhilosophy content={es.aboutUs.philosophy} id="philosophy" />,
    );

    expect(template.content.querySelector("#philosophy")).not.toBeNull();
    expect(template.content.querySelector("h2")?.textContent).toBe(
      es.aboutUs.philosophy.sectionTitle,
    );
    const image = template.content.querySelector("img")!;
    const imageUrl = new URL(image.getAttribute("src")!, "http://localhost");
    expect(imageUrl.searchParams.get("url") ?? imageUrl.pathname).toBe(
      "/images/about-us-philosophy.png",
    );
    expect(image.getAttribute("alt")).toBe(es.aboutUs.philosophy.imageAlt);
    expect(image.classList.contains("object-cover")).toBe(true);
    expect(template.content.querySelector(".rt-editorial-split")).toBeNull();
  });
});

describe("Founder responsive foundation", () => {
  let stylesheet: postcss.Root;

  beforeAll(async () => {
    const path = resolve(process.cwd(), "src/app/globals.css");
    const result = await postcss([tailwindcss({ optimize: false })]).process(
      readFileSync(path, "utf8"),
      { from: path },
    );
    stylesheet = result.root;
  });

  function declarations(selector: string, desktop = false) {
    let utility: Rule | undefined;
    stylesheet.walkRules(selector, (rule) => {
      utility = rule;
    });
    expect(utility, selector).toBeDefined();
    const container = desktop
      ? utility!.nodes.find(
          (node) =>
            node.type === "atrule" && node.params === "(width >= 64rem)",
        )
      : utility;
    expect(container, `${selector}, desktop=${desktop}`).toBeDefined();
    return Object.fromEntries(
      (container && "nodes" in container ? (container.nodes ?? []) : [])
        .filter((node) => node.type === "decl")
        .map((node) => [node.prop, node.value.replace(/\s+/g, " ")]),
    );
  }

  it("matches Philosophy title, body, and copy spacing while stacked", () => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <AboutUsPhilosophy content={es.aboutUs.philosophy} />,
    );
    const heading = template.content.querySelector("h2")!;
    expect(heading.classList.contains("text-editorial-title-stacked")).toBe(
      true,
    );
    expect(heading.classList.contains("leading-tight")).toBe(true);
    expect(heading.parentElement?.classList.contains("gap-6")).toBe(true);
    for (const paragraph of template.content.querySelectorAll("p")) {
      expect(paragraph.classList.contains("text-base")).toBe(true);
      expect(paragraph.classList.contains("leading-relaxed")).toBe(true);
    }

    expect(stylesheet.toString()).toContain(
      "--text-editorial-title-stacked: 4.375rem;",
    );
    expect(declarations(".rt-editorial-title")).toMatchObject({
      "font-size": "var(--text-editorial-title-stacked)",
      "line-height": "var(--leading-tight)",
    });
    expect(declarations(".rt-editorial-body")).toMatchObject({
      "font-size": "var(--text-base)",
      gap: "1rem",
      "line-height": "var(--leading-relaxed)",
    });
    expect(declarations(".rt-editorial-copy").gap).toBe(
      "calc(var(--spacing) * 6)",
    );
  });

  it("preserves desktop geometry and only reorders the image at desktop width", () => {
    expect(declarations(".rt-editorial-image")["grid-column"]).toBeUndefined();
    expect(declarations(".rt-editorial-copy")["grid-column"]).toBeUndefined();
    expect(declarations(".rt-editorial-image", true)).toMatchObject({
      "grid-column": "1",
      "grid-row": "1",
    });
    expect(declarations(".rt-editorial-copy", true)).toMatchObject({
      gap: "var(--spacing-editorial-copy)",
      "grid-column": "2",
      "grid-row": "1",
    });
    expect(declarations(".rt-editorial-title", true)).toMatchObject({
      "font-size": "var(--text-editorial-title)",
      "line-height": "1",
    });
    expect(declarations(".rt-editorial-body", true)).toMatchObject({
      "font-size": "var(--text-editorial-body)",
      "line-height": "var(--text-editorial-body--line-height)",
      "max-width": "var(--container-editorial-body)",
    });
    expect(declarations(".rt-editorial-image")["max-width"]).toBe(
      "min(100%, var(--container-editorial-image))",
    );
    expect(
      declarations(".rt-editorial-split", true)["grid-template-columns"],
    ).toBe(
      "minmax(0, var(--container-editorial-image)) minmax(0, var(--container-editorial-title))",
    );
  });
});
