import { parseXsedRoadmap } from "../parsers/xsedRoadmap";
import { prepareHtmlDocument } from "./html/prepareHtmlDocument";
import { renderHtmlPdf } from "./html/renderHtmlPdf";

/** Validates before preparing local assets; preserves the existing draft render contract. */
export async function renderXsedRoadmap(
  input: unknown,
  render = renderHtmlPdf,
) {
  const parsed = parseXsedRoadmap(input, "generation");
  if (!parsed.ok) return parsed;
  const buffer = await render(await prepareHtmlDocument(parsed.value));
  if (buffer.length > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  return { ok: true as const, buffer };
}
