import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const routing = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: routing.locale }),
}));

let container: HTMLDivElement;
let root: Root;

function render(props: Partial<ComponentProps<typeof ImageUploadTile>> = {}) {
  act(() =>
    root.render(
      <ImageUploadTile
        onRemove={() => {}}
        onSelect={() => {}}
        uploadLabel="Upload"
        value={null}
        {...props}
      />,
    ),
  );
}

function hintTexts() {
  return Array.from(container.querySelectorAll("p")).map((p) => p.textContent);
}

beforeEach(() => {
  routing.locale = "es";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ImageUploadTile", () => {
  it("renders es hints in order below the tile", () => {
    render({ minWidth: 1280, minHeight: 720 });

    expect(hintTexts()).toEqual([
      "JPG, PNG o WebP.",
      "Mínimo 1280 × 720 px recomendado",
      "Usa solo imágenes de tu propiedad o con licencia de uso.",
    ]);
    const tile = container.querySelector("button")!;
    const firstHint = container.querySelector("p")!;
    expect(
      tile.compareDocumentPosition(firstHint) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("omits the min-size line without a minimum", () => {
    render();

    expect(hintTexts()).toEqual([
      "JPG, PNG o WebP.",
      "Usa solo imágenes de tu propiedad o con licencia de uso.",
    ]);
  });

  it("renders en copy for the en locale", () => {
    routing.locale = "en";
    render({ minWidth: 800, minHeight: 600 });

    expect(hintTexts()).toEqual([
      "JPG, PNG or WebP.",
      "Minimum 800 × 600 px recommended",
      "Only use images you own or are licensed to use.",
    ]);
  });

  it("restricts the picker to JPG, PNG and WebP", () => {
    render();

    expect(
      container.querySelector('input[type="file"]')!.getAttribute("accept"),
    ).toBe("image/jpeg,image/png,image/webp");
  });
});
