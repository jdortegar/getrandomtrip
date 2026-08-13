import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripDocumentsSection } from "../TripDocumentsSection";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: Pick<
  TripItineraryDict,
  "documentsNote" | "documentsCancelledNote" | "documentsEmpty" | "view" | "download" | "documents"
> = {
  documentsNote: "These are yours alone.",
  documentsCancelledNote: "This trip is cancelled.",
  documentsEmpty: "No documents available.",
  view: "View",
  download: "Download",
  documents: {
    eyebrow: "Everything you need",
    heading: "Your documents",
    lede: "Vouchers and confirmations.",
  },
};

function doc(overrides: Partial<TripDocumentDTO> = {}): TripDocumentDTO {
  return {
    id: "doc-1",
    label: "Hotel Confirmation",
    country: "AR",
    mimeType: "application/pdf",
    originalFilename: "hotel.pdf",
    sizeBytes: 1024,
    createdAt: "2026-08-20T00:00:00.000Z",
    href: "/api/trips/trip-1/documents/doc-1",
    downloadHref: "/api/trips/trip-1/documents/doc-1?download=1",
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(documents: TripDocumentDTO[], status = "REVEALED") {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<TripDocumentsSection copy={copy} documents={documents} status={status} />);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripDocumentsSection", () => {
  it("renders doc.href and doc.downloadHref, never a raw /api/upload URL", () => {
    render([doc()]);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((a) => a.getAttribute("href"));

    expect(hrefs).toContain("/api/trips/trip-1/documents/doc-1");
    expect(hrefs).toContain("/api/trips/trip-1/documents/doc-1?download=1");
    expect(hrefs.some((h) => h?.includes("/api/upload"))).toBe(false);
  });

  it("shows documentsNote for a non-cancelled trip", () => {
    render([doc()], "REVEALED");
    expect(container.textContent).toContain("These are yours alone.");
  });

  it("shows documentsCancelledNote instead when the trip is CANCELLED", () => {
    render([doc()], "CANCELLED");
    expect(container.textContent).toContain("This trip is cancelled.");
    expect(container.textContent).not.toContain("These are yours alone.");
  });

  it("shows the empty state when there are no documents", () => {
    render([]);
    expect(container.textContent).toContain("No documents available.");
  });

  it("derives a mimeType-based tag and shows the country and label — no fabricated fields", () => {
    render([doc({ mimeType: "image/jpeg", country: "MX" })]);
    const text = container.textContent ?? "";
    expect(text).toContain("Hotel Confirmation");
    expect(text).toContain("JPEG");
    expect(text).toContain("MX");
    expect(text).not.toMatch(/Conf\.\s*#/i);
  });
});
