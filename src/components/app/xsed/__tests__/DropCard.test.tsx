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

function badgeText(drop: DropEntry): string {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(<DropCard drop={drop} />);
  return template.content.querySelector("[data-drop-badge]")?.textContent ?? "";
}

describe("DropCard badge", () => {
  it("shows the stored label when present", () => {
    expect(badgeText({ ...baseDrop, label: "XSED Nº1 (AR)" })).toBe("|XSED Nº1 (AR)");
  });

  it("falls back to the drop number when there is no label", () => {
    expect(badgeText(baseDrop)).toBe("|XSEDNº5");
  });
});
