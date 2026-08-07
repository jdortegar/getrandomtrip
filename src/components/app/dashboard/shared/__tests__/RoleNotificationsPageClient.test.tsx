// Characterization tests (approval tests) written against the CURRENT
// (pre-rearchitecture) `RoleNotificationsPageClient` behavior, per
// spec.md "Preserve Click-to-Mark-Read Semantics". These must pass against
// today's component BEFORE any rearchitecture, then keep passing after —
// proving the rewrite does not regress click-to-mark-read.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe("RoleNotificationsPageClient — click-to-mark-read preservation", () => {
  it("fires PATCH /api/notifications/[id]/read when clicking an href-less unread row", async () => {
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

    const row = container.querySelector('[role="button"]');
    expect(row).not.toBeNull();

    await act(async () => {
      row?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/notif-href-less/read",
      { method: "PATCH" },
    );
  });

  it("fires PATCH /api/notifications/[id]/read when clicking the action link on an href-bearing unread row", async () => {
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

    const actionLink = container.querySelector("a");
    expect(actionLink).not.toBeNull();

    await act(async () => {
      actionLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/notif-with-href/read",
      { method: "PATCH" },
    );
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
      "/api/notifications/notif-checkbox/read",
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
