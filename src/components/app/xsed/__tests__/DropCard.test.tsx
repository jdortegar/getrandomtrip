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
  it("shows the stored label when present", () => {
    expect(renderBadge({ ...baseDrop, label: "XSED Nº1 (AR)" })?.textContent).toBe(
      "|XSED Nº1 (AR)",
    );
  });

  it("renders no badge when there is no label", () => {
    expect(renderBadge(baseDrop)).toBeNull();
  });
});
