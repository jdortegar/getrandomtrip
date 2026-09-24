import QRCode from "qrcode";
import { isHttpsUrl } from "../validationPrimitives";

/** Optional authored URLs automatically receive local QR images. Preserve the
 * clickable link alone above 2,000 UTF-8 bytes (QR capacity/readability limit).
 * Never fetch, shorten, normalize or substitute the authored destination.
 */
export async function createQrImages(urls: readonly (string | undefined)[]) {
  if (urls.length > 8) throw new Error("DOCUMENT_QR_INPUT_LIMIT");
  const images: Record<string, Buffer> = {};
  for (const url of new Set(urls)) {
    if (!isHttpsUrl(url) || Buffer.byteLength(url, "utf8") > 2000) continue;
    images[url] = await QRCode.toBuffer(url, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 4,
      scale: 4,
    });
  }
  return images;
}
