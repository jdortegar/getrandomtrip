"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_CHANGE = "randomtrip:storage-change";
type StorageKind = "localStorage" | "sessionStorage";

/** Notify this document as well as other tabs when an application write occurs. */
export function writeStorageValue(
  key: string,
  value: string | null,
  kind: StorageKind = "localStorage",
) {
  try {
    if (value === null) window[kind].removeItem(key);
    else window[kind].setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode; callers retain their local state.
  }
  window.dispatchEvent(new Event(STORAGE_CHANGE));
}

export function useStorageValue(
  key: string,
  kind: StorageKind = "localStorage",
): string | null {
  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(STORAGE_CHANGE, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(STORAGE_CHANGE, notify);
      };
    },
    [key],
  );
  const snapshot = useCallback(() => {
    try {
      return window[kind].getItem(key);
    } catch {
      return null;
    }
  }, [key, kind]);
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
