import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let latest: boolean | undefined;

function Harness({ isLoading }: { isLoading: boolean }) {
  latest = useHasLoadedOnce(isLoading);
  return null;
}

function render(isLoading: boolean) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness isLoading={isLoading} />);
  });
}

function rerender(isLoading: boolean) {
  act(() => {
    root.render(<Harness isLoading={isLoading} />);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  latest = undefined;
});

describe("useHasLoadedOnce", () => {
  it("is false while isLoading stays true", () => {
    render(true);
    expect(latest).toBe(false);
  });

  it("latches true after isLoading first settles to false", () => {
    render(true);
    expect(latest).toBe(false);

    rerender(false);
    expect(latest).toBe(true);
  });

  it("stays true when isLoading goes back to true (refetch)", () => {
    render(true);
    rerender(false);
    expect(latest).toBe(true);

    rerender(true);
    expect(latest).toBe(true);

    rerender(false);
    expect(latest).toBe(true);
  });

  it("latches on an error-driven settle (loading goes false with no success payload)", () => {
    // Simulates a failed first fetch: the caller sets loading=false in a
    // finally-equivalent path even though no data ever loaded.
    render(true);
    expect(latest).toBe(false);

    rerender(false);
    expect(latest).toBe(true);
  });
});
