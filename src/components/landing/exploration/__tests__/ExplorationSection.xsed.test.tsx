import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { ExplorationSection } from "../ExplorationSection";

vi.mock("../TravelerTypesCarousel", () => ({ TravelerTypesCarousel: () => null }));

afterEach(() => vi.unstubAllEnvs());

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

function tabLabels() {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <ExplorationSection content={es.home.exploration} />,
  );
  return Array.from(template.content.querySelectorAll("button")).map(
    (button) => button.textContent,
  );
}

it("hides the top trippers tab in production", () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "production");
  const topTrippers = es.home.exploration.tabs.find((t) => t.id === "topTrippers")!;
  const byTraveller = es.home.exploration.tabs.find((t) => t.id === "byTraveller")!;
  const labels = tabLabels();
  expect(labels).not.toContain(topTrippers.label);
  expect(labels[0]).toBe(byTraveller.label);
});

it("shows the top trippers tab in nonproduction", () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
  const topTrippers = es.home.exploration.tabs.find((t) => t.id === "topTrippers")!;
  expect(tabLabels()).toContain(topTrippers.label);
});
