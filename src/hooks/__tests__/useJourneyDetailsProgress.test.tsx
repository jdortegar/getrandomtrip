import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import {
  useJourneyDetailsProgressCallback,
  type JourneyDetailsProgress,
} from "@/hooks/useJourneyDetailsProgress";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Harness({
  progress,
  onChange,
}: {
  progress: JourneyDetailsProgress;
  onChange?: (p: JourneyDetailsProgress) => void;
}) {
  useJourneyDetailsProgressCallback(progress, onChange);
  return null;
}

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function render(
  root: Root,
  progress: JourneyDetailsProgress,
  onChange?: (p: JourneyDetailsProgress) => void,
) {
  act(() => {
    root.render(<Harness onChange={onChange} progress={progress} />);
  });
}

describe("useJourneyDetailsProgressCallback", () => {
  it("fires onChange with the initial progress on mount", () => {
    const { root, container } = mount();
    const onChange = vi.fn();
    render(
      root,
      { origin: false, dates: false, transport: false, complete: false },
      onChange,
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      origin: false,
      dates: false,
      transport: false,
      complete: false,
    });

    act(() => root.unmount());
    container.remove();
  });

  it("fires again when a primitive value changes", () => {
    const { root, container } = mount();
    const onChange = vi.fn();
    render(
      root,
      { origin: false, dates: false, transport: false, complete: false },
      onChange,
    );
    render(
      root,
      { origin: true, dates: false, transport: false, complete: false },
      onChange,
    );

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({
      origin: true,
      dates: false,
      transport: false,
      complete: false,
    });

    act(() => root.unmount());
    container.remove();
  });

  it("does not re-fire when re-rendered with an equal-value progress object (new identity, same primitives)", () => {
    const { root, container } = mount();
    const onChange = vi.fn();
    const first = { origin: true, dates: false, transport: false, complete: false };
    render(root, first, onChange);
    // A brand-new object with identical primitive values simulates a parent
    // re-render that recomputes the same booleans without any real change.
    render(
      root,
      { origin: true, dates: false, transport: false, complete: false },
      onChange,
    );

    expect(onChange).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    container.remove();
  });

  it("always calls the latest onChange without re-firing when only the callback identity changes", () => {
    const { root, container } = mount();
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const progress = {
      origin: true,
      dates: true,
      transport: false,
      complete: false,
    };
    render(root, progress, onChangeA);
    render(root, progress, onChangeB);

    // Neither callback should have been invoked a second time — the
    // progress values didn't change, only the function identity did.
    expect(onChangeA).toHaveBeenCalledTimes(1);
    expect(onChangeB).toHaveBeenCalledTimes(0);

    act(() => root.unmount());
    container.remove();
  });

  it("does not throw when onChange is undefined", () => {
    const { root, container } = mount();
    expect(() => {
      render(root, {
        origin: false,
        dates: false,
        transport: false,
        complete: false,
      });
    }).not.toThrow();

    act(() => root.unmount());
    container.remove();
  });
});
