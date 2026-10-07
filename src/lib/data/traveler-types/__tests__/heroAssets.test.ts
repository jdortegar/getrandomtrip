import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTravelerType, TRAVELER_TYPE_SLUGS } from "..";

// A missing hero still renders SafeImage's logo fallback instead of the photo.
const publicPath = (asset: string) =>
  path.join(process.cwd(), "public", asset.split(/[?#]/)[0]);

describe.each(["es", "en"])("traveler type hero assets (%s)", (locale) => {
  it.each(TRAVELER_TYPE_SLUGS)("%s hero media exists in public/", (slug) => {
    const hero = getTravelerType(slug, locale)?.content.hero;
    const assets = [hero?.fallbackImage, hero?.videoSrc].filter(
      (asset): asset is string => Boolean(asset?.startsWith("/")),
    );

    for (const asset of assets) {
      expect(existsSync(publicPath(asset)), asset).toBe(true);
    }
  });
});
