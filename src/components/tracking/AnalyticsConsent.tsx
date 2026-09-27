"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  readAnalyticsConsent,
  saveAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "@/lib/helpers/tracking/consent";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useAnalyticsPreferencesStore } from "@/store/slices/analyticsPreferencesStore";

export default function AnalyticsConsent({
  copy,
}: {
  copy: Dictionary["analyticsConsent"];
}) {
  const consent = useSyncExternalStore(
    subscribeAnalyticsConsent,
    readAnalyticsConsent,
    () => null,
  );
  const open = useAnalyticsPreferencesStore((state) => state.open);
  const setOpen = useAnalyticsPreferencesStore((state) => state.setOpen);
  const show = open || consent === null;
  const showClose = open && consent !== null;
  const choose = (value: "granted" | "denied") => {
    saveAnalyticsConsent(value);
    setOpen(false);
  };
  return show ? (
    <section
      aria-labelledby="analytics-consent-title"
      className="bg-white border border-gray-200 bottom-4 fixed left-4 max-w-md p-5 right-4 rounded-xl shadow-lg z-[100]"
      role="region"
    >
      {showClose && (
        <button
          aria-label={copy.close}
          className={cn(
            "absolute opacity-70 right-4 ring-offset-background rounded-xs top-4 transition-opacity",
            "hover:opacity-100",
            "focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-ring",
          )}
          onClick={() => setOpen(false)}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
      <h2
        className={cn("font-semibold text-gray-900", showClose && "pr-6")}
        id="analytics-consent-title"
      >
        {copy.title}
      </h2>
      <p className="my-3 text-gray-700 text-sm">{copy.description}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => choose("granted")} size="sm">
          {copy.accept}
        </Button>
        <Button onClick={() => choose("denied")} size="sm" variant="secondary">
          {copy.reject}
        </Button>
      </div>
    </section>
  ) : null;
}
