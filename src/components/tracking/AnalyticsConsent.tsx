"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import {
  readAnalyticsConsent,
  saveAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "@/lib/helpers/tracking/consent";
import type { Dictionary } from "@/lib/i18n/dictionaries";

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
  const [open, setOpen] = useState(false);
  const show = open || consent === null;
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
      <h2 className="font-semibold text-gray-900" id="analytics-consent-title">
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
        {open && (
          <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
            {copy.close}
          </Button>
        )}
      </div>
    </section>
  ) : (
    <button
      className="bg-white border border-gray-200 bottom-3 fixed left-3 p-2 rounded-md text-gray-900 text-xs z-50"
      onClick={() => setOpen(true)}
      type="button"
    >
      {copy.preferences}
    </button>
  );
}
