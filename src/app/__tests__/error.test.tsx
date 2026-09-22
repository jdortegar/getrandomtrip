import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "../error";
import GlobalError from "../global-error";

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/layout/Section", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

it("reports the existing boundary error and preserves retry", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const error = new Error("Render failure");
  const reset = vi.fn();
  act(() => root.render(<ErrorPage error={error} reset={reset} />));
  expect(captureException).toHaveBeenCalledWith(error);
  expect(container.textContent).toContain("Error Inesperado");
  act(() => container.querySelector("button")?.click());
  expect(reset).toHaveBeenCalledOnce();
  act(() => root.unmount());
});

describe.each([
  ["/en/checkout", "en", "Something went wrong", "Try again"],
  ["/checkout", "es", "Algo salió mal", "Intentar de nuevo"],
])("global boundary at %s", (path, locale, title, retry) => {
  it("works without providers, reports errors, and offers localized retry", () => {
    window.history.replaceState(null, "", path);
    const page = document.implementation.createHTMLDocument();
    const root = createRoot(page);
    const error = new Error("Root layout failure");
    const reset = vi.fn();
    act(() => root.render(<GlobalError error={error} reset={reset} />));
    expect(captureException).toHaveBeenCalledWith(error);
    expect(page.documentElement.lang).toBe(locale);
    expect(page.body.textContent).toContain(title);
    expect(page.querySelector("button")?.textContent).toBe(retry);
    act(() => page.querySelector("button")?.click());
    expect(reset).toHaveBeenCalledOnce();
    expect(page.body.textContent).not.toContain(error.message);
    act(() => root.unmount());
  });
});
