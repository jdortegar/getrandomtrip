import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationDialog } from "@/components/app/dashboard/shared/notifications/NotificationDialog";

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

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.restoreAllMocks();
});

function Content({ titleRef }: { titleRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <>
      <h2 ref={titleRef} tabIndex={-1}>
        Hello title
      </h2>
      <p>Hello body</p>
    </>
  );
}

describe("NotificationDialog", () => {
  it("renders the render-prop content when open", async () => {
    render(
      <NotificationDialog
        closeAriaLabel="Close"
        description="Hello description"
        onClose={vi.fn()}
        open={true}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    expect(document.body.textContent).toContain("Hello body");
  });

  it("does not render content when closed", async () => {
    render(
      <NotificationDialog
        closeAriaLabel="Close"
        description="Hello description"
        onClose={vi.fn()}
        open={false}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    expect(document.body.textContent).not.toContain("Hello body");
  });

  it("gives the dialog an accessible title and description via Radix's aria-labelledby/aria-describedby", async () => {
    render(
      <NotificationDialog
        closeAriaLabel="Close"
        description="Hello description"
        onClose={vi.fn()}
        open={true}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    const content = document.body.querySelector(
      '[data-slot="dialog-content"]',
    ) as HTMLElement;
    const labelledBy = content.getAttribute("aria-labelledby");
    const describedBy = content.getAttribute("aria-describedby");
    expect(document.getElementById(labelledBy!)?.textContent).toBe("Hello title");
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Hello description",
    );
  });

  it("does not render a 2-column grid or any split-view wrapper classes", async () => {
    render(
      <NotificationDialog
        closeAriaLabel="Close"
        description="Hello description"
        onClose={vi.fn()}
        open={true}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    expect(document.querySelector('[class*="lg:grid-cols"]')).toBeNull();
    expect(document.querySelector('[class*="lg:sticky"]')).toBeNull();
  });

  it("calls onClose (routed to the hook's close()) when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <NotificationDialog
        closeAriaLabel="Cerrar"
        description="Hello description"
        onClose={onClose}
        open={true}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    const closeButton = document.body.querySelector(
      'button[aria-label="Cerrar"]',
    ) as HTMLButtonElement;
    expect(closeButton).not.toBeNull();

    await act(async () => {
      closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <NotificationDialog
        closeAriaLabel="Close"
        description="Hello description"
        onClose={onClose}
        open={true}
        title="Hello title"
      >
        {(titleRef) => <Content titleRef={titleRef} />}
      </NotificationDialog>,
    );
    await flush();

    const content = document.body.querySelector(
      '[data-slot="dialog-content"]',
    ) as HTMLElement;
    expect(content).not.toBeNull();

    await act(async () => {
      content.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
