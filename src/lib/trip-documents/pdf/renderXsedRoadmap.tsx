import { registerPdfFonts } from "./pdfFonts";
import { createQrImages } from "./qrImages";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { parseXsedRoadmap } from "../parsers/xsedRoadmap";
import { XsedRoadmapPdf } from "./XsedRoadmapPdf";

/** Node-only boundary: local brand asset, no URL fetch, persistence or attachment. */
export async function renderXsedRoadmap(
  input: unknown,
  render = renderToBuffer,
) {
  const parsed = parseXsedRoadmap(input, "generation");
  if (!parsed.ok) return parsed;
  registerPdfFonts();
  const qrImages = await createQrImages([parsed.value.data.mapUrl]);
  const logo = await readFile(
    join(process.cwd(), "public/assets/icons/isologo.png"),
  );
  const buffer = await render(
    <XsedRoadmapPdf document={parsed.value} logo={logo} qrImages={qrImages} />,
  );
  if (buffer.length > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  return { ok: true as const, buffer };
}
