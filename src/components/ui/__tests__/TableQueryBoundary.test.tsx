import Link from "next/link";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TableQueryBoundary } from "../TableQueryBoundary";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
const retry = vi.fn();
function render(loading = false, error: string | null = null) {
  act(() =>
    root.render(
      <TableQueryBoundary
        copy={{ loading: "Loading…", retry: "Retry" }}
        error={error}
        isLoading={loading}
        onRetry={retry}
      >
        <Link href="/row">Row action</Link>
      </TableQueryBoundary>,
    ),
  );
}
beforeEach(() => {
  retry.mockClear();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
});
it("keeps rows mounted but keyboard/pointer inert during refresh", () => {
  render();
  const row = container.querySelector("a")!;
  render(true);
  expect(container.querySelector("a")).toBe(row);
  expect(row.closest("[inert]")).not.toBeNull();
  expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
  render();
  expect(row.closest("[inert]")).toBeNull();
});
it("hides misleading stale results on errors and leaves retry outside inert rows", () => {
  render(false, "Failed");
  const row = container.querySelector("a")!;
  const button = container.querySelector("button")!;
  expect(row.closest("[hidden][inert]")).not.toBeNull();
  expect(button.closest("[inert]")).toBeNull();
  act(() => button.click());
  expect(retry).toHaveBeenCalledOnce();
  render(true, "Failed");
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.textContent).toBe("Loading…");
  expect(button.querySelector(".animate-spin")).not.toBeNull();
  render();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(row.closest("[hidden],[inert]")).toBeNull();
});
