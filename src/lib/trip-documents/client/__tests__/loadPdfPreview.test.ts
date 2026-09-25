import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loadPdfPreview } from "../loadPdfPreview";
const { getDocument, createWorker } = vi.hoisted(() => ({
  getDocument: vi.fn(),
  createWorker: vi.fn(),
}));
vi.mock("pdfjs-dist", () => ({
  getDocument,
  PDFWorker: { create: createWorker },
}));
let port: EventTarget & { terminate: ReturnType<typeof vi.fn> };
const terminate = vi.fn(),
  destroy = vi.fn(),
  workerDestroy = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  destroy.mockResolvedValue(undefined);
  createWorker.mockReturnValue({ destroy: workerDestroy });
  getDocument.mockReturnValue({
    promise: Promise.resolve({ numPages: 2 }),
    destroy,
  });
  vi.stubGlobal(
    "Worker",
    class extends EventTarget {
      terminate = terminate;
      constructor() {
        super();
        port = this;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());
it("loads only local blobs using a dedicated module worker and no eval/XFA/worker fetch", async () => {
  const controller = new AbortController();
  await loadPdfPreview("blob:synthetic", controller.signal);
  expect(getDocument).toHaveBeenCalledWith(
    expect.objectContaining({
      url: "blob:synthetic",
      isEvalSupported: false,
      enableXfa: false,
      useWorkerFetch: false,
      useWasm: false,
    }),
  );
  expect(createWorker).toHaveBeenCalledWith({ port });
  controller.abort();
  await Promise.resolve();
  expect(destroy).toHaveBeenCalledOnce();
  expect(workerDestroy).toHaveBeenCalledOnce();
  expect(terminate).toHaveBeenCalledOnce();
});
it("rejects nonblob URLs and aborted loads before creating a worker", async () => {
  await expect(
    loadPdfPreview(
      "https://example.com/private.pdf",
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  const controller = new AbortController();
  controller.abort();
  await expect(
    loadPdfPreview("blob:synthetic", controller.signal),
  ).rejects.toThrow();
  expect(createWorker).not.toHaveBeenCalled();
});
it("cleans workers when loading fails and allows independent retry", async () => {
  getDocument.mockImplementationOnce(() => ({
    promise: Promise.reject(new Error("invalid PDF")),
    destroy,
  }));
  await expect(
    loadPdfPreview("blob:invalid", new AbortController().signal),
  ).rejects.toThrow();
  await Promise.resolve();
  expect(terminate).toHaveBeenCalledOnce();
  const controller = new AbortController();
  await expect(
    loadPdfPreview("blob:valid", controller.signal),
  ).resolves.toMatchObject({ document: { numPages: 2 } });
  controller.abort();
});
it("fails a broken worker instead of leaving loading permanently pending", async () => {
  getDocument.mockReturnValueOnce({ promise: new Promise(() => {}), destroy });
  const controller = new AbortController();
  const pending = loadPdfPreview("blob:synthetic", controller.signal);
  await vi.waitFor(() => expect(getDocument).toHaveBeenCalled());
  port.dispatchEvent(new Event("error"));
  await expect(pending).rejects.toThrow();
  expect(terminate).toHaveBeenCalledOnce();
});
it("signals a post-load worker crash and terminates even when task destruction never settles", async () => {
  destroy.mockReturnValueOnce(new Promise(() => {}));
  const controller = new AbortController();
  const session = await loadPdfPreview("blob:synthetic", controller.signal);
  expect(session).toHaveProperty("failed");
  const failure = expect(session.failed).rejects.toThrow();
  port.dispatchEvent(new Event("messageerror"));
  await failure;
  expect(terminate).toHaveBeenCalledOnce();
});
it("aborts an unfinished load without waiting for PDF task destruction", async () => {
  destroy.mockReturnValueOnce(new Promise(() => {}));
  getDocument.mockReturnValueOnce({ promise: new Promise(() => {}), destroy });
  const controller = new AbortController();
  const pending = loadPdfPreview("blob:synthetic", controller.signal);
  await vi.waitFor(() => expect(getDocument).toHaveBeenCalled());
  controller.abort();
  await expect(pending).rejects.toThrow();
  expect(terminate).toHaveBeenCalledOnce();
});
it("times out a worker that never responds so retry can recover", async () => {
  vi.useFakeTimers();
  try {
    getDocument.mockReturnValueOnce({
      promise: new Promise(() => {}),
      destroy,
    });
    const pending = loadPdfPreview(
      "blob:synthetic",
      new AbortController().signal,
    );
    await vi.waitFor(() => expect(getDocument).toHaveBeenCalled());
    const failure = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(30_000);
    await failure;
    expect(terminate).toHaveBeenCalledOnce();
  } finally {
    vi.useRealTimers();
  }
});
