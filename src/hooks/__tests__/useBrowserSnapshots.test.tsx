import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useHydrated } from "@/hooks/useHydrated";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useStorageValue, writeStorageValue } from "@/hooks/useStorageValue";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root | undefined;
let storage: Storage;

function StorageSnapshot() {
  const hydrated = useHydrated();
  const value = useStorageValue("preference");
  return <output>{`${hydrated}:${value ?? "empty"}`}</output>;
}

function MediaSnapshot() {
  return <output>{String(useMediaQuery("(hover: hover)"))}</output>;
}

beforeEach(() => {
  const values = new Map<string, string>();
  storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  vi.stubGlobal("localStorage", storage);
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
  vi.unstubAllGlobals();
});

it("hydrates the stable server fallback before reading persisted browser state", async () => {
  storage.setItem("preference", "saved");
  const recoverable = vi.fn();
  container.innerHTML = renderToString(<StorageSnapshot />);
  expect(container.textContent).toBe("false:empty");
  await act(async () => {
    root = hydrateRoot(container, <StorageSnapshot />, {
      onRecoverableError: recoverable,
    });
  });
  expect(container.textContent).toBe("true:saved");
  expect(recoverable).not.toHaveBeenCalled();
});

it("observes same-document writes and cross-tab storage events", () => {
  act(() => {
    root = createRoot(container);
    root.render(<StorageSnapshot />);
  });
  act(() => writeStorageValue("preference", "local"));
  expect(container.textContent).toBe("true:local");
  act(() => {
    storage.setItem("preference", "other-tab");
    window.dispatchEvent(new StorageEvent("storage", { key: "preference" }));
  });
  expect(container.textContent).toBe("true:other-tab");
  act(() => writeStorageValue("preference", null));
  expect(container.textContent).toBe("true:empty");
});

it("uses an SSR-safe media fallback and responds to device capability changes", () => {
  const media = Object.assign(new EventTarget(), {
    matches: true,
    media: "(hover: hover)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  expect(renderToString(<MediaSnapshot />)).toContain("false");
  act(() => {
    root = createRoot(container);
    root.render(<MediaSnapshot />);
  });
  expect(container.textContent).toBe("true");
  act(() => {
    media.matches = false;
    media.dispatchEvent(new Event("change"));
  });
  expect(container.textContent).toBe("false");
});
