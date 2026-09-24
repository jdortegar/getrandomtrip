// Characterization + integration tests for `RoleNotificationsPageClient`
// (notifications-inbox). The "row click marks read" tests replace the old
// "Preserve Click-to-Mark-Read Semantics" characterization tests now that
// every row opens the reading dialog. The "reading dialog integration" tests
// cover the modal reading view (replaces the earlier split-view design,
// changed per user feedback 2026-09-24 — see design.md). The dialog content
// is rendered via Radix's Portal into `document.body`, not into `container`
// — every assertion about pane/dialog content below queries `document.body`.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";

vi.mock("@/lib/notifications/unreadDotBus", () => ({
  publishUnreadRefresh: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: NotificationsDict = {
  pageTitle: "Notificaciones",
  eyebrow: "Tu actividad",
  description: "Tus últimas notificaciones y alertas.",
  emptyState: "No tienes notificaciones todavía.",
  emptyStateTitle: "Sin notificaciones",
  markRead: "Marcar como leída",
  markAllRead: "Marcar todas como leídas",
  unreadBadge: "Sin leer",
  unreadCount: "{count} sin leer",
  actionView: "Ver",
  actionReview: "Revisar",
  types: {},
  filters: {
    statusLabel: "Filtrar por estado",
    all: "Todas",
    unread: "Sin leer",
    read: "Leídas",
    of: "de",
    count: "notificaciones",
  },
  table: {
    selectAll: "Seleccionar todo",
    selectRow: "Seleccionar notificación",
  },
  bulkActions: {
    deleteSelected: "Eliminar seleccionadas ({count})",
    confirmTitle: "¿Eliminar {count} notificaciones?",
    confirmBody: "Esta acción no se puede deshacer.",
    confirm: "Eliminar",
    cancel: "Cancelar",
    partialFailure:
      "Se eliminaron {success} de {total}. No se pudieron eliminar {failed}.",
  },
  emptyStateFiltered: "No hay notificaciones que coincidan con este filtro.",
  pane: {
    notFoundTitle: "No encontrada",
    notFoundBody: "Esta notificación no existe o no te pertenece.",
    loadError: "No pudimos cargar esta notificación.",
    closeAriaLabel: "Cerrar",
    markUnread: "Marcar como no leída",
    delete: "Eliminar",
    previous: "Anterior",
    next: "Siguiente",
    deleteConfirmTitle: "¿Eliminar esta notificación?",
    deleteConfirmBody: "Esta acción no se puede deshacer.",
  },
  errors: {
    markReadFailed: "No pudimos marcar la notificación como leída.",
    markUnreadFailed: "No pudimos marcar la notificación como no leída.",
    deleteFailed: "No pudimos eliminar la notificación.",
  },
};

function makeNotification(
  overrides: Partial<ClientNotification> = {},
): ClientNotification {
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

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  window.history.replaceState(null, "", "/es/dashboard/traveler/notifications");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }),
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function findRowButtonByText(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll("button[aria-current]")).find(
    (b) => b.textContent?.includes(text),
  ) as HTMLButtonElement;
}

describe("RoleNotificationsPageClient — row click marks read", () => {
  it("fires PATCH /api/notifications/[id]/read when opening an href-less unread row", async () => {
    const notification = makeNotification({ id: "notif-href-less", metadata: null });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    expect(row).not.toBeNull();

    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/notif-href-less/read?audience=TRAVELER",
      { method: "PATCH" },
    );
  });

  it("fires PATCH /api/notifications/[id]/read when opening an href-bearing unread row (no separate action link)", async () => {
    const notification = makeNotification({
      id: "notif-with-href",
      metadata: { tripRequestId: "trip-1" },
    });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => "/es/dashboard/trips/trip-1"}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    expect(row).not.toBeNull();

    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/notif-with-href/read?audience=TRAVELER",
      { method: "PATCH" },
    );
  });
});

describe("RoleNotificationsPageClient — reading dialog integration", () => {
  it("opens the dialog on row click", async () => {
    const notification = makeNotification({ id: "notif-1" });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(
      document.body.querySelector('[data-slot="dialog-content"]'),
    ).not.toBeNull();
    expect(document.body.textContent).toContain("Your trip is confirmed");
  });

  it("does not render a split 2-column grid or a sticky pane wrapper", async () => {
    const notification = makeNotification({ id: "notif-1" });

    const rendered = render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(rendered.querySelector('[class*="lg:grid-cols"]')).toBeNull();
    expect(rendered.querySelector('[class*="lg:sticky"]')).toBeNull();
    // The list stays full width and visible — it is never hidden once a row opens.
    expect(rendered.querySelector('[class*="hidden lg:block"]')).toBeNull();
  });

  it("closes via the hook's close() when the close (X) button is clicked, clearing ?id=", async () => {
    const notification = makeNotification({ id: "notif-1" });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();
    expect(window.location.search).toContain("id=notif-1");

    const closeButton = document.body.querySelector(
      'button[aria-label="Cerrar"]',
    ) as HTMLButtonElement;
    expect(closeButton).not.toBeNull();

    await act(async () => {
      closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(window.location.search).not.toContain("id=");
  });

  it("closes via the hook's close() when Esc is pressed", async () => {
    const notification = makeNotification({ id: "notif-1" });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
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
    await flush();

    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(window.location.search).not.toContain("id=");
  });

  it("Esc closes only the topmost dialog when the delete-confirm modal is nested inside the reading dialog", async () => {
    const notification = makeNotification({ id: "notif-1", isRead: true });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={0}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    const deleteButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar",
    ) as HTMLButtonElement;
    await act(async () => {
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Two nested dialogs are now open — the delete-confirm modal on top of
    // the reading dialog. Esc must dismiss only the confirm modal.
    const dialogContents = document.body.querySelectorAll('[data-slot="dialog-content"]');
    expect(dialogContents.length).toBe(2);
    const topmost = dialogContents[dialogContents.length - 1] as HTMLElement;

    await act(async () => {
      topmost.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    await flush();

    // The confirm modal closed, but the reading dialog (and its ?id=) is still open.
    expect(document.body.querySelectorAll('[data-slot="dialog-content"]').length).toBe(1);
    expect(window.location.search).toContain("id=notif-1");
  });

  it("renders NotificationEmptyPane's notFound variant inside the dialog when ?id= can't be resolved", async () => {
    const n1 = makeNotification({ id: "n1", title: "On page" });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("/api/notifications/missing")) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: "Not found" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1]}
        initialPage={1}
        initialSelectedId="missing"
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    await flush();

    expect(
      document.body.querySelector('[data-slot="dialog-content"]'),
    ).not.toBeNull();
    expect(document.body.textContent).toContain("No encontrada");
    expect(document.body.textContent).toContain(
      "Esta notificación no existe o no te pertenece.",
    );
  });

  it("opening a row marks it read and calls publishUnreadRefresh()", async () => {
    const { publishUnreadRefresh } = await import(
      "@/lib/notifications/unreadDotBus"
    );
    const notification = makeNotification({ id: "notif-1" });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Your trip is confirmed");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(publishUnreadRefresh).toHaveBeenCalled();
    expect(document.body.textContent).toContain("Your trip is confirmed");
  });

  it("under status=unread, keeps the pane open on the item after it leaves the refetched list, and Next opens list[anchor]", async () => {
    const n1 = makeNotification({ id: "n1", title: "First" });
    const n2 = makeNotification({ id: "n2", title: "Second" });
    const n3 = makeNotification({ id: "n3", title: "Third" });

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, isRead: true }) });
      }
      // Refetch under status=unread: n1 (just marked read) leaves the list.
      return Promise.resolve({
        ok: true,
        json: async () => ({
          notifications: [n2, n3],
          total: 2,
          unreadTotal: 2,
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1, n2, n3]}
        initialPage={1}
        initialStatus="unread"
        initialTotal={3}
        initialUnreadTotal={3}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("First");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();
    await flush();

    // n1 left the unread-filtered list, but the dialog stays open on it.
    expect(document.body.textContent).toContain("First");

    const nextButton = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(false);

    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    // anchor was 0 (n1's original index); post-refetch list is [n2, n3] → list[anchor] = n2
    expect(document.body.textContent).toContain("Second");
  });

  it("confirming delete advances the pane to the next item", async () => {
    const n1 = makeNotification({ id: "n1", title: "First", isRead: true });
    const n2 = makeNotification({ id: "n2", title: "Second", isRead: true });

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ notifications: [n2], total: 1, unreadTotal: 0 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1, n2]}
        initialPage={1}
        initialStatus="all"
        initialTotal={2}
        initialUnreadTotal={0}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("First");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    const deleteButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar",
    ) as HTMLButtonElement;
    await act(async () => {
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar" && b !== deleteButton,
    ) as HTMLButtonElement;

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();
    await flush();

    expect(document.body.textContent).toContain("Second");
  });

  it("clears the selection and closes the dialog when delete leaves no next item", async () => {
    const n1 = makeNotification({ id: "n1", title: "Only one", isRead: true });

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ notifications: [], total: 0, unreadTotal: 0 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={0}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("Only one");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();
    expect(window.location.search).toContain("id=n1");

    const deleteButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar",
    ) as HTMLButtonElement;
    await act(async () => {
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Eliminar" && b !== deleteButton,
    ) as HTMLButtonElement;

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();
    await flush();

    // No next item to advance to — the dialog closes and ?id= clears,
    // rather than showing a desktop "nothing selected" empty pane.
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(window.location.search).not.toContain("id=");
  });

  it("shows a toast and rolls back when mark-unread fails", async () => {
    const { toast } = await import("sonner");
    const n1 = makeNotification({ id: "n1", title: "First", isRead: true });

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "boom" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={0}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const row = findRowButtonByText("First");
    await act(async () => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    const unreadButton = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Marcar como no leída"),
    ) as HTMLButtonElement;
    await act(async () => {
      unreadButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(toast.error).toHaveBeenCalledWith(copy.errors.markUnreadFailed);
    // Rolled back — the row should still show as read (no unread dot / sr-only label).
    expect(container.querySelector(".sr-only")).toBeNull();
  });

  it("passing initialSelectedId for an id not on the loaded page triggers a GET [id] fetch", async () => {
    const n1 = makeNotification({ id: "n1", title: "On page" });
    const fetched = makeNotification({ id: "off-page", title: "Off page item" });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("/api/notifications/off-page")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ notification: fetched }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[n1]}
        initialPage={1}
        initialSelectedId="off-page"
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/off-page?audience=TRAVELER",
    );
    expect(document.body.textContent).toContain("Off page item");
  });
});

describe("RoleNotificationsPageClient — bulk delete and selection", () => {
  it("does NOT fire markRead when clicking a row's checkbox (stopPropagation on both handlers)", async () => {
    const notification = makeNotification({ id: "notif-checkbox", metadata: null });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const checkbox = container.querySelector(
      'input[type="checkbox"][aria-label="Seleccionar notificación"]',
    ) as HTMLInputElement;
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(fetch).not.toHaveBeenCalledWith(
      "/api/notifications/notif-checkbox/read?audience=TRAVELER",
      { method: "PATCH" },
    );
  });

  it("select-all is scoped to the current page only — checking it on page 1 does not select page-2 rows after navigating", async () => {
    const page1 = [makeNotification({ id: "p1-a" }), makeNotification({ id: "p1-b" })];
    const page2 = [makeNotification({ id: "p2-a" }), makeNotification({ id: "p2-b" })];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: page2,
        total: 21,
        unreadTotal: 21,
      }),
    });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={page1}
        initialPage={1}
        initialStatus="all"
        initialTotal={21}
        initialUnreadTotal={21}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const selectAll = container.querySelector(
      'input[aria-label="Seleccionar todo"]',
    ) as HTMLInputElement;
    await act(async () => {
      selectAll.click();
    });

    // Delete button should now be enabled (2 selected on page 1).
    const deleteButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Eliminar seleccionadas"),
    ) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(false);

    // Navigate to page 2 via the pager.
    const nextButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    const rowCheckboxes = Array.from(
      container.querySelectorAll(
        'input[type="checkbox"][aria-label="Seleccionar notificación"]',
      ),
    ) as HTMLInputElement[];
    expect(rowCheckboxes.length).toBe(2);
    expect(rowCheckboxes.every((cb) => !cb.checked)).toBe(true);

    const deleteButtonAfterNav = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Eliminar seleccionadas")) as HTMLButtonElement;
    expect(deleteButtonAfterNav.disabled).toBe(true);
  });

  it("clears selection when the status filter changes", async () => {
    const notification = makeNotification({ id: "notif-1" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], total: 0, unreadTotal: 0 }),
    });

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notification]}
        initialPage={1}
        initialStatus="all"
        initialTotal={1}
        initialUnreadTotal={1}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const checkbox = container.querySelector(
      'input[type="checkbox"][aria-label="Seleccionar notificación"]',
    ) as HTMLInputElement;
    await act(async () => {
      checkbox.click();
    });

    const deleteButtonBefore = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Eliminar seleccionadas")) as HTMLButtonElement;
    expect(deleteButtonBefore.disabled).toBe(false);

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "unread";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flush();

    const deleteButtonAfter = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Eliminar seleccionadas"),
    ) as HTMLButtonElement;
    expect(deleteButtonAfter.disabled).toBe(true);
  });

  it("bulk delete with partial failure: reports the failed tally and refetches", async () => {
    const notifA = makeNotification({ id: "bulk-a" });
    const notifB = makeNotification({ id: "bulk-b" });

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE" && url === "/api/notifications/bulk-a") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (init?.method === "DELETE" && url === "/api/notifications/bulk-b") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "boom" }) });
      }
      // Refetch after the bulk action.
      return Promise.resolve({
        ok: true,
        json: async () => ({ notifications: [], total: 0, unreadTotal: 0 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <RoleNotificationsPageClient
        audience="TRAVELER"
        copy={copy}
        initialNotifications={[notifA, notifB]}
        initialPage={1}
        initialStatus="all"
        initialTotal={2}
        initialUnreadTotal={2}
        locale="es"
        resolveHref={() => null}
      />,
    );

    const rowCheckboxes = Array.from(
      container.querySelectorAll(
        'input[type="checkbox"][aria-label="Seleccionar notificación"]',
      ),
    ) as HTMLInputElement[];
    for (const cb of rowCheckboxes) {
      await act(async () => {
        cb.click();
      });
    }

    const deleteSelectedButton = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Eliminar seleccionadas")) as HTMLButtonElement;
    await act(async () => {
      deleteSelectedButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Confirm inside the modal (rendered via portal into document.body).
    const confirmButton = Array.from(
      document.body.querySelectorAll("button"),
    ).find(
      (b) => b.textContent?.trim() === "Eliminar" && !b.closest("[type='button']"),
    );
    const modalConfirmButton =
      confirmButton ??
      (Array.from(document.body.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Eliminar"),
      ) as HTMLButtonElement);

    await act(async () => {
      modalConfirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();
    await flush();

    expect(container.textContent).toContain(
      "Se eliminaron 1 de 2. No se pudieron eliminar 1.",
    );
  });
});
