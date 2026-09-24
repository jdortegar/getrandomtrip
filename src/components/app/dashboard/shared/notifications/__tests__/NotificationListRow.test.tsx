import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationListRow } from "@/components/app/dashboard/shared/notifications/NotificationListRow";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = {
  unreadBadge: "Sin leer",
  table: {
    selectAll: "Seleccionar todo",
    selectRow: "Seleccionar notificación",
  },
} as NotificationsDict;

function makeNotification(overrides: Partial<ClientNotification> = {}): ClientNotification {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "BOOKING_CONFIRMED",
    audience: "TRAVELER",
    isRead: false,
    title: "Your trip is confirmed",
    body: "See you soon!",
    metadata: null,
    createdAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
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

describe("NotificationListRow", () => {
  it("fires onOpen on click for an href-less notification", () => {
    const onOpen = vi.fn();
    const notification = makeNotification({ id: "no-href", metadata: null });
    render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={notification}
        onOpen={onOpen}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );

    const button = container.querySelector("button[aria-current]") as HTMLButtonElement;
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOpen).toHaveBeenCalledWith("no-href");
  });

  it("fires onOpen on click for an href-bearing notification (no separate action link)", () => {
    const onOpen = vi.fn();
    const notification = makeNotification({
      id: "with-href",
      metadata: { tripRequestId: "trip-1" },
    });
    render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={notification}
        onOpen={onOpen}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );

    const button = container.querySelector("button[aria-current]") as HTMLButtonElement;
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOpen).toHaveBeenCalledWith("with-href");
  });

  it("fires onOpen on keyboard activation (Enter)", () => {
    const onOpen = vi.fn();
    const notification = makeNotification();
    render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={notification}
        onOpen={onOpen}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );

    const button = container.querySelector("button[aria-current]") as HTMLButtonElement;
    act(() => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(onOpen).toHaveBeenCalledWith("notif-1");
  });

  it("does not call onOpen when the checkbox is clicked (stopPropagation)", () => {
    const onOpen = vi.fn();
    const onToggleChecked = vi.fn();
    const notification = makeNotification();
    render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={notification}
        onOpen={onOpen}
        onToggleChecked={onToggleChecked}
        selected={false}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => {
      checkbox.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(onToggleChecked).toHaveBeenCalledWith("notif-1");
  });

  it("does not call onOpen on checkbox keydown either", () => {
    const onOpen = vi.fn();
    const notification = makeNotification();
    render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={notification}
        onOpen={onOpen}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => {
      checkbox.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders the unread dot with an sr-only label only when unread", () => {
    const unread = render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={makeNotification({ isRead: false })}
        onOpen={vi.fn()}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );
    expect(unread.querySelector(".sr-only")?.textContent).toBe("Sin leer");

    act(() => {
      root.unmount();
    });
    container.remove();

    const read = render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={makeNotification({ isRead: true })}
        onOpen={vi.fn()}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );
    expect(read.querySelector(".sr-only")).toBeNull();
  });

  it("does not render a notification-type icon puck (removed per user feedback 2026-09-24)", () => {
    const rendered = render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={makeNotification({ type: "EXPERIENCE_APPROVED" })}
        onOpen={vi.fn()}
        onToggleChecked={vi.fn()}
        selected={false}
      />,
    );

    expect(rendered.querySelector("button[aria-current] svg")).toBeNull();
  });

  it("reflects the selected prop via aria-current", () => {
    const selected = render(
      <NotificationListRow
        checked={false}
        copy={copy}
        locale="es"
        notification={makeNotification()}
        onOpen={vi.fn()}
        onToggleChecked={vi.fn()}
        selected={true}
      />,
    );
    const button = selected.querySelector("button[aria-current]") as HTMLButtonElement;
    expect(button.getAttribute("aria-current")).toBe("true");
  });
});
