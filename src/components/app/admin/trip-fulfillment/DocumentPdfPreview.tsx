"use client";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { DocumentActionButton } from "./DocumentActionButton";
import { usePdfCanvasPreview } from "./usePdfCanvasPreview";
import styles from "./fulfillment.module.css";
interface Props {
  copy: MarketingDictionary["documentPreview"];
  url: string;
}
export function DocumentPdfPreview({ copy, url }: Props) {
  const {
    container,
    canvas,
    renderKey,
    page,
    total,
    busy,
    error,
    action,
    navigate,
    retry,
  } = usePdfCanvasPreview(url);
  const label = copy.page
    .replace("{page}", String(page))
    .replace("{total}", String(total));
  return (
    <div
      aria-busy={busy}
      className="flex h-full min-h-0 flex-col bg-gray-50"
      data-component="DocumentPdfPreview"
    >
      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-scroll"
        ref={container}
      >
        {busy && (
          <p
            className="flex items-center justify-center gap-2 p-4"
            role="status"
          >
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {copy.loading}
          </p>
        )}
        {error && (
          <p className="p-4 text-center" role="alert">
            {copy.error}
          </p>
        )}
        <canvas
          aria-label={label}
          className="mx-auto block max-w-full bg-white"
          hidden={busy || error}
          key={renderKey}
          ref={canvas}
          role="img"
        />
      </div>
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-gray-200 bg-white p-2">
        {error || action === "retry" ? (
          <DocumentActionButton
            className={styles.btn}
            disabled={busy}
            onClick={retry}
            pending={action === "retry" && busy}
            pendingLabel={copy.loading}
            type="button"
          >
            {copy.retry}
          </DocumentActionButton>
        ) : (
          <>
            <DocumentActionButton
              aria-label={copy.previous}
              className={styles.btn}
              disabled={busy || page <= 1}
              onClick={() => navigate("previous")}
              pending={action === "previous" && busy}
              pendingLabel={copy.loadingPage}
              type="button"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{copy.previous}</span>
            </DocumentActionButton>
            <span
              aria-live="polite"
              className="whitespace-nowrap text-sm text-neutral-500"
            >
              {total ? label : copy.loading}
            </span>
            <DocumentActionButton
              aria-label={copy.next}
              className={styles.btn}
              disabled={busy || page >= total}
              onClick={() => navigate("next")}
              pending={action === "next" && busy}
              pendingLabel={copy.loadingPage}
              type="button"
            >
              <span className="sr-only sm:not-sr-only">{copy.next}</span>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </DocumentActionButton>
          </>
        )}
      </div>
    </div>
  );
}
