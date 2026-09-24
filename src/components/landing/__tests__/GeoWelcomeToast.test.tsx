import { act, isValidElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const sonner = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("sonner", () => ({ toast: { info: sonner.info } }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let GeoWelcomeToast: typeof import("../GeoWelcomeToast").GeoWelcomeToast;

beforeEach(async () => {
  vi.useFakeTimers();
  sonner.info.mockClear();
  // Fresh module per test = fresh page load (resets the once-per-load guard).
  vi.resetModules();
  ({ GeoWelcomeToast } = await import("../GeoWelcomeToast"));
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

function renderToast(countryCode: string) {
  act(() =>
    root.render(
      <GeoWelcomeToast
        countryCode={countryCode}
        flagSvg="<svg></svg>"
        message={`Welcome to Randomtrip ${countryCode}`}
      />,
    ),
  );
  act(() => vi.advanceTimersByTime(1000));
}

it("welcomes the visitor after a short delay, with the flag as icon", () => {
  act(() =>
    root.render(
      <GeoWelcomeToast
        countryCode="AR"
        flagSvg="<svg></svg>"
        message="Welcome to Randomtrip Argentina"
      />,
    ),
  );
  expect(sonner.info).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1000));

  expect(sonner.info).toHaveBeenCalledTimes(1);
  const [message, options] = sonner.info.mock.calls[0];
  expect(message).toBe("Welcome to Randomtrip Argentina");
  expect(isValidElement(options.icon)).toBe(true);
  expect(options.classNames.toast).toContain("!items-center");
});

it("stays on screen longer than the default toast", () => {
  renderToast("AR");
  expect(sonner.info.mock.calls[0][1].duration).toBe(7000);
});

it("welcomes again on the next visit, even from the same country", () => {
  renderToast("AR");
  expect(sonner.info).toHaveBeenCalledTimes(1);
});

it("does not repeat on in-app navigation back to the landing", () => {
  renderToast("AR");
  act(() => root.unmount());
  root = createRoot(container);
  renderToast("AR");
  expect(sonner.info).toHaveBeenCalledTimes(1);
});
