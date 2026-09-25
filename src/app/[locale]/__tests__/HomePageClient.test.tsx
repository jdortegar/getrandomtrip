import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { HomePageClient } from "../HomePageClient";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const routing = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: routing.locale }),
}));
vi.mock("@/components/Hero", () => ({
  default: () => <section data-component="Hero" />,
}));
vi.mock("@/components/HomeInfo", () => ({
  default: () => <section data-component="HomeInfo" />,
}));
vi.mock("@/components/landing/exploration", () => ({
  ExplorationSection: () => null,
}));
vi.mock("@/components/Blog", () => ({ default: () => null }));
vi.mock("@/components/app/xsed/XsedHero", () => ({ XsedHero: () => null }));
vi.mock("@/components/Testimonials/Testimonials", () => ({
  default: () => null,
}));

it.each([
  { locale: "es", copy: es.home.trustSignal },
  { locale: "en", copy: en.home.trustSignal },
])("places localized TrustSignal directly below Hero ($locale)", (test) => {
  routing.locale = test.locale;
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <HomePageClient blogPosts={[]} trippers={[]} />,
  );
  const hero = template.content.querySelector('[data-component="Hero"]');
  const trustSignal = template.content.querySelector(
    '[data-component="TrustSignal"]',
  );

  expect(trustSignal).not.toBeNull();
  expect(hero?.nextElementSibling).toBe(trustSignal);
  expect(trustSignal?.nextElementSibling?.getAttribute("data-component")).toBe(
    "HomeInfo",
  );
  expect(trustSignal?.getAttribute("aria-label")).toBe(
    test.copy.sectionAriaLabel,
  );
  expect(trustSignal?.querySelectorAll("li")).toHaveLength(4);
});
