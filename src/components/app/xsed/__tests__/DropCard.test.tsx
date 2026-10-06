import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DropEntry } from "@/types/core";
import { DropCard } from "../DropCard";

const baseDrop: DropEntry = {
  date: "20 FEBRERO 2026",
  image: "/images/drops/drops-mendoza.jpg",
  number: 5,
  slug: "my-drop",
  title: "Mendoza",
};

function renderBadge(drop: DropEntry): Element | null {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(<DropCard drop={drop} />);
  return template.content.querySelector("[data-drop-badge]");
}

describe("DropCard badge", () => {
  it("shows the orange bar, the XSED word and the stored label", () => {
    expect(renderBadge({ ...baseDrop, label: "[AR], [MENDOZA]" })?.textContent).toBe(
      "|XSED[AR], [MENDOZA]",
    );
  });

  it("renders without a background: thin white XSED and bold orange label", () => {
    const badge = renderBadge({ ...baseDrop, label: "Nº1 · my escape" });
    expect(badge?.className).not.toContain("bg-");
    const [, word, label] = Array.from(badge?.children ?? []);
    expect(word.className).toContain("font-light");
    expect(label.className).toContain("text-xsed");
    expect(label.textContent).toBe("Nº1 · my escape");
  });

  it("renders no badge when there is no label", () => {
    expect(renderBadge(baseDrop)).toBeNull();
  });
});

describe("DropCard mosaic fill", () => {
  it("fills the cell so a height-capped grid can shrink the image", () => {
    const html = renderToStaticMarkup(
      <DropCard drop={baseDrop} featured fill />,
    );
    expect(html).toContain("h-full");
    expect(html).toContain("min-h-0");
    expect(html).toContain("lg:flex-1");
  });
});
