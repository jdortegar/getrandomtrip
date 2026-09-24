import { act } from "react";
import type { RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationReadingPane } from "@/components/app/dashboard/shared/notifications/NotificationReadingPane";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = {
  actionView: "Ver",
  actionReview: "Revisar",
  pane: {
    markUnread: "Marcar como no leída",
    delete: "Eliminar",
    previous: "Anterior",
    next: "Siguiente",
    deleteConfirmTitle: "¿Eliminar esta notificación?",
    deleteConfirmBody: "Esta acción no se puede deshacer.",
  },
  bulkActions: {
    cancel: "Cancelar",
    confirm: "Eliminar",
  },
} as NotificationsDict;

function makeNotification(overrides: Partial<ClientNotification> = {}): ClientNotification {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "BOOKING_CONFIRMED",
    audience: "TRAVELER",
    isRead: true,
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

function makeTitleRef(): RefObject<HTMLHeadingElement | null> {
  return { current: null };
}

function baseProps() {
  return {
    canNext: true,
    canPrev: true,
    busy: false,
    copy,
    locale: "es",
    notification: makeNotification(),
    onDelete: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onToggleRead: vi.fn(),
    titleRef: makeTitleRef(),
  };
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.restoreAllMocks();
});

describe("NotificationReadingPane", () => {
  it("renders icon, title, timestamp, body, and a CTA when href is present", () => {
    render(
      <NotificationReadingPane
        {...baseProps()}
        href="/es/dashboard/trips/trip-1"
      />,
    );

    expect(container.textContent).toContain("Your trip is confirmed");
    expect(container.textContent).toContain("See you soon!");
    const cta = container.querySelector('a[href="/es/dashboard/trips/trip-1"]');
    expect(cta).not.toBeNull();
  });

  it("renders the CTA as a quiet text link, not a boxed button", () => {
    render(
      <NotificationReadingPane
        {...baseProps()}
        href="/es/dashboard/trips/trip-1"
      />,
    );

    const cta = container.querySelector('a[href="/es/dashboard/trips/trip-1"]');
    const classes = cta?.className.split(/\s+/) ?? [];
    expect(classes).toContain("text-primary");
    expect(classes).toContain("hover:underline");
    expect(classes).toContain("normal-case");
    expect(classes).not.toContain("bg-primary");
    expect(classes).not.toContain("bg-white");
    expect(classes).not.toContain("min-h-11");
  });

  it("omits the CTA when href is null", () => {
    render(<NotificationReadingPane {...baseProps()} href={null} />);
    expect(container.querySelector("a")).toBeNull();
  });

  it("fires onToggleRead when Mark unread is clicked", () => {
    const onToggleRead = vi.fn();
    render(
      <NotificationReadingPane {...baseProps()} href={null} onToggleRead={onToggleRead} />,
    );

    const button = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Marcar como no leída"),
    ) as HTMLButtonElement;

    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToggleRead).toHaveBeenCalledTimes(1);
  });

  it("disables Prev/Next per canPrev/canNext/busy and fires the right handler", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <NotificationReadingPane
        {...baseProps()}
        canNext={false}
        canPrev={true}
        href={null}
        onNext={onNext}
        onPrev={onPrev}
      />,
    );

    const prevButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Anterior"),
    ) as HTMLButtonElement;
    const nextButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;

    expect(prevButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(true);

    act(() => {
      prevButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("disables Prev/Next while busy", () => {
    render(<NotificationReadingPane {...baseProps()} busy href={null} />);
    const prevButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Anterior"),
    ) as HTMLButtonElement;
    const nextButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);
  });

  it("opens a ConfirmModal on Delete and fires onDelete only on confirm", async () => {
    const onDelete = vi.fn();
    render(<NotificationReadingPane {...baseProps()} href={null} onDelete={onDelete} />);

    const deleteButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Eliminar"),
    ) as HTMLButtonElement;

    act(() => {
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onDelete).not.toHaveBeenCalled();

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar" && b !== deleteButton,
    ) as HTMLButtonElement;
    expect(confirmButton).toBeTruthy();

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("attaches titleRef to the visible heading (focused by the enclosing dialog's onOpenAutoFocus)", () => {
    const titleRef = makeTitleRef();
    render(
      <NotificationReadingPane {...baseProps()} href={null} titleRef={titleRef} />,
    );

    expect(titleRef.current).not.toBeNull();
    expect(titleRef.current?.tagName).toBe("H2");
    expect(titleRef.current?.textContent).toBe("Your trip is confirmed");
  });

  it("does not render a notification-type icon puck (removed per user feedback 2026-09-24)", () => {
    const rendered = render(
      <NotificationReadingPane
        {...baseProps()}
        href="/es/dashboard/trips/trip-1"
        notification={makeNotification({ type: "EXPERIENCE_APPROVED" })}
      />,
    );

    // The icon puck was the only `h-11 w-11` element — the CTA/chevron/trash
    // icons are all `h-4 w-4`, so this selector is unique to the removed puck.
    expect(rendered.querySelector(".h-11.w-11")).toBeNull();
  });

  it("gives the scrollable body a comfortable min-height on sm+ and clear separation above the footer", () => {
    const rendered = render(
      <NotificationReadingPane {...baseProps()} href={null} />,
    );

    const body = rendered.querySelector('[data-component="NotificationReadingPane"] > .overflow-y-auto');
    expect(body).not.toBeNull();
    expect(body?.className).toMatch(/\bsm:min-h-(4[89]|5[0-9]|6[0-4])\b/);

    const footer = rendered.querySelector('[data-component="NotificationReadingPane"] > .border-t');
    expect(footer).not.toBeNull();
    expect(footer?.className).toMatch(/\bmt-6\b/);
    expect(footer?.className).toMatch(/\bpt-4\b/);
  });
});
