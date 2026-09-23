import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function Harness({ isLoading }: { isLoading: boolean }) {
  const hasLoadedOnce = useHasLoadedOnce(isLoading);
  return <output>{String(hasLoadedOnce)}</output>;
}

function render(isLoading: boolean) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness isLoading={isLoading} />);
  });
}

function rerender(isLoading: boolean, key?: string) {
  act(() => {
    root.render(<Harness isLoading={isLoading} key={key} />);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("useHasLoadedOnce", () => {
  it.each([
    { isLoading: true, expected: "false" },
    { isLoading: false, expected: "true" },
  ])(
    "renders $expected immediately during SSR when loading=$isLoading",
    ({ isLoading, expected }) => {
      expect(renderToStaticMarkup(<Harness isLoading={isLoading} />)).toBe(
        `<output>${expected}</output>`,
      );
    },
  );

  it("is false while isLoading stays true", () => {
    render(true);
    expect(container.textContent).toBe("false");
    rerender(true);
    expect(container.textContent).toBe("false");
  });

  it("starts settled and stays latched across a refetch", () => {
    render(false);
    expect(container.textContent).toBe("true");
    rerender(true);
    expect(container.textContent).toBe("true");
  });

  it("resets for a new mount, then latches independently", () => {
    render(false);
    expect(container.textContent).toBe("true");
    rerender(true, "new-mount");
    expect(container.textContent).toBe("false");
    rerender(false, "new-mount");
    expect(container.textContent).toBe("true");
  });

  it("latches true after isLoading first settles to false", () => {
    render(true);
    expect(container.textContent).toBe("false");

    rerender(false);
    expect(container.textContent).toBe("true");
  });

  it("stays true when isLoading goes back to true (refetch)", () => {
    render(true);
    rerender(false);
    expect(container.textContent).toBe("true");

    rerender(true);
    expect(container.textContent).toBe("true");

    rerender(false);
    expect(container.textContent).toBe("true");
  });

  it("latches on an error-driven settle (loading goes false with no success payload)", () => {
    // Simulates a failed first fetch: the caller sets loading=false in a
    // finally-equivalent path even though no data ever loaded.
    render(true);
    expect(container.textContent).toBe("false");

    rerender(false);
    expect(container.textContent).toBe("true");
  });
});
