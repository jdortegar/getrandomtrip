import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { UnpaidTripsAlert } from "../UnpaidTripsAlert";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Trip } from "@/lib/utils/trips";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const trips: Trip[] = ["first-trip", "second-trip"].map((id) => ({
  id,
  city: "Origin",
  country: "Country",
  endDate: "2027-01-03",
  level: "essenza",
  pax: 2,
  startDate: "2027-01-01",
  status: "PENDING_PAYMENT",
  totalTripUsd: 700,
  type: "couple",
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.spyOn(window, "confirm").mockReturnValue(false);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function click(element: Element | null) {
  expect(element).not.toBeNull();
  element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function rowDelete(index = 0) {
  return container.querySelectorAll("tbody button")[index];
}

function dialog() {
  return document.querySelector('[role="dialog"]');
}

function dialogButton(label: string) {
  return Array.from(dialog()?.querySelectorAll("button") ?? []).find(
    (button) => button.textContent?.trim() === label,
  )!;
}

function render(
  onDelete = vi
    .fn<(id: string) => Promise<void>>()
    .mockResolvedValue(undefined),
  currentTrips = trips,
  locale: "en" | "es" = "en",
) {
  act(() =>
    root.render(
      <UnpaidTripsAlert
        copy={(locale === "es" ? es : en).dashboard}
        locale={locale}
        onDelete={onDelete}
        trips={currentTrips}
      />,
    ),
  );
  return onDelete;
}

describe("UnpaidTripsAlert confirmation", () => {
  it.each([
    ["en", "Delete trip?", "Cancel", en],
    ["es", "¿Eliminar viaje?", "Cancelar", es],
  ] as const)(
    "opens and cancels the app modal in %s",
    (locale, title, cancel, dictionary) => {
      const onDelete = render(undefined, trips, locale);
      act(() => click(rowDelete()));

      expect(window.confirm).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
      expect(dialog()?.textContent).toContain(title);
      expect(dialog()?.textContent).toContain(
        dictionary.dashboard.unpaidTrips.deleteConfirm,
      );
      expect(
        dialogButton(dictionary.dashboard.unpaidTrips.deleteAction).className,
      ).toContain("bg-red-600");

      act(() => click(dialogButton(cancel)));
      expect(dialog()).toBeNull();
      expect(onDelete).not.toHaveBeenCalled();
    },
  );

  it.each(["close", "escape"])(
    "dismisses using %s without deleting",
    (method) => {
      const onDelete = render();
      act(() => click(rowDelete()));
      expect(dialog()).not.toBeNull();

      act(() => {
        if (method === "close")
          click(dialog()?.querySelector('[data-slot="dialog-close"]') ?? null);
        else
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
      });

      expect(dialog()).toBeNull();
      expect(onDelete).not.toHaveBeenCalled();
    },
  );

  it("confirms only the newly selected row after cancelling another", async () => {
    const onDelete = render();
    act(() => click(rowDelete()));
    act(() => click(dialogButton("Cancel")));
    act(() => click(rowDelete(1)));
    await act(async () => click(dialogButton("Delete")));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith("second-trip");
    expect(dialog()).toBeNull();
  });

  it.each([
    ["en", "Delete", "Deleting…"],
    ["es", "Eliminar", "Eliminando…"],
  ] as const)(
    "shows localized pending feedback and blocks duplicate/dismiss/reselect in %s",
    async (locale, confirm, pending) => {
      let finish!: () => void;
      const onDelete = vi.fn<(id: string) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      render(onDelete, trips, locale);
      act(() => click(rowDelete(1)));
      const confirmButton = dialogButton(confirm);
      act(() => {
        click(confirmButton);
        click(confirmButton);
        click(rowDelete());
      });

      expect(onDelete).toHaveBeenCalledExactlyOnceWith("second-trip");
      const busyButton = dialogButton(pending);
      expect(busyButton.disabled).toBe(true);
      expect(busyButton.getAttribute("aria-busy")).toBe("true");
      expect(
        busyButton
          .querySelector("svg.animate-spin")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
      expect(dialog()?.querySelector('[data-slot="dialog-close"]')).toBeNull();
      expect(
        dialogButton(locale === "es" ? "Cancelar" : "Cancel").disabled,
      ).toBe(true);

      act(() =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
      );
      expect(dialog()).not.toBeNull();
      await act(async () => finish());
      expect(dialog()).toBeNull();
      expect((rowDelete() as HTMLButtonElement).disabled).toBe(false);
    },
  );

  it.each(["en", "es"] as const)(
    "keeps the target and allows retry after failure in %s",
    async (locale) => {
      const copy = (locale === "es" ? es : en).dashboard.unpaidTrips;
      let rejectDelete!: (reason: Error) => void;
      const onDelete = vi
        .fn<(id: string) => Promise<void>>()
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              rejectDelete = reject;
            }),
        )
        .mockResolvedValueOnce(undefined);
      render(onDelete, trips, locale);
      act(() => click(rowDelete(1)));
      act(() => click(dialogButton(copy.deleteAction)));
      expect(dialogButton(copy.deleting).getAttribute("aria-busy")).toBe(
        "true",
      );
      await act(async () => rejectDelete(new Error("Delete failed")));

      expect(toast.error).toHaveBeenCalledExactlyOnceWith(copy.deleteFailed);
      expect(dialog()).not.toBeNull();
      expect(dialogButton(copy.deleteAction).disabled).toBe(false);
      expect(dialogButton(copy.deleteAction).getAttribute("aria-busy")).toBe(
        "false",
      );
      expect(
        dialogButton(copy.deleteAction).querySelector(".animate-spin"),
      ).toBeNull();

      await act(async () => click(dialogButton(copy.deleteAction)));
      expect(onDelete.mock.calls).toEqual([["second-trip"], ["second-trip"]]);
      expect(dialog()).toBeNull();
    },
  );

  it("does not confirm a trip removed while the modal was open", () => {
    const onDelete = render();
    act(() => click(rowDelete(1)));
    expect(dialog()).not.toBeNull();
    render(onDelete, [trips[0]]);
    expect(dialog()).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("does not render when there are no unpaid trips", () => {
    render(undefined, []);
    expect(container.innerHTML).toBe("");
    expect(dialog()).toBeNull();
  });
});
