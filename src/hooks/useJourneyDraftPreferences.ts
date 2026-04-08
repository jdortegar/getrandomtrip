'use client';

import { useState, useEffect } from 'react';

interface DraftPreferencesUrlValues {
  departPref: string | undefined;
  arrivePref: string | undefined;
  climate: string | undefined;
  maxTravelTime: string | undefined;
  accommodationType: string | undefined;
}

export interface JourneyDraftPreferencesResult {
  draftDepartPref: string;
  draftArrivePref: string;
  draftClimate: string;
  draftMaxTravelTime: string;
  draftAccommodationType: string;
  setDraftDepartPref: (v: string) => void;
  setDraftArrivePref: (v: string) => void;
  setDraftClimate: (v: string) => void;
  setDraftMaxTravelTime: (v: string) => void;
  setDraftAccommodationType: (v: string) => void;
  effectiveDepartPref: string;
  effectiveArrivePref: string;
  effectiveClimate: string;
  effectiveMaxTravelTime: string;
  effectiveAccommodationType: string;
}

/**
 * Manages draft state for the journey preferences tab.
 *
 * On entering the preferences tab (and when URL params change): syncs URL
 * values into local draft state. Filter chips update the URL immediately
 * (same as avoid destinations); draft mirrors the URL via the effect below.
 */
export function useJourneyDraftPreferences(
  activeTab: string,
  urlValues: DraftPreferencesUrlValues,
): JourneyDraftPreferencesResult {
  const [draftDepartPref, setDraftDepartPref] = useState<string>('any');
  const [draftArrivePref, setDraftArrivePref] = useState<string>('any');
  const [draftClimate, setDraftClimate] = useState<string>('any');
  const [draftMaxTravelTime, setDraftMaxTravelTime] = useState<string>('no-limit');
  const [draftAccommodationType, setDraftAccommodationType] = useState<string>('any');

  // Sync URL -> draft when entering preferences step
  useEffect(() => {
    if (activeTab === 'preferences') {
      setDraftDepartPref(urlValues.departPref ?? 'any');
      setDraftArrivePref(urlValues.arrivePref ?? 'any');
      setDraftClimate(urlValues.climate ?? 'any');
      setDraftMaxTravelTime(urlValues.maxTravelTime ?? 'no-limit');
      setDraftAccommodationType(urlValues.accommodationType ?? 'any');
    }
  }, [
    activeTab,
    urlValues.accommodationType,
    urlValues.arrivePref,
    urlValues.climate,
    urlValues.departPref,
    urlValues.maxTravelTime,
  ]);

  const effectiveDepartPref =
    activeTab === 'preferences' ? draftDepartPref : (urlValues.departPref ?? 'any');
  const effectiveArrivePref =
    activeTab === 'preferences' ? draftArrivePref : (urlValues.arrivePref ?? 'any');
  const effectiveClimate =
    activeTab === 'preferences' ? draftClimate : (urlValues.climate ?? 'any');
  const effectiveMaxTravelTime =
    activeTab === 'preferences'
      ? draftMaxTravelTime
      : (urlValues.maxTravelTime ?? 'no-limit');
  const effectiveAccommodationType =
    activeTab === 'preferences'
      ? draftAccommodationType
      : (urlValues.accommodationType ?? 'any');

  return {
    draftDepartPref,
    draftArrivePref,
    draftClimate,
    draftMaxTravelTime,
    draftAccommodationType,
    setDraftDepartPref,
    setDraftArrivePref,
    setDraftClimate,
    setDraftMaxTravelTime,
    setDraftAccommodationType,
    effectiveDepartPref,
    effectiveArrivePref,
    effectiveClimate,
    effectiveMaxTravelTime,
    effectiveAccommodationType,
  };
}
