"use client";
import type { PdfPreviewSession } from "@/lib/types/PdfPreviewSession";
import { useEffect, useRef, useState } from "react";
import type { PDFPageProxy, RenderTask } from "pdfjs-dist";
import { loadPdfPreview } from "@/lib/trip-documents/client/loadPdfPreview";

/** A single page/bitmap is owned by each render key; late work never paints its successor. */
export function usePdfCanvasPreview(url: string) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const locked = useRef(false);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [owner, setOwner] = useState(url);
  const [generation, setGeneration] = useState(0);
  const [action, setAction] = useState<"previous" | "next" | "retry" | null>(
    null,
  );
  const [loaded, setLoaded] = useState<{
    key: string;
    session: PdfPreviewSession;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; error: boolean } | null>(
    null,
  );
  if (owner !== url) {
    setOwner(url);
    setGeneration((value) => value + 1);
    setPage(1);
    setAction(null);
  }
  const loadKey = JSON.stringify([url, attempt, generation]);
  const session = loaded?.key === loadKey ? loaded.session : null;
  const document = session?.document;
  const renderKey = JSON.stringify([loadKey, page, width]);
  const error =
    loadError === loadKey || (result?.key === renderKey && result.error);
  const busy = !error && (!document || result?.key !== renderKey);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(1, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadPdfPreview(url, controller.signal)
      .then((session) => {
        if (!controller.signal.aborted) {
          setLoaded({ key: loadKey, session });
          void session.failed.catch(() => {
            if (!controller.signal.aborted) {
              setLoadError(loadKey);
              setAction(null);
              locked.current = false;
            }
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError(loadKey);
          setAction(null);
          locked.current = false;
        }
      });
    return () => {
      controller.abort();
      locked.current = false;
    };
  }, [url, loadKey]);
  useEffect(() => {
    const element = canvas.current;
    if (!document || !session || !width || !element) return;
    let disposed = false;
    let task: RenderTask | undefined;
    let currentPage: PDFPageProxy | undefined;
    void (async () => {
      try {
        currentPage = await Promise.race([
          document.getPage(page),
          session.failed,
        ]);
        if (disposed) return;
        const original = currentPage.getViewport({ scale: 1 });
        if (
          !Number.isFinite(original.width + original.height) ||
          original.width <= 0 ||
          original.height <= 0
        )
          throw new Error("Invalid page size");
        const viewport = currentPage.getViewport({
          scale: Math.min(width, 1600) / original.width,
        });
        const ratio = Math.min(
          window.devicePixelRatio || 1,
          2,
          4096 / viewport.width,
          4096 / viewport.height,
          Math.sqrt((4 * 1024 * 1024) / (viewport.width * viewport.height)),
        );
        element.width = Math.max(1, Math.floor(viewport.width * ratio));
        element.height = Math.max(1, Math.floor(viewport.height * ratio));
        element.style.width = `${viewport.width}px`;
        element.style.height = `${viewport.height}px`;
        task = currentPage.render({
          canvas: element,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        await Promise.race([task.promise, session.failed]);
        if (!disposed) setResult({ key: renderKey, error: false });
      } catch {
        task?.cancel();
        if (!disposed) setResult({ key: renderKey, error: true });
      } finally {
        currentPage?.cleanup();
        if (!disposed) {
          locked.current = false;
          setAction(null);
        }
      }
    })();
    return () => {
      disposed = true;
      task?.cancel();
      element.width = 0;
      element.height = 0;
    };
  }, [document, session, page, renderKey, width]);
  function navigate(direction: "previous" | "next") {
    if (busy || locked.current || !document) return;
    const next = page + (direction === "next" ? 1 : -1);
    if (next < 1 || next > document.numPages) return;
    locked.current = true;
    setAction(direction);
    setPage(next);
  }
  function retry() {
    if (busy || locked.current) return;
    locked.current = true;
    setAction("retry");
    setAttempt((value) => value + 1);
  }
  return {
    container,
    canvas,
    renderKey,
    page,
    total: document?.numPages ?? 0,
    busy,
    error,
    action,
    navigate,
    retry,
  };
}
