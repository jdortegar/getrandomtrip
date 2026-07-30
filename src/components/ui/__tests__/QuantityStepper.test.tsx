import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function clickButton(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("QuantityStepper", () => {
  it("renders label and value, and calls onValueChange on increase/decrease", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onValueChange = vi.fn();

    act(() => {
      root.render(
        <QuantityStepper
          ariaDecrease="Decrease adults"
          ariaIncrease="Increase adults"
          label="Adults"
          max={20}
          min={1}
          onValueChange={onValueChange}
          value={3}
        />,
      );
    });

    expect(container.textContent).toContain("Adults");
    expect(container.textContent).toContain("3");

    const increaseBtn = container.querySelector(
      '[aria-label="Increase adults"]',
    ) as HTMLElement;
    const decreaseBtn = container.querySelector(
      '[aria-label="Decrease adults"]',
    ) as HTMLElement;
    expect(increaseBtn).toBeTruthy();
    expect(decreaseBtn).toBeTruthy();

    clickButton(increaseBtn);
    expect(onValueChange).toHaveBeenCalledWith(4);

    clickButton(decreaseBtn);
    expect(onValueChange).toHaveBeenCalledWith(2);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("disables the decrease button at min and the increase button at max", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <QuantityStepper
          ariaDecrease="Decrease pets"
          ariaIncrease="Increase pets"
          label="Pets"
          max={2}
          min={0}
          onValueChange={vi.fn()}
          value={0}
        />,
      );
    });

    const decreaseBtn = container.querySelector(
      '[aria-label="Decrease pets"]',
    ) as HTMLButtonElement;
    expect(decreaseBtn.disabled).toBe(true);

    act(() => {
      root.render(
        <QuantityStepper
          ariaDecrease="Decrease pets"
          ariaIncrease="Increase pets"
          label="Pets"
          max={2}
          min={0}
          onValueChange={vi.fn()}
          value={2}
        />,
      );
    });

    const increaseBtn = container.querySelector(
      '[aria-label="Increase pets"]',
    ) as HTMLButtonElement;
    expect(increaseBtn.disabled).toBe(true);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
