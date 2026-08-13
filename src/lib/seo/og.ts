/**
 * Next.js does not deep-merge nested `metadata.openGraph` objects between a
 * layout and its child pages — a page that returns its own `openGraph`
 * block fully replaces the layout's, silently dropping `images` if the
 * page doesn't repeat it. Every page-level `generateMetadata` that defines
 * `openGraph` MUST spread this into `images` to keep the OG image.
 */
export const DEFAULT_OG_IMAGE = {
  alt: "Randomtrip",
  height: 1200,
  url: "/images/opengraph.png",
  width: 1800,
};
