import { registerPdfFonts } from "./pdfFonts";
import { createQrImages } from "./qrImages";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { parseHotelVoucher } from "../parsers/hotelVoucher";
import { HotelVoucherPdf } from "./HotelVoucherPdf";

/** Node-only boundary: local brand asset, no URL fetch, persistence or attachment. */
export async function renderHotelVoucher(
  input: unknown,
  render = renderToBuffer,
) {
  const parsed = parseHotelVoucher(input, "generation");
  if (!parsed.ok) return parsed;
  registerPdfFonts();
  const qrImages = await createQrImages([
    parsed.value.data.property.locationUrl,
    parsed.value.data.property.providerUrl,
  ]);
  const logo = await readFile(
    join(process.cwd(), "public/assets/icons/isologo.png"),
  );
  const buffer = await render(
    <HotelVoucherPdf document={parsed.value} logo={logo} qrImages={qrImages} />,
  );
  if (buffer.length > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  return { ok: true as const, buffer };
}
