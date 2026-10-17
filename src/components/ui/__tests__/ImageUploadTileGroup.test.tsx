import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUploadTileGroup } from "@/components/ui/ImageUploadTileGroup";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const routing = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: routing.locale }),
}));

let container: HTMLDivElement;
let root: Root;

function render(
  props: Partial<ComponentProps<typeof ImageUploadTileGroup>> = {},
) {
  act(() =>
    root.render(
      <ImageUploadTileGroup
        onAdd={() => {}}
        onRemove={() => {}}
        uploadLabel="Upload"
        values={["/a.jpg", "/b.jpg"]}
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

describe("ImageUploadTileGroup", () => {
  it("renders the es hints exactly once below all tiles", () => {
    render({
      minWidth: 1280,
      minHeight: 720,
      values: ["/a.jpg", "/b.jpg", "/c.jpg"],
    });

    // 3 image tiles + the trailing upload tile.
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(4);
    const texts = hintTexts();
    expect(texts).toEqual([
      "JPG, PNG o WebP.",
      "Mínimo 1280 × 720 px recomendado",
      "Usa solo imágenes de tu propiedad o con licencia de uso.",
    ]);
    for (const text of texts) {
      expect(container.textContent!.split(text!).length - 1).toBe(1);
    }
    const tiles = container.querySelectorAll('input[type="file"]');
    const lastTile = tiles[tiles.length - 1];
    const firstHint = container.querySelector("p")!;
    expect(
      lastTile.compareDocumentPosition(firstHint) &
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
    render({ minWidth: 1280, minHeight: 720 });

    expect(hintTexts()).toEqual([
      "JPG, PNG or WebP.",
      "Minimum 1280 × 720 px recommended",
      "Only use images you own or are licensed to use.",
    ]);
  });

  it("restricts every picker to JPG, PNG and WebP", () => {
    render();

    const inputs = container.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((input) =>
      expect(input.getAttribute("accept")).toBe(
        "image/jpeg,image/png,image/webp",
      ),
    );
  });
});
