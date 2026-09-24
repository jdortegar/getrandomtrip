"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const WELCOME_DELAY_MS = 1000;
const WELCOME_DURATION_MS = 7000;

// Module scope lives for one page load: every visit to the site welcomes the
// visitor, but client-side navigation back to the landing does not repeat it.
let welcomedThisPageLoad = false;

interface GeoWelcomeToastProps {
  /** ISO 3166-1 alpha-2 code resolved on the server. */
  countryCode: string;
  /** Flag SVG markup from country-flag-icons (trusted package content). */
  flagSvg: string | null;
  /** Localized, ready-to-show message, e.g. "Welcome to Randomtrip Argentina". */
  message: string;
}

/** Welcomes the visitor by country every time they enter the site. */
export function GeoWelcomeToast({
  countryCode,
  flagSvg,
  message,
}: GeoWelcomeToastProps) {
  useEffect(() => {
    if (welcomedThisPageLoad) return;

    const timer = window.setTimeout(() => {
      welcomedThisPageLoad = true;
      toast.info(message, {
        duration: WELCOME_DURATION_MS,
        // The Toaster top-aligns toasts inline; center the flag with the text here.
        classNames: { toast: "!items-center" },
        icon: flagSvg ? (
          // 22×15 (3:2) fits the Toaster's 22px icon slot.
          <span
            aria-hidden
            className="block h-[15px] w-[22px] overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: flagSvg }}
          />
        ) : undefined,
      });
    }, WELCOME_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [countryCode, flagSvg, message]);

  return null;
}
