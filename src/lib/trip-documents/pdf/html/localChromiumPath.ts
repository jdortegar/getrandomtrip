import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute } from "node:path";

/** Predictable OS-installed browser locations only; never depend on a personal
 * Playwright/Puppeteer cache or download executable code at request time.
 */
export async function localChromiumPath() {
  const override = process.env.PDF_CHROMIUM_EXECUTABLE_PATH;
  if (override) {
    if (!isAbsolute(override))
      throw new Error("DOCUMENT_PDF_EXECUTABLE_MUST_BE_ABSOLUTE");
    return override;
  }
  if (process.platform === "linux") return undefined;
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          `${process.env.PROGRAMFILES || "C:\\Program Files"}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.PROGRAMFILES || "C:\\Program Files"}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ];
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      /* Try next installed browser. */
    }
  }
  throw new Error("DOCUMENT_PDF_LOCAL_EXECUTABLE_REQUIRED");
}
