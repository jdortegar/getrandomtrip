import type { PdfPreviewSession } from "../../types/PdfPreviewSession";
import type { PDFDocumentLoadingTask, PDFWorker } from "pdfjs-dist";

/** Core canvas API only: no scripting manager, annotation actions or remote viewer. */
export async function loadPdfPreview(
  url: string,
  signal: AbortSignal,
): Promise<PdfPreviewSession> {
  if (!url.startsWith("blob:")) throw new Error("Invalid preview source");
  const pdfjs = await import("pdfjs-dist");
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const port = new Worker(new URL("./pdfPreview.worker.ts", import.meta.url), {
    type: "module",
  });
  let worker: PDFWorker | undefined;
  let task: PDFDocumentLoadingTask | undefined;
  let destroyed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectPending: (error: Error) => void = () => {};
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
    port.removeEventListener("error", onError);
    port.removeEventListener("messageerror", onError);
    if (task) void task.destroy().catch(() => undefined);
    worker?.destroy();
    port.terminate();
  };
  function onAbort() {
    destroy();
    rejectPending(new DOMException("Aborted", "AbortError"));
  }
  function onError() {
    destroy();
    rejectPending(new Error("PDF worker unavailable"));
  }
  try {
    worker = pdfjs.PDFWorker.create({ port });
    task = pdfjs.getDocument({
      url,
      worker,
      isEvalSupported: false,
      enableXfa: false,
      useWorkerFetch: false,
      useWasm: false,
      maxImageSize: 8 * 1024 * 1024,
      canvasMaxAreaInBytes: 32 * 1024 * 1024,
    });
    const failed = new Promise<never>((_resolve, reject) => {
      rejectPending = reject;
    });
    signal.addEventListener("abort", onAbort, { once: true });
    port.addEventListener("error", onError);
    port.addEventListener("messageerror", onError);
    timer = setTimeout(onError, 30_000);
    const document = await Promise.race([task.promise, failed]);
    clearTimeout(timer);
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    return { document, failed };
  } catch (error) {
    destroy();
    throw error;
  }
}
