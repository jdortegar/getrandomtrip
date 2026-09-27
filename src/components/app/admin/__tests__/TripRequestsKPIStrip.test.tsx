import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { TripRequestStatus } from "@/lib/admin/trip-status";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const counts: Record<TripRequestStatus, number> = {
  CANCELLED: 5,
  COMPLETED: 29,
  CONFIRMED: 1,
  DRAFT: 10,
  PENDING_PAYMENT: 4,
  REVEALED: 3,
  SAVED: 1,
};

let container: HTMLDivElement;
let root: Root;

function render(
  labels = enCopy.adminTripEditModal.tripStatus,
  values = counts,
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<TripRequestsKPIStrip counts={values} labels={labels} />);
  });
  return container.querySelector('[data-component="TripRequestsKPIStrip"]')!;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TripRequestsKPIStrip — mobile metrics", () => {
  it.each([enCopy, esCopy])(
    "pairs all four localized labels with their unchanged counts",
    (copy) => {
      const labels = copy.adminTripEditModal.tripStatus;
      const panel = render(labels);

      expect(panel.tagName).toBe("DL");
      expect(
        Array.from(panel.querySelectorAll("dt")).map(
          (label) => label.textContent,
        ),
      ).toEqual([
        labels.CONFIRMED,
        labels.PENDING_PAYMENT,
        labels.REVEALED,
        labels.COMPLETED,
      ]);
      expect(
        Array.from(panel.querySelectorAll("dd")).map(
          (value) => value.textContent,
        ),
      ).toEqual(["1", "4", "3", "29"]);
      expect(panel.children).toHaveLength(4);
    },
  );

  it("uses two equal mobile columns and four desktop columns without a scrolling strip", () => {
    const panel = render();

    expect(panel.classList.contains("grid")).toBe(true);
    expect(panel.classList.contains("grid-cols-2")).toBe(true);
    expect(panel.classList.contains("auto-rows-fr")).toBe(true);
    expect(panel.classList.contains("md:grid-cols-4")).toBe(true);
    expect(panel.classList.contains("overflow-x-auto")).toBe(false);
    for (const cell of panel.children) {
      expect(cell.classList.contains("min-w-0")).toBe(true);
      expect(cell.classList.contains("flex-col")).toBe(true);
      expect(cell.classList.contains("justify-between")).toBe(true);
      expect(cell.querySelector("dt")?.classList.contains("text-sm")).toBe(
        true,
      );
      expect(cell.querySelector("dt")?.classList.contains("truncate")).toBe(
        false,
      );
    }
  });

  it("keeps zero counts and large counts visible", () => {
    const panel = render(undefined, {
      ...counts,
      CONFIRMED: 0,
      COMPLETED: 12345,
    });
    expect(
      Array.from(panel.querySelectorAll("dd")).map(
        (value) => value.textContent,
      ),
    ).toEqual(["0", "4", "3", "12345"]);
  });
});
