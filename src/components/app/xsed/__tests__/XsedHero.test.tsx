import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { XsedHero } from "../XsedHero";

it.each([
  ["en", en],
  ["es", es],
])("renders the banner's own notify copy, not the hero's (%s)", (_, dict) => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <XsedHero content={dict.xsedPage.xsedHero} />,
  );
  const text = template.content.textContent ?? "";
  const helper = document.createElement("div");
  helper.innerHTML = dict.xsedPage.xsedHero.helper;

  expect(text).toContain(helper.textContent);
  expect(text).toContain(dict.xsedPage.xsedHero.submitLabel);
});

it.each([
  ["en", en],
  ["es", es],
])("renders the home page banner's notify copy (%s)", (_, dict) => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <XsedHero content={dict.home.xsedHero} />,
  );
  const text = template.content.textContent ?? "";
  const helper = document.createElement("div");
  helper.innerHTML = dict.home.xsedHero.helper;

  expect(text).toContain(helper.textContent);
  expect(text).toContain(dict.home.xsedHero.submitLabel);
});
