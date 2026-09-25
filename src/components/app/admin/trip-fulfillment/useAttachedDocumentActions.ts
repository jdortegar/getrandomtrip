"use client";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";

interface Operation {
  kind: "upload" | "remove";
  id?: string;
}
interface Props {
  tripId: string;
  errors: MarketingDictionary["adminTripFulfillment"]["errors"];
  replace: (value: SetStateAction<TripDocumentDTO[]>) => void;
  onRemoved: () => void;
}

/** Explicit attachment writes keep rows/input intact until acknowledged. */
export function useAttachedDocumentActions({
  tripId,
  errors,
  replace,
  onRemoved,
}: Props) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [error, setError] = useState<{
    kind: Operation["kind"];
    message: string;
  } | null>(null);
  const [owner, setOwner] = useState(tripId);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  if (owner !== tripId) {
    setOwner(tripId);
    setOperation(null);
    setError(null);
  }
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
      controller.current = null;
    },
    [tripId],
  );

  async function run<T>(
    next: Operation,
    work: (signal: AbortSignal) => Promise<T>,
    apply: (value: T) => void,
  ) {
    if (controller.current) return false;
    const token = ++sequence.current;
    const abort = new AbortController();
    controller.current = abort;
    setOperation(next);
    setError(null);
    try {
      const value = await work(abort.signal);
      if (token !== sequence.current) return false;
      apply(value);
      return true;
    } catch (cause) {
      if (token === sequence.current) {
        const key =
          cause instanceof Error
            ? (cause.message as keyof typeof errors)
            : "generic";
        setError({
          kind: next.kind,
          message: Object.hasOwn(errors, key) ? errors[key] : errors.generic,
        });
      }
      return false;
    } finally {
      if (token === sequence.current) {
        controller.current = null;
        setOperation(null);
      }
    }
  }
  function upload(input: { label: string; country: string; file: File }) {
    return run(
      { kind: "upload" },
      async (signal) => {
        const body = new FormData();
        body.set("tripRequestId", tripId);
        body.set("label", input.label);
        body.set("country", input.country);
        body.set("file", input.file);
        const response = await fetch("/api/admin/trip-documents", {
          method: "POST",
          body,
          signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "generic");
        return data.document as TripDocumentDTO;
      },
      (document) => replace((rows) => [document, ...rows]),
    );
  }
  function remove(id: string) {
    return run(
      { kind: "remove", id },
      async (signal) => {
        const response = await fetch(
          `/api/admin/trip-documents/${encodeURIComponent(id)}`,
          { method: "DELETE", signal },
        );
        if (!response.ok) throw new Error("generic");
      },
      () => {
        replace((rows) => rows.filter((row) => row.id !== id));
        onRemoved();
      },
    );
  }
  return { operation, error, upload, remove, busy: operation !== null };
}
