"use client";

import { useMemo, useSyncExternalStore } from "react";

/** An external browser resource; constructing it does not allocate a blob URL. */
class ObjectUrlResource {
  private url: string | null = null;
  private listeners = new Set<() => void>();

  constructor(private readonly file: File | null) {}

  snapshot = () => this.url;

  subscribe = (notify: () => void) => {
    this.listeners.add(notify);
    if (this.file && !this.url) {
      this.url = URL.createObjectURL(this.file);
      this.listeners.forEach((listener) => listener());
    }
    return () => {
      this.listeners.delete(notify);
      if (!this.listeners.size && this.url) {
        URL.revokeObjectURL(this.url);
        this.url = null;
      }
    };
  };
}

/** Acquire only after commit; release on file changes, unmount and Strict Mode replay. */
export function useObjectUrl(file: File | null): string | null {
  const resource = useMemo(() => new ObjectUrlResource(file), [file]);
  return useSyncExternalStore(
    resource.subscribe,
    resource.snapshot,
    () => null,
  );
}
