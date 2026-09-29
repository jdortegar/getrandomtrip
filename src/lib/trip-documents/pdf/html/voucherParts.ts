import type { PdfLayoutCopy } from "@/lib/types/dictionary";
import type {
  VoucherDetails,
  VoucherItem,
  VoucherProvider,
} from "@/lib/types/VoucherData";
import { icon, type HtmlAssets } from "./htmlAssets";
import { escapeHtml as e, imageData, link, richText } from "./htmlPrimitives";

export interface DetailRow {
  label: string;
  value?: string;
  url?: string;
  payment?: boolean;
}
export function details(
  title: string,
  rows: DetailRow[],
  assets: HtmlAssets,
  name: string,
) {
  return `<section class="details card" data-split><h2 class="section-title"><span class="tile">${icon(assets, name)}</span>${e(title)}</h2><div class="split-content">${rows
    .filter((row) => row.value)
    .map(
      (row) =>
        `<div class="detail-row chunk"><span class="detail-label">${e(row.label)}</span><span class="detail-value ${row.payment ? "payment" : ""}">${link(row.value!, row.url)}</span></div>`,
    )
    .join("")}</div></section>`;
}
export function serviceGrid(
  items: VoucherItem[],
  title: string,
  assets: HtmlAssets,
  activity = false,
) {
  if (!items.length) return "";
  const serviceIcon = (item: VoucherItem) => {
    const key = `${item.id} ${item.title}`.toLowerCase();
    const candidates = activity
      ? ([
          [/water|pool|agua|sauna|piscina/, "voucher-pool-sauna"],
          [/massage|masaje/, "voucher-massage-hands"],
          [/lunch|meal|almuerzo|merienda/, "voucher-healthy-meal"],
          [/equipment|linen|equipamiento|blancos/, "voucher-spa-linen"],
        ] as const)
      : ([
          [/breakfast|desayuno/, "voucher-breakfast"],
          [/wifi|wi-fi|internet/, "voucher-internet"],
          [/parking|estacionamiento/, "voucher-parking"],
        ] as const);
    return (
      candidates.find(([pattern]) => pattern.test(key))?.[1] ||
      "voucher-facilities"
    );
  };
  return `<section class="unit items card" data-split><h2 class="section-title ${activity ? "" : "spacer"}">${activity ? `<span class="tile">${icon(assets, "voucher-service-sparkle")}</span>` : ""}${e(title)}</h2><div class="item-grid split-content">${items.map((item, index) => `<div class="service-item chunk"><span class="puck">${icon(assets, serviceIcon(item))}</span><div class="service-copy"><h3>${e(item.title)}</h3><div class="description">${richText(item.description || "")}</div></div>${icon(assets, "voucher-check-circle", "icon check")}</div>`).join("")}</div></section>`;
}
export function policy(
  title: string,
  paragraphs: string[],
  classes: string,
  assets?: HtmlAssets,
  name?: string,
) {
  return `<section class="policy card ${classes}" data-split><h2 class="section-title ${name ? "" : "spacer"}">${assets && name ? icon(assets, name) : ""}${e(title)}</h2><div class="policy-list split-content ${classes.includes("hotel-policy") ? "" : "dividers"}">${paragraphs
    .filter(Boolean)
    .flatMap((p) => p.split("\n"))
    .map((p) => `<p class="chunk">${e(p)}</p>`)
    .join("")}</div></section>`;
}
export function qrPanel(
  data: VoucherDetails,
  provider: VoucherProvider,
  copy: PdfLayoutCopy,
  images: Record<string, Buffer>,
  hint: string,
) {
  const url =
    data.supplierConfirmationUrl ||
    provider.providerUrl ||
    provider.locationUrl;
  if (!url) return "";
  const confirmation = Boolean(data.supplierConfirmationUrl);
  const image = images[url];
  const description = image ? (confirmation ? hint : copy.qrHint) : copy.linkHint;
  // Confirmation wording is authored, never inferred from merely having a URL.
  return `<section class="qr-panel card"><h2>${e(confirmation ? (data.supplierConfirmation && data.supplierConfirmation.length < 70 && !data.supplierConfirmation.includes("\n") ? data.supplierConfirmation : copy.voucher) : copy.linkHint)}</h2><div class="accent"><strong>${e(image ? copy.qr : copy.linkHint)}</strong><p>${e(description)}</p></div>${image ? `<a href="${e(url)}">${imageData(image, 230, 230, "qr-image")}</a>` : `<p class="url-link">${link(url, url)}</p>`}${provider.providerUrl && provider.providerUrl !== url ? `<p class="url-link">${link(copy.linkHint, provider.providerUrl)}</p>` : ""}</section>`;
}
