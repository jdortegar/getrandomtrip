import { readFile } from "node:fs/promises";
import { join } from "node:path";

const names = [
  "itinerary-car",
  "itinerary-map-pin",
  "xsed-lockup",
  "experience-get-lost-en",
  "experience-pareja-wordmark",
  "voucher-hotel-bed",
  "voucher-breakfast",
  "voucher-internet",
  "voucher-facilities",
  "voucher-parking",
  "voucher-check-circle",
  "voucher-arrow",
  "voucher-dinner-cloche",
  "voucher-experience-icon",
  "voucher-calendar-check",
  "voucher-location-generic",
  "voucher-pool-sauna",
  "voucher-massage-hands",
  "voucher-healthy-meal",
  "voucher-spa-linen",
  "voucher-alert-triangle-circle",
  "voucher-information-circle",
  "voucher-dinner-alert",
  "voucher-service-sparkle",
] as const;
export interface HtmlAssets {
  logo: Buffer;
  roadmapLogo: string;
  fonts: string;
  icons: Record<string, string>;
}
let cached: Promise<HtmlAssets> | undefined;
export function loadHtmlAssets() {
  if (!cached)
    cached = readAssets().catch((error) => {
      cached = undefined;
      throw error;
    });
  return cached;
}
async function readAssets(): Promise<HtmlAssets> {
  const root = join(process.cwd(), "public/assets");
  const [logo, roadmapLogo, arimo, barlow, inter, interBold, icons] =
    await Promise.all([
    readFile(join(root, "logos/logo_pdf.png")),
    readFile(join(root, "logos/logo_randomtrip.svg"), "utf8"),
    readFile(join(root, "fonts/arimo/Arimo.ttf")),
    readFile(join(root, "fonts/barlow/Barlow-Bold.ttf")),
    readFile(join(root, "fonts/inter/Inter-Regular.woff2")),
    readFile(join(root, "fonts/inter/Inter-Bold.woff2")),
    Promise.all(
      names.map(async (name) => [
        name,
        await readFile(join(root, `pdf/${name}.svg`), "utf8"),
      ]),
    ),
  ]);
  return {
    logo,
    roadmapLogo: roadmapLogo
      .replace(/<\?xml[\s\S]*?\?>/, "")
      .replace(/<!DOCTYPE[\s\S]*?>/, "")
      .replace(/rgb\(229,\s*165,\s*28\)/g, "rgb(8,46,48)")
      .replace(
        /<svg\b[^>]*>/,
        '<svg class="logo" width="243.84" height="61.2" viewBox="0 0 1203 300" preserveAspectRatio="xMidYMid meet">',
      )
      .trim(),
    icons: Object.fromEntries(icons),
    fonts: `@font-face{font-family:Inter;src:url(data:font/woff2;base64,${inter.toString("base64")}) format('woff2');font-weight:400}@font-face{font-family:Inter;src:url(data:font/woff2;base64,${interBold.toString("base64")}) format('woff2');font-weight:700}@font-face{font-family:Arimo;src:url(data:font/ttf;base64,${arimo.toString("base64")}) format('truetype');font-weight:400 700}@font-face{font-family:Barlow;src:url(data:font/ttf;base64,${barlow.toString("base64")}) format('truetype');font-weight:700}`,
  };
}
export function icon(assets: HtmlAssets, name: string, className = "icon") {
  return `<span aria-hidden="true" class="${className}" data-icon="${name}">${assets.icons[name] || ""}</span>`;
}
