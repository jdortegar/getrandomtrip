import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DropEntry } from "@/types/core";
import { DropGrid } from "../DropGrid";

const content = {
  ctaHref: "/xsed/drops",
  ctaLabel: "VIEW ALL",
  description: "What others lived.",
  eyebrow: "PREVIOUS DROPS",
  title: "ESCAPE LOG BY",
  titleHighlight: "TGIS",
};

function drop(n: number): DropEntry {
  return {
    date: "20 FEBRERO 2026",
    image: "/images/drops/drops-mendoza.jpg",
    number: n,
    slug: `drop-${n}`,
    title: `Drop ${n}`,
  };
}

describe("DropGrid", () => {
  it("omits the entire section when there are no drops", () => {
    const html = renderToStaticMarkup(<DropGrid content={content} drops={[]} />);

    expect(html).toBe("");
  });

  it("keeps the section copy, drop, and view-all link when a drop exists", () => {
    const html = renderToStaticMarkup(
      <DropGrid content={content} drops={[drop(1)]} />,
    );

    expect(html).toContain("<section");
    expect(html).toContain(content.eyebrow);
    expect(html).toContain(content.title);
    expect(html).toContain(content.titleHighlight);
    expect(html).toContain(content.description);
    expect(html).toContain("Drop 1");
    expect(html).toContain(`href="${content.ctaHref}"`);
    expect(html).toContain(content.ctaLabel);
  });

  it("caps the mosaic to the viewport when a featured cell is used", () => {
    const html = renderToStaticMarkup(
      <DropGrid content={content} drops={[drop(1), drop(2), drop(3)]} />,
    );
    expect(html).toContain(
      "lg:h-[calc(100dvh-var(--rt-header-h,64px)-6rem)]",
    );
    expect(html).toContain("lg:grid-rows-2");
  });

  it("does not cap height when there is no featured mosaic", () => {
    const html = renderToStaticMarkup(
      <DropGrid content={content} drops={[drop(1)]} />,
    );
    expect(html).not.toContain("lg:h-[calc(100dvh-");
    expect(html).not.toContain("lg:grid-rows-2");
  });
});
