import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { parseDinnerVoucher } from "../parsers/dinnerVoucher";
import { DinnerVoucherPdf } from "./DinnerVoucherPdf";

/** Node-only boundary: local brand asset, no URL fetch, persistence or attachment. */
export async function renderDinnerVoucher(
  input: unknown,
  render = renderToBuffer,
) {
  const parsed = parseDinnerVoucher(input, "generation");
  if (!parsed.ok) return parsed;
  const logo = await readFile(
    join(process.cwd(), "public/assets/icons/isologo.png"),
  );
  const buffer = await render(
    <DinnerVoucherPdf document={parsed.value} logo={logo} />,
  );
  if (buffer.length > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  return { ok: true as const, buffer };
}
