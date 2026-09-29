"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TokenSwatchProps {
  copy: DesignSystemDict["foundations"]["clipboard"];
  fallback: string;
  name: string;
  token: string;
  usage: string;
}

const subscribe = () => () => {};

export function TokenSwatch({
  copy,
  fallback,
  name,
  token,
  usage,
}: TokenSwatchProps) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inFlight = useRef(false);
  const readValue = () =>
    getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
    fallback;

  const value = useSyncExternalStore(subscribe, readValue, () => fallback);

  async function handleCopy() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFeedback("");
    try {
      const current = readValue();
      await navigator.clipboard.writeText(current);
      setFeedback(copy.success);
    } catch {
      setFeedback(copy.failure);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="min-w-0">
      <button
        aria-busy={pending}
        aria-label={`${pending ? copy.pending : copy.action} ${name}`}
        className={cn(
          "bg-white border border-gray-200 cursor-pointer overflow-hidden rounded-xl text-left w-full",
          "disabled:cursor-wait",
        )}
        disabled={pending}
        onClick={handleCopy}
        type="button"
      >
        <span
          aria-hidden
          className="block border-b border-gray-200 h-20"
          style={{ backgroundColor: `var(${token}, ${fallback})` }}
        />
        <span className="block p-4">
          <span className="flex font-semibold gap-2 items-center justify-between text-sm">
            {name}
            {pending ? (
              <Loader2 aria-hidden className="animate-spin h-4 shrink-0 w-4" />
            ) : feedback === copy.success ? (
              <Check aria-hidden className="h-4 shrink-0 w-4" />
            ) : (
              <Copy aria-hidden className="h-4 shrink-0 w-4" />
            )}
          </span>
          <span className="block break-all font-mono mt-2 text-neutral-600 text-xs">
            {value}
          </span>
          <span className="block break-all font-mono mt-1 text-neutral-600 text-xs">
            {token}
          </span>
          <span className="block mt-3 text-neutral-600 text-xs">{usage}</span>
        </span>
      </button>
      <p className="min-h-6 mt-2 text-primary text-xs" role="status">
        {pending ? copy.pending : feedback}
      </p>
    </div>
  );
}
