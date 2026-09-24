import { createQrImages } from "./qrImages";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { parseActivityVoucher } from "../parsers/activityVoucher";
import { ActivityVoucherPdf } from "./ActivityVoucherPdf";

/** Node-only boundary: local brand asset, no URL fetch, persistence or attachment. */
export async function renderActivityVoucher(
  input: unknown,
  render = renderToBuffer,
) {
  const parsed = parseActivityVoucher(input, "generation");
  if (!parsed.ok) return parsed;
  const qrImages = await createQrImages([
    parsed.value.data.provider.locationUrl,
    parsed.value.data.provider.providerUrl,
  ]);
  const logo = await readFile(
    join(process.cwd(), "public/assets/icons/isologo.png"),
  );
  const buffer = await render(
    <ActivityVoucherPdf
      document={parsed.value}
      logo={logo}
      qrImages={qrImages}
    />,
  );
  if (buffer.length > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  return { ok: true as const, buffer };
}
