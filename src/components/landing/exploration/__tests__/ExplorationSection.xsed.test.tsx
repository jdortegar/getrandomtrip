import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { ExplorationSection } from "../ExplorationSection";

vi.mock("../TravelerTypesCarousel", () => ({ TravelerTypesCarousel: () => null }));

it("keeps the XSED exploration tab free of badge styling", () => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <ExplorationSection content={es.home.exploration} />,
  );
  const product = Array.from(template.content.querySelectorAll("button")).find(
    (button) => button.textContent === "XSED",
  );
  expect(product?.type).toBe("button");
  expect(product?.querySelector(".bg-xsed")).toBeNull();
});
