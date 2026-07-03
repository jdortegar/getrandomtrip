import type { ReactElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// React 19 requires this flag set before any `act(...)` call in a non-RTL harness.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface DomHarness {
  container: HTMLDivElement;
  render: (ui: ReactElement) => void;
  click: (el: Element) => void;
  unmount: () => void;
}

export function createDomHarness(): DomHarness {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  return {
    container,
    render(ui: ReactElement) {
      act(() => {
        root.render(ui);
      });
    },
    click(el: Element) {
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}
