'use client';

import React from 'react';
import { hasFlag } from 'country-flag-icons';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { cn } from '@/lib/utils';
import { getCountryCode } from '@/lib/helpers/flags';

export interface CountryFlagProps {
  className?: string;
  /** Country name (e.g. "Argentina", "España"). Used when countryCode is not set. */
  country?: string;
  /** ISO 3166-1 alpha-2 code (e.g. AR, ES). Prefer this when available so the flag stays correct if the name changes. */
  countryCode?: string;
  /** Accessible label, e.g. country name */
  title?: string;
}

/**
 * Renders a country flag. Prefer countryCode when you have it; pass country (name) as fallback.
 * Uses Unicode flag emoji from country-flag-icons (lightweight, no SVG bundle).
 * Examples:
 *   <CountryFlag countryCode="AR" title="Argentina" />
 *   <CountryFlag country="España" title="España" />
 */
export function CountryFlag({
  className,
  country,
  countryCode,
  title,
}: CountryFlagProps) {
  const code =
    countryCode?.toUpperCase().trim() || getCountryCode(country ?? '') || null;
  if (!code || code.length !== 2 || !hasFlag(code)) return null;

  const emoji = getUnicodeFlagIcon(code);
  if (!emoji) return null;

  return (
    <span
      aria-hidden
      className={cn('inline-block leading-none', className)}
      role="img"
      title={title ?? country ?? code}
    >
      {emoji}
    </span>
  );
}

export default CountryFlag;
