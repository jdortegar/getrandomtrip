import { localChromiumPath } from "./localChromiumPath";
import puppeteer, { type Browser, type HTTPRequest } from "puppeteer-core";
import { paginateHtmlDocument } from "./paginateHtmlDocument";
import type { HtmlPdfDocument } from "./prepareHtmlDocument";

const DEADLINE_MS = 40_000;
let busy = false;

async function closeBrowser(browser: Browser) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      browser.close(),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 1500);
      }),
    ]);
  } catch {
    // Killing the owned process below also covers close protocol failures.
  } finally {
    if (timer) clearTimeout(timer);
    const process = browser.process();
    if (process && process.exitCode === null) {
      try {
        process.kill("SIGKILL");
      } catch {
        /* Process may already have exited. */
      }
    }
  }
}
export function blockPdfRequest(request: HTTPRequest) {
  const allowed = /^(data:|about:blank$)/.test(request.url());
  return allowed ? request.continue() : request.abort("blockedbyclient");
}
async function launchBrowser() {
  const override = await localChromiumPath();
  if (override) {
    return puppeteer.launch({
      executablePath: override,
      headless: "shell",
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      timeout: 15_000,
    });
  }
  if (process.platform !== "linux")
    throw new Error("DOCUMENT_PDF_LOCAL_EXECUTABLE_REQUIRED");
  const { default: chromium } = await import("@sparticuz/chromium");
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: "shell",
    timeout: 15_000,
  });
}
/** Node-only print boundary. No user URLs, JavaScript, browser session, storage,
 * or external asset loads. One bounded render per process; callers can retry.
 */
export async function renderHtmlPdf(input: HtmlPdfDocument): Promise<Buffer> {
  if (busy) throw new Error("DOCUMENT_PDF_RENDER_BUSY");
  if (Buffer.byteLength(input.html) > 12 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_INPUT_TOO_LARGE");
  busy = true;
  let browser: Browser | undefined;
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = async () => {
    const launched = await launchBrowser();
    if (expired) {
      await closeBrowser(launched);
      throw new Error("DOCUMENT_PDF_TIMEOUT");
    }
    browser = launched;
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      void blockPdfRequest(request).catch(() => undefined);
    });
    await page.setViewport({ width: 1200, height: 1740, deviceScaleFactor: 1 });
    await page.emulateMediaType("print");
    await page.setContent(input.html, { waitUntil: "load", timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // esbuild/tsx may insert its identity name helper into serialized functions.
    // This trusted lexical shim keeps pagination self-contained in both builds.
    await page.evaluate(
      `{ const __name = (fn) => fn; (${paginateHtmlDocument.toString()})(); }`,
    );
    const bytes = await page.pdf({
      format: "A4",
      scale: input.scale,
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 15_000,
    });
    if (bytes.length > 4 * 1024 * 1024)
      throw new Error("DOCUMENT_PDF_TOO_LARGE");
    return Buffer.from(bytes);
  };
  let settled = false;
  const pending = work().finally(() => {
    settled = true;
    if (expired && !browser) busy = false;
  });
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error("DOCUMENT_PDF_TIMEOUT"));
        }, DEADLINE_MS);
      }),
    ]);
  } finally {
    expired = true;
    if (timer) clearTimeout(timer);
    try {
      if (browser) await closeBrowser(browser);
    } finally {
      // A late launch retains the slot until its own cleanup finishes.
      if (browser || settled) busy = false;
    }
  }
}
