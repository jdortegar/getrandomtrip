import { act, StrictMode, useLayoutEffect } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { LenisContext } from "lenis/react";
import type Lenis from "lenis";
import type { ScrollCallback } from "lenis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollDetection } from "@/hooks/useScrollDetection";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function scrollSource(position: number) {
  const listeners = new Set<ScrollCallback>();
  // Controlled external source; the real Lenis context and hook stay mounted.
  const lenis = {
    animatedScroll: position,
    on: (_event: "scroll", callback: ScrollCallback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
  } as Lenis;
  return {
    context: {
      lenis,
      addCallback: (callback: ScrollCallback) => {
        listeners.add(callback);
      },
      removeCallback: (callback: ScrollCallback) => {
        listeners.delete(callback);
      },
    },
    listeners,
    scroll(nextPosition: number) {
      lenis.animatedScroll = nextPosition;
      for (const callback of listeners) callback(lenis);
    },
  };
}

interface HarnessProps {
  variant: "auto" | "solid" | "overlay";
  threshold?: number;
  onCommit?: (overlay: boolean) => void;
}

function Harness({ onCommit, ...options }: HarnessProps) {
  const overlay = useScrollDetection(options);
  useLayoutEffect(() => {
    onCommit?.(overlay);
  }, [onCommit, overlay]);
  return <output>{String(overlay)}</output>;
}

function view(
  source: ReturnType<typeof scrollSource> | null,
  props: HarnessProps,
) {
  return (
    <LenisContext.Provider value={source?.context ?? null}>
      <Harness {...props} />
    </LenisContext.Provider>
  );
}

let container: HTMLDivElement;
let root: Root;
function render(
  source: ReturnType<typeof scrollSource> | null,
  props: HarnessProps,
) {
  act(() => root.render(view(source, props)));
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("useScrollDetection", () => {
  it.each([
    { variant: "solid" as const, expected: "false" },
    { variant: "overlay" as const, expected: "true" },
  ])("keeps $variant fixed across scroll events", ({ variant, expected }) => {
    const source = scrollSource(0);
    render(source, { variant });
    expect(container.textContent).toBe(expected);
    act(() => source.scroll(50));
    expect(container.textContent).toBe(expected);
  });

  it("uses the strict threshold on Lenis scroll events", () => {
    const source = scrollSource(0);
    render(source, { variant: "auto", threshold: 10 });
    expect(container.textContent).toBe("true");
    act(() => source.scroll(10));
    expect(container.textContent).toBe("false");
    act(() => source.scroll(9));
    expect(container.textContent).toBe("true");
  });

  it("falls back to overlay when no Lenis instance is available", () => {
    render(null, { variant: "auto" });
    expect(container.textContent).toBe("true");
  });
});

it("reads restored scroll position in the first client commit without a scroll tick", () => {
  const commits: boolean[] = [];
  render(scrollSource(60), {
    variant: "auto",
    onCommit: (overlay) => commits.push(overlay),
  });
  expect(container.textContent).toBe("false");
  expect(commits[0]).toBe(false);
});

it("recomputes a changed threshold on the first commit without resubscribing or a tick", () => {
  const source = scrollSource(5);
  render(source, { variant: "auto" });
  expect(container.textContent).toBe("false");
  const listener = [...source.listeners][0];
  const commits: boolean[] = [];
  render(source, {
    variant: "auto",
    threshold: 10,
    onCommit: (value) => commits.push(value),
  });
  expect(commits[0]).toBe(true);
  expect(container.textContent).toBe("true");
  expect([...source.listeners]).toEqual([listener]);
});

it.each([
  { variant: "solid" as const, position: 0, expected: true },
  { variant: "overlay" as const, position: 20, expected: false },
])(
  "switches $variant→auto immediately from current position",
  ({ variant, position, expected }) => {
    const source = scrollSource(position);
    render(source, { variant });
    expect(source.listeners.size).toBe(0);
    const commits: boolean[] = [];
    render(source, {
      variant: "auto",
      onCommit: (value) => commits.push(value),
    });
    expect(commits[0]).toBe(expected);
    expect(container.textContent).toBe(String(expected));
    expect(source.listeners.size).toBe(1);
    render(source, { variant });
    expect(container.textContent).toBe(String(variant === "overlay"));
    expect(source.listeners.size).toBe(0);
  },
);

it("unsubscribes replaced instances and releases the current subscription on unmount", () => {
  const first = scrollSource(0);
  const second = scrollSource(50);
  render(first, { variant: "auto" });
  expect(container.textContent).toBe("true");
  expect(first.listeners.size).toBe(1);
  render(second, { variant: "auto" });
  expect(first.listeners.size).toBe(0);
  expect(second.listeners.size).toBe(1);
  expect(container.textContent).toBe("false");
  act(() => first.scroll(0));
  expect(container.textContent).toBe("false");
  act(() => second.scroll(0));
  expect(container.textContent).toBe("true");
  act(() => root.render(<></>));
  expect(second.listeners.size).toBe(0);
});

it("reads an arriving instance and restores the fallback when it disappears", () => {
  const source = scrollSource(10);
  render(null, { variant: "auto" });
  expect(container.textContent).toBe("true");
  render(source, { variant: "auto" });
  expect(container.textContent).toBe("false");
  render(null, { variant: "auto" });
  expect(container.textContent).toBe("true");
  expect(source.listeners.size).toBe(0);
});

it.each([
  { variant: "auto" as const, expected: true },
  { variant: "overlay" as const, expected: true },
  { variant: "solid" as const, expected: false },
])("renders the stable $variant server snapshot", ({ variant, expected }) => {
  expect(renderToString(view(scrollSource(100), { variant }))).toBe(
    `<output>${expected}</output>`,
  );
});

it("hydrates the server fallback before reading restored client scroll", async () => {
  const source = scrollSource(50);
  const commits: boolean[] = [];
  const element = view(source, {
    variant: "auto",
    onCommit: (value) => commits.push(value),
  });
  act(() => root.unmount());
  container.innerHTML = renderToString(element);
  const serverOutput = container.querySelector("output");
  expect(serverOutput?.textContent).toBe("true");
  const onRecoverableError = vi.fn();
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.querySelector("output")).toBe(serverOutput);
  expect(commits[0]).toBe(true);
  expect(container.textContent).toBe("false");
});

it("keeps one live subscription across StrictMode replay", () => {
  const source = scrollSource(0);
  act(() =>
    root.render(<StrictMode>{view(source, { variant: "auto" })}</StrictMode>),
  );
  expect(source.listeners.size).toBe(1);
  act(() => source.scroll(1));
  expect(container.textContent).toBe("false");
  act(() => root.render(<></>));
  expect(source.listeners.size).toBe(0);
});
