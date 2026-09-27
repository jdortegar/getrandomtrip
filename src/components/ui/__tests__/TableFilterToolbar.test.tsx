import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TableFilterToolbar } from "../TableFilterToolbar";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
const copy = {
  clearFilters: "Clear filters",
  count: "trips",
  loading: "Loading trips…",
  of: "of",
  searchLabel: "Search trips",
  searchPlaceholder: "Search by origin or trip reference",
};
const onClear = vi.fn();
const onSearchChange = vi.fn();
const onChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render({
  active = false,
  error = false,
  loading = false,
  count = 3,
  withSearch = true,
} = {}) {
  act(() =>
    root.render(
      <TableFilterToolbar
        copy={copy}
        filters={Array.from({ length: count }, (_, index) => ({
          id: `filter-${index}`,
          label: `Filter ${index}`,
          onChange,
          options: [
            { value: "all", label: "All" },
            { value: "xsed", label: "XSED" },
          ],
          value: "all",
        }))}
        hasActiveFilters={active}
        hasError={error}
        isLoading={loading}
        onClear={onClear}
        search={
          withSearch
            ? {
                id: "trip-search",
                label: copy.searchLabel,
                placeholder: copy.searchPlaceholder,
                onChange: onSearchChange,
                value: "Pilar",
              }
            : undefined
        }
        shown={1}
        total={10}
      />,
    ),
  );
}

it.each([3, 4])(
  "owns the same labeled responsive layout for %i filters",
  (count) => {
    render({ count });
    const toolbar = container.querySelector(
      '[data-component="TableFilterToolbar"]',
    )!;
    const select = toolbar.querySelector("select")!;
    const filterGrid = select.closest(
      '[data-component="FormSelectField"]',
    )!.parentElement!;
    expect(filterGrid.className).toContain("grid-cols-2");
    expect(filterGrid.className).toContain("md:grid-cols-4");
    expect(filterGrid.parentElement?.className).toContain(
      "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
    );
    expect(toolbar.querySelectorAll("select")).toHaveLength(count);
    for (const control of toolbar.querySelectorAll("input,select")) {
      expect(
        toolbar.querySelector(`label[for="${control.id}"]`),
      ).not.toBeNull();
      expect(control.className).toContain("h-11");
      expect(control.className).toContain("rounded-lg");
      expect(control.className).toContain("focus:ring-primary/20");
    }
    expect(select.className).toContain("cursor-pointer");
    expect(toolbar.querySelector('[role="status"]')?.textContent).toBe(
      "1 of 10 trips",
    );
    expect(toolbar.querySelector("button")).toBeNull();
  },
);

it("forwards controlled input, filter and clear actions without local selection state", () => {
  render({ active: true });
  const search = container.querySelector("input")!;
  const select = container.querySelector("select")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(search, "Cuenca");
    search.dispatchEvent(new Event("input", { bubbles: true }));
    select.value = "xsed";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    container.querySelector("button")!.click();
  });
  expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("Cuenca");
  expect(onChange).toHaveBeenCalledExactlyOnceWith("xsed");
  expect(onClear).toHaveBeenCalledOnce();
  expect(search.value).toBe("Pilar");
  expect(select.value).toBe("all");
});

it("announces loading without stale counts, keeps controls mounted and permits clearing pending filters", () => {
  render({ active: true });
  const controls = Array.from(container.querySelectorAll("input,select"));
  const status = container.querySelector('[role="status"]')!;
  render({ active: true, loading: true });
  expect(container.querySelector('[role="status"]')).toBe(status);
  expect(status.getAttribute("aria-busy")).toBe("true");
  expect(status.textContent).toBe(copy.loading);
  expect(status.querySelector("svg")?.classList.contains("animate-spin")).toBe(
    true,
  );
  expect(Array.from(container.querySelectorAll("input,select"))).toEqual(
    controls,
  );
  expect(container.querySelector("input:disabled,select:disabled")).toBeNull();
  act(() => container.querySelector("button")!.click());
  expect(onClear).toHaveBeenCalledOnce();
  render({ active: true, error: true });
  expect(status.textContent).toBe("");
  expect(status.getAttribute("aria-busy")).toBe("false");
  render();
  expect(status.textContent).toBe("1 of 10 trips");
});

it("supports a search-only toolbar without a blank filter grid", () => {
  render({ count: 0 });
  expect(container.querySelector("input")).not.toBeNull();
  expect(container.querySelector("select")).toBeNull();
  expect(
    container.querySelector('[data-component="TableFilterControls"]'),
  ).toBeNull();
  expect(
    container.querySelector("input")?.closest('[class*="lg:grid-cols-"]'),
  ).toBeNull();
});

it("supports a filter-only toolbar without reserving a search column", () => {
  render({ withSearch: false, count: 1 });
  expect(container.querySelector("input")).toBeNull();
  expect(container.querySelectorAll("select")).toHaveLength(1);
  expect(
    container.querySelector("select")?.closest('[class*="lg:grid-cols-"]'),
  ).toBeNull();
});
