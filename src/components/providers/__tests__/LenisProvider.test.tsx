import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LenisProvider } from "../LenisProvider";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = "/en/journey";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

const mockLenis = {
  isStopped: false,
  resize: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};
vi.mock("lenis/react", () => ({
  ReactLenis: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLenis: () => mockLenis,
}));

describe("LenisProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockPathname = "/en/journey";
    mockLenis.isStopped = false;
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () =>
    act(() => {
      root.render(
        <LenisProvider>
          <p>page</p>
        </LenisProvider>,
      );
    });

  it("drops stale scroll state from the previous page on route change", () => {
    render();
    vi.clearAllMocks();

    mockPathname = "/en/checkout";
    render();

    expect(mockLenis.stop).toHaveBeenCalledTimes(1);
    expect(mockLenis.start).toHaveBeenCalledTimes(1);
    expect(mockLenis.resize).toHaveBeenCalledTimes(1);
  });

  it("leaves scroll state alone when the route does not change", () => {
    render();
    vi.clearAllMocks();

    render();

    expect(mockLenis.stop).not.toHaveBeenCalled();
    expect(mockLenis.resize).not.toHaveBeenCalled();
  });

  it("does not restart scrolling that something else stopped", () => {
    render();
    vi.clearAllMocks();
    mockLenis.isStopped = true;

    mockPathname = "/en/checkout";
    render();

    expect(mockLenis.stop).not.toHaveBeenCalled();
    expect(mockLenis.start).not.toHaveBeenCalled();
    expect(mockLenis.resize).toHaveBeenCalledTimes(1);
  });
});
