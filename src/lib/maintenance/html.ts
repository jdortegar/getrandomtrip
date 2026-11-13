/**
 * Self-contained HTML for the maintenance screen, served by the proxy with
 * HTTP 503 so no app page runs and nothing of the real site is shipped.
 * Copy comes from the `maintenance` dictionary section; colors are the brand
 * tokens from `globals.css` (ground, ink, primary), inlined on purpose.
 */
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Locale } from "@/lib/i18n/config";

const COPY: Record<Locale, typeof en.maintenance> = {
  en: en.maintenance,
  es: es.maintenance,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMaintenanceHtml(locale: Locale): string {
  const copy = COPY[locale];
  const title = escapeHtml(copy.title);
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | Randomtrip</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow&family=Barlow+Condensed:wght@700&display=swap">
<style>
*{box-sizing:border-box;margin:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:4rem 1rem;background:#F3F2ED;color:#383838;font-family:Barlow,system-ui,sans-serif;text-align:center}
main{width:100%;max-width:36rem;display:flex;flex-direction:column;align-items:center}
img{height:4rem;width:auto}
.eyebrow{margin-top:3rem;font-size:.75rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#0F5C60}
h1{margin-top:.75rem;font-family:"Barlow Condensed",system-ui,sans-serif;font-weight:700;font-size:2.25rem;line-height:1;text-transform:uppercase}
.message{margin-top:1.5rem;font-size:1rem;line-height:1.625;color:#404040}
@media (min-width:768px){img{height:6rem}h1{font-size:3.75rem}.message{font-size:1.125rem}}
</style>
</head>
<body>
<main>
<img src="/assets/logos/logo_randomtrip_no_tag.svg" alt="Randomtrip">
<p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
<h1>${title}</h1>
<p class="message">${escapeHtml(copy.message)}</p>
</main>
</body>
</html>`;
}
