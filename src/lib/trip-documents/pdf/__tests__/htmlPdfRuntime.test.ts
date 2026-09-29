// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { HTTPRequest } from "puppeteer-core";
const mocks = vi.hoisted(() => {
  const page = {
    setJavaScriptEnabled: vi.fn(),
    setRequestInterception: vi.fn(),
    on: vi.fn(),
    setViewport: vi.fn(),
    emulateMediaType: vi.fn(),
    setContent: vi.fn(),
    evaluate: vi.fn(),
    pdf: vi.fn(),
  };
  const kill = vi.fn();
  const browser = { newPage: vi.fn(), close: vi.fn(), process: vi.fn() };
  return { page, browser, kill, launch: vi.fn(), executablePath: vi.fn() };
});
vi.mock("puppeteer-core", () => ({ default: { launch: mocks.launch } }));
vi.mock("@sparticuz/chromium", () => ({
  default: { args: ["--packaged"], executablePath: mocks.executablePath },
}));
import { blockPdfRequest, renderHtmlPdf } from "../html/renderHtmlPdf";
const input = { html: "<html>synthetic test</html>", scale: 0.666415439 };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PDF_CHROMIUM_EXECUTABLE_PATH", "/tmp/synthetic-chrome");
  mocks.launch.mockResolvedValue(mocks.browser);
  mocks.browser.newPage.mockResolvedValue(mocks.page);
  mocks.browser.close.mockResolvedValue(undefined);
  mocks.browser.process.mockReturnValue({ exitCode: 0, kill: mocks.kill });
  mocks.page.pdf.mockResolvedValue(Buffer.from("%PDF-test"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("disables scripts and blocks requests before loading self-contained content", async () => {
  expect(await renderHtmlPdf(input)).toEqual(Buffer.from("%PDF-test"));
  expect(mocks.page.setJavaScriptEnabled).toHaveBeenCalledWith(false);
  expect(mocks.page.setRequestInterception).toHaveBeenCalledWith(true);
  expect(
    mocks.page.setJavaScriptEnabled.mock.invocationCallOrder[0],
  ).toBeLessThan(mocks.page.setContent.mock.invocationCallOrder[0]);
  expect(
    mocks.page.setRequestInterception.mock.invocationCallOrder[0],
  ).toBeLessThan(mocks.page.setContent.mock.invocationCallOrder[0]);
  expect(mocks.browser.close).toHaveBeenCalledOnce();
  await renderHtmlPdf(input);
  expect(mocks.launch).toHaveBeenCalledTimes(2);
});
it.each([
  "https://example.com",
  "http://localhost",
  "file:///etc/passwd",
  "ftp://example.com",
  "javascript:alert(1)",
])("blocks %s", async (url) => {
  const request = { url: () => url, abort: vi.fn(), continue: vi.fn() };
  await blockPdfRequest(request as unknown as HTTPRequest);
  expect(request.abort).toHaveBeenCalledWith("blockedbyclient");
  expect(request.continue).not.toHaveBeenCalled();
});
it("allows inline data and about:blank only", async () => {
  for (const url of ["data:image/png;base64,AA==", "about:blank"]) {
    const request = { url: () => url, abort: vi.fn(), continue: vi.fn() };
    await blockPdfRequest(request as unknown as HTTPRequest);
    expect(request.continue).toHaveBeenCalledOnce();
  }
});
it("closes on print failure and releases its slot", async () => {
  mocks.page.pdf.mockRejectedValueOnce(new Error("print failed"));
  await expect(renderHtmlPdf(input)).rejects.toThrow("print failed");
  expect(mocks.browser.close).toHaveBeenCalledOnce();
  await expect(renderHtmlPdf(input)).resolves.toBeInstanceOf(Buffer);
});
it("releases the slot on launch failure", async () => {
  mocks.launch.mockRejectedValueOnce(new Error("launch failed"));
  await expect(renderHtmlPdf(input)).rejects.toThrow("launch failed");
  await expect(renderHtmlPdf(input)).resolves.toBeInstanceOf(Buffer);
});
it("kills its owned process if browser close hangs", async () => {
  vi.useFakeTimers();
  mocks.browser.close.mockReturnValue(new Promise(() => {}));
  mocks.browser.process.mockReturnValue({ exitCode: null, kill: mocks.kill });
  const pending = renderHtmlPdf(input);
  await vi.advanceTimersByTimeAsync(1501);
  await pending;
  expect(mocks.kill).toHaveBeenCalledWith("SIGKILL");
});
it("times out printing, cleans up, and permits a retry", async () => {
  vi.useFakeTimers();
  mocks.page.pdf.mockReturnValueOnce(new Promise(() => {}));
  const pending = expect(renderHtmlPdf(input)).rejects.toThrow(
    "DOCUMENT_PDF_TIMEOUT",
  );
  await vi.advanceTimersByTimeAsync(40_001);
  await pending;
  expect(mocks.browser.close).toHaveBeenCalledOnce();
  await expect(renderHtmlPdf(input)).resolves.toBeInstanceOf(Buffer);
});
it("rejects concurrent work and cleans late browser launch after deadline", async () => {
  vi.useFakeTimers();
  let resolve!: (value: unknown) => void;
  mocks.launch.mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const pending = expect(renderHtmlPdf(input)).rejects.toThrow(
    "DOCUMENT_PDF_TIMEOUT",
  );
  await expect(renderHtmlPdf(input)).rejects.toThrow(
    "DOCUMENT_PDF_RENDER_BUSY",
  );
  await vi.advanceTimersByTimeAsync(40_001);
  await pending;
  await expect(renderHtmlPdf(input)).rejects.toThrow(
    "DOCUMENT_PDF_RENDER_BUSY",
  );
  resolve(mocks.browser);
  await vi.advanceTimersByTimeAsync(0);
  expect(mocks.browser.close).toHaveBeenCalledOnce();
  expect(mocks.browser.newPage).not.toHaveBeenCalled();
  await expect(renderHtmlPdf(input)).resolves.toBeInstanceOf(Buffer);
});
it("enforces input and output memory bounds", async () => {
  await expect(
    renderHtmlPdf({
      html: "x".repeat(12 * 1024 * 1024 + 1),
      scale: 0.666415439,
    }),
  ).rejects.toThrow("DOCUMENT_PDF_INPUT_TOO_LARGE");
  expect(mocks.launch).not.toHaveBeenCalled();
  mocks.page.pdf.mockResolvedValueOnce(Buffer.alloc(4 * 1024 * 1024 + 1));
  await expect(renderHtmlPdf(input)).rejects.toThrow("DOCUMENT_PDF_TOO_LARGE");
  expect(mocks.browser.close).toHaveBeenCalledOnce();
});
it("uses the packaged Linux binary when no explicit override exists", async () => {
  vi.stubEnv("PDF_CHROMIUM_EXECUTABLE_PATH", "");
  const platform = vi
    .spyOn(process, "platform", "get")
    .mockReturnValue("linux");
  mocks.executablePath.mockResolvedValue("/tmp/packaged-chromium");
  try {
    await renderHtmlPdf(input);
    expect(mocks.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        executablePath: "/tmp/packaged-chromium",
        args: ["--packaged"],
        headless: "shell",
      }),
    );
  } finally {
    platform.mockRestore();
  }
});
