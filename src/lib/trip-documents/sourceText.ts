import { toPlainText } from "@react-email/components";
import type { DocumentSourceTextFormat } from "@/lib/types/DocumentSourceText";
import {
  isBoundedDocumentRequest,
  isBoundedDocumentText,
} from "./validationPrimitives";

const TRUNCATION_MARKER = "\u0000document-source-limit\u0000";
const MAX_HTML_DEPTH = 64;
const MAX_HTML_CHILDREN = 4096;

/** Creation-only conversion: callers identify HTML fields; plain content is never guessed. */
export function normalizeSourceText(
  value: unknown,
  format: DocumentSourceTextFormat = "plain",
): string {
  if (!isBoundedDocumentRequest(value)) return "";
  if (format === "plain") return isBoundedDocumentText(value) ? value : "";
  try {
    const output = toPlainText(value, {
      // Body discovery truncates silently; the full-fragment walker emits our marker.
      baseElements: { selectors: [], returnDomByDefault: true },
      limits: {
        maxDepth: MAX_HTML_DEPTH,
        maxChildNodes: MAX_HTML_CHILDREN,
        ellipsis: TRUNCATION_MARKER,
      },
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "head", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        ...["h1", "h2", "h3", "h4", "h5", "h6"].map((selector) => ({
          selector,
          options: { uppercase: false },
        })),
      ],
    }).replace(/\u00a0/g, " ");
    return isBoundedDocumentText(output) &&
      output.trim() &&
      !output.includes(TRUNCATION_MARKER)
      ? output
      : "";
  } catch {
    return "";
  }
}
