import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ExcuseCard from "../ExcuseCard";
import {
  createDomHarness,
  type DomHarness,
} from "../../ui/__tests__/test-dom-utils";

let harness: DomHarness;
beforeEach(() => {
  harness = createDomHarness();
});
afterEach(() => harness.unmount());

const card = (onClick?: () => void) => (
  <ExcuseCard
    ctaLabel="Elegir"
    description="Desc"
    imageUrl="/x.jpg"
    onClick={onClick}
    title="Title"
  />
);

it("renders a single button so the CTA never nests inside the card button", () => {
  const html = renderToString(card());
  expect(html.match(/<button/g)).toHaveLength(1);
  expect(html).toContain('type="button"');
  expect(html).toContain("Elegir");
});

it("fires onClick once when the CTA is clicked", () => {
  const onClick = vi.fn();
  harness.render(card(onClick));
  harness.click(harness.container.querySelector("span.py-1") as Element);
  expect(onClick).toHaveBeenCalledTimes(1);
});
