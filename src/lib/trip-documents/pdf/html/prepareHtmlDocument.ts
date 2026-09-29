import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import { createQrImages } from "../qrImages";
import { loadHtmlAssets } from "./htmlAssets";
import { escapeHtml } from "./htmlPrimitives";
import { htmlStyles } from "./htmlStyles";
import { roadmapHtml } from "./roadmapHtml";
import { voucherHtml } from "./voucherHtml";
export interface HtmlPdfDocument {
  html: string;
  scale: number;
}
export async function prepareHtmlDocument(
  document:
    | HotelVoucherDocument
    | DinnerVoucherDocument
    | ActivityVoucherDocument
    | ExperienceRoadmapDocument
    | XsedRoadmapDocument,
): Promise<HtmlPdfDocument> {
  const assets = await loadHtmlAssets();
  const data = document.data;
  let content;
  if (
    document.template === "xsed-roadmap" ||
    document.template === "experience-roadmap"
  )
    content = roadmapHtml(document, assets);
  else {
    const provider =
      "property" in data
        ? data.property
        : "restaurant" in data
          ? data.restaurant
          : "provider" in data
            ? data.provider
            : undefined;
    const images = await createQrImages([
      "supplierConfirmationUrl" in data
        ? data.supplierConfirmationUrl
        : undefined,
      provider?.locationUrl,
      provider?.providerUrl,
    ]);
    content = voucherHtml(document, assets, images);
  }
  return {
    scale: document.template.endsWith("roadmap") ? 0.645126256 : 0.666415439,
    html: `<!doctype html><html lang="${document.locale}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHtml(document.label)}</title><style>${assets.fonts}${htmlStyles}</style></head><body class="${content.className}"><article class="sheet"><main class="page-content">${content.body}</main><footer class="footer">${content.footer}</footer></article></body></html>`,
  };
}
