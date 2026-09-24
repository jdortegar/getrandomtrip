import { act, isValidElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WELCOME_COUNTRY_STORAGE_KEY } from "@/lib/geo/welcome";
import { GeoWelcomeToast } from "../GeoWelcomeToast";

const sonner = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("sonner", () => ({ toast: { info: sonner.info } }));

// Node's experimental global localStorage shadows jsdom's; use an in-memory stub.
function makeLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  sonner.info.mockClear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: makeLocalStorageStub(),
  });
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
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

it("welcomes a first-time visitor after a short delay, with the flag as icon", () => {
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
  expect(window.localStorage.getItem(WELCOME_COUNTRY_STORAGE_KEY)).toBe("AR");
});

it("stays quiet when the visitor was already welcomed from the same country", () => {
  window.localStorage.setItem(WELCOME_COUNTRY_STORAGE_KEY, "AR");
  renderToast("AR");
  expect(sonner.info).not.toHaveBeenCalled();
});

it("welcomes again when the country changes", () => {
  window.localStorage.setItem(WELCOME_COUNTRY_STORAGE_KEY, "AR");
  renderToast("CL");
  expect(sonner.info).toHaveBeenCalledTimes(1);
  expect(window.localStorage.getItem(WELCOME_COUNTRY_STORAGE_KEY)).toBe("CL");
});

it("still welcomes when storage is unavailable", () => {
  vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  renderToast("AR");
  expect(sonner.info).toHaveBeenCalledTimes(1);
});
