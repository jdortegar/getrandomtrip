import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { SecondaryHero } from "../SecondaryHero";

const content = {
  ...es.xsedPage.hero,
  title: "Mystery weekend",
  subtitle: "A surprise escape",
  tagline: "Discover somewhere new",
  videoSrc: "",
  fallbackImage: "",
};

it("keeps the XSED hero title free of badge styling", () => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <SecondaryHero content={{ ...content, title: "XSED" }} locale="es" />,
  );
  expect(template.content.querySelector("h2")?.textContent).toBe("XSED");
  expect(template.content.querySelector("h2 .bg-xsed")).toBeNull();
});
function render(scrollIndicator?: boolean) {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <SecondaryHero
      content={content}
      locale="es"
      scrollIndicator={scrollIndicator}
    />,
  );
  return template.content;
}

it("preserves the literal ASCII-quoted decorative scroll copy", () => {
  const fragment = render(true);
  expect(fragment.querySelector("h2")?.textContent).toBe("Mystery weekend");
  const indicators = [
    ...fragment.querySelectorAll('[aria-hidden="true"]'),
  ].filter((element) => element.textContent === '"SCROLL"');
  expect(indicators).toHaveLength(1);
  expect(indicators[0].tagName).toBe("DIV");
});

it.each([false, undefined])(
  "omits the decorative indicator for %s",
  (enabled) => {
    const fragment = render(enabled);
    expect(fragment.querySelector("h2")?.textContent).toBe("Mystery weekend");
    expect(fragment.textContent).not.toContain("SCROLL");
  },
);
