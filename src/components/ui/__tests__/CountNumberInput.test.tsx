import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { CountNumberInput } from "@/components/ui/CountNumberInput";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("CountNumberInput", () => {
  it("renders label and initial value", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <CountNumberInput
          id="pax-adults"
          label="Adultos"
          min={1}
          onChange={vi.fn()}
          value={3}
        />,
      );
    });

    expect(container.textContent).toContain("Adultos");
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("3");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("strips non-digit characters on change and calls onChange with the sanitized number", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <CountNumberInput
          id="pax-minors"
          label="Menores"
          min={0}
          onChange={onChange}
          value={0}
        />,
      );
    });

    const input = container.querySelector("input") as HTMLInputElement;
    setValue(input, "a2b");
    expect(input.value).toBe("2");
    expect(onChange).toHaveBeenCalledWith(2);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("clamps to min on blur when the input is emptied or invalid", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <CountNumberInput
          id="pax-adults"
          label="Adultos"
          min={1}
          onChange={onChange}
          value={3}
        />,
      );
    });

    const input = container.querySelector("input") as HTMLInputElement;
    setValue(input, "");
    act(() => {
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(input.value).toBe("1");
    expect(onChange).toHaveBeenCalledWith(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("allows a min of 0 (e.g. Minors/Pets), clamping empty input to 0 rather than 1", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <CountNumberInput
          id="pax-pets"
          label="Mascotas"
          min={0}
          onChange={onChange}
          value={2}
        />,
      );
    });

    const input = container.querySelector("input") as HTMLInputElement;
    setValue(input, "");
    act(() => {
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(input.value).toBe("0");
    expect(onChange).toHaveBeenCalledWith(0);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
