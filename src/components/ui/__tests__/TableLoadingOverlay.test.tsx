import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TableLoadingOverlay", () => {
  it("renders exactly one wrapping element with children always present", () => {
    render(
      <TableLoadingOverlay isLoading={false}>
        <p>row content</p>
      </TableLoadingOverlay>,
    );

    expect(container.children).toHaveLength(1);
    expect(container.textContent).toContain("row content");
  });

  it("merges the passed className before the loading classes", () => {
    render(
      <TableLoadingOverlay className="overflow-hidden rounded-xl" isLoading>
        <p>row content</p>
      </TableLoadingOverlay>,
    );

    const el = container.firstElementChild as HTMLElement;
    const classList = el.className;
    expect(classList).toContain("overflow-hidden");
    expect(classList).toContain("rounded-xl");
    const overflowIdx = classList.indexOf("overflow-hidden");
    const loadingIdx = classList.indexOf("pointer-events-none");
    expect(overflowIdx).toBeLessThan(loadingIdx);
  });

  it("adds opacity-50 pointer-events-none and aria-busy=true only when isLoading", () => {
    render(
      <TableLoadingOverlay isLoading>
        <p>row content</p>
      </TableLoadingOverlay>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("pointer-events-none");
    expect(el.className).toContain("opacity-50");
    expect(el.getAttribute("aria-busy")).toBe("true");
  });

  it("does not add dimming classes and sets aria-busy=false when not loading", () => {
    render(
      <TableLoadingOverlay isLoading={false}>
        <p>row content</p>
      </TableLoadingOverlay>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).not.toContain("pointer-events-none");
    expect(el.className).not.toContain("opacity-50");
    expect(el.getAttribute("aria-busy")).toBe("false");
  });

  it("keeps children mounted in the DOM even while loading", () => {
    render(
      <TableLoadingOverlay isLoading>
        <p>row content</p>
      </TableLoadingOverlay>,
    );
    expect(container.textContent).toContain("row content");
  });
});
