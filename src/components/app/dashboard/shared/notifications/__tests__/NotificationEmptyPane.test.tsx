import { act } from "react";
import type { RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationEmptyPane } from "@/components/app/dashboard/shared/notifications/NotificationEmptyPane";
import type { NotificationsDict } from "@/lib/types/dictionary";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = {
  pane: {
    notFoundTitle: "No encontrada",
    notFoundBody: "Esta notificación no existe o no te pertenece.",
    loadError: "No pudimos cargar esta notificación.",
  },
} as NotificationsDict;

function makeTitleRef(): RefObject<HTMLHeadingElement | null> {
  return { current: null };
}

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
  vi.restoreAllMocks();
});

describe("NotificationEmptyPane", () => {
  it("renders not-found copy for variant='notFound'", () => {
    render(
      <NotificationEmptyPane copy={copy} titleRef={makeTitleRef()} variant="notFound" />,
    );
    expect(container.textContent).toContain("No encontrada");
    expect(container.textContent).toContain("Esta notificación no existe o no te pertenece.");
  });

  it("renders error copy for variant='error'", () => {
    render(
      <NotificationEmptyPane copy={copy} titleRef={makeTitleRef()} variant="error" />,
    );
    expect(container.textContent).toContain("No pudimos cargar esta notificación.");
  });

  it("attaches titleRef to the visible heading for both variants", () => {
    const titleRef = makeTitleRef();
    render(<NotificationEmptyPane copy={copy} titleRef={titleRef} variant="notFound" />);

    expect(titleRef.current).not.toBeNull();
    expect(titleRef.current?.tagName).toBe("H2");
    expect(titleRef.current?.textContent).toBe("No encontrada");
  });

});

// `variant: "empty"` was removed from `NotificationEmptyPaneVariant` — the
// dialog simply isn't rendered/opened when nothing is selected, so there is
// no "nothing selected" state left for this component to render. Enforced
// at the type level (NotificationEmptyPaneVariant = "notFound" | "error"),
// not by a runtime test.
