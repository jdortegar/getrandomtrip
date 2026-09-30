// @vitest-environment node
import { readdir } from "node:fs/promises";
import { expect, it } from "vitest";
import { loadHtmlAssets } from "../html/htmlAssets";
import { prepareHtmlDocument } from "../html/prepareHtmlDocument";
import { referenceFixtures } from "./referenceFixtures";

it("keeps only catalogued SVG artwork in the PDF asset directory", async () => {
  const assets = await loadHtmlAssets();
  const files = await readdir("public/assets/pdf");

  expect(files.sort()).toEqual(
    [
      "SOURCE.md",
      ...Object.keys(assets.icons).map((name) => `${name}.svg`),
    ].sort(),
  );
});

it("renders every loaded icon and resolves all icon references", async () => {
  const assets = await loadHtmlAssets();
  const used = new Set<string>();

  for (const locale of ["en", "es"] as const) {
    for (const fixture of referenceFixtures) {
      const { html } = await prepareHtmlDocument({ ...fixture, locale });
      for (const [, name, artwork] of html.matchAll(
        /data-icon="([^"]+)">([\s\S]*?)<\/span>/g,
      )) {
        expect(assets.icons[name], name).toBeTruthy();
        expect(artwork, name).toBe(assets.icons[name]);
        used.add(name);
      }
    }
  }

  expect([...used].sort()).toEqual(Object.keys(assets.icons).sort());
});
