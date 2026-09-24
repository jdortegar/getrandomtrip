"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  shouldShowWelcome,
  WELCOME_COUNTRY_STORAGE_KEY,
} from "@/lib/geo/welcome";

const WELCOME_DELAY_MS = 1000;

interface GeoWelcomeToastProps {
  /** ISO 3166-1 alpha-2 code resolved on the server. */
  countryCode: string;
  /** Flag SVG markup from country-flag-icons (trusted package content). */
  flagSvg: string | null;
  /** Localized, ready-to-show message, e.g. "Welcome to Randomtrip Argentina". */
  message: string;
}

function readLastWelcomedCountry(): string | null {
  try {
    return window.localStorage.getItem(WELCOME_COUNTRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberWelcomedCountry(countryCode: string) {
  try {
    window.localStorage.setItem(WELCOME_COUNTRY_STORAGE_KEY, countryCode);
  } catch {
    // Storage blocked (private mode): the welcome simply shows again next time.
  }
}

/** Welcomes the visitor by country on the first visit and when the country changes. */
export function GeoWelcomeToast({
  countryCode,
  flagSvg,
  message,
}: GeoWelcomeToastProps) {
  useEffect(() => {
    if (!shouldShowWelcome(countryCode, readLastWelcomedCountry())) return;

    const timer = window.setTimeout(() => {
      toast.info(message, {
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
      rememberWelcomedCountry(countryCode);
    }, WELCOME_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [countryCode, flagSvg, message]);

  return null;
}
