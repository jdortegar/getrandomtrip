'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';

type UpdateQuery = (patch: Record<string, string | string[] | undefined>) => void;

interface DraftDetailsUrlValues {
  originCountry: string;
  originCity: string;
  startDate: string | undefined;
  nights: number;
  transportOrder: string[];
}

export interface JourneyDraftDetailsResult {
  draftOriginCountry: string;
  draftOriginCity: string;
  draftStartDate: string | undefined;
  draftNights: number;
  draftTransportOrder: string[];
  setDraftOriginCountry: (v: string) => void;
  setDraftOriginCity: (v: string) => void;
  setDraftStartDate: (v: string | undefined) => void;
  setDraftNights: (v: number) => void;
  setDraftTransportOrder: (v: string[]) => void;
  effectiveOriginCountry: string;
  effectiveOriginCity: string;
  effectiveStartDate: string | undefined;
  effectiveNights: number;
  effectiveTransportOrder: string[];
}

/**
 * Manages draft state for the journey details tab.
 *
 * On entering the details tab: syncs URL values into local draft state.
 * On leaving the details tab: flushes draft values back to the URL.
 * While on the details tab: returns draft values as "effective" values.
 * On any other tab: returns committed URL values as "effective" values.
 */
export function useJourneyDraftDetails(
  activeTab: string,
  urlValues: DraftDetailsUrlValues,
  updateQuery: UpdateQuery,
): JourneyDraftDetailsResult {
  const [draftOriginCountry, setDraftOriginCountry] = useState('');
  const [draftOriginCity, setDraftOriginCity] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<string | undefined>(undefined);
  const [draftNights, setDraftNights] = useState(1);
  const [draftTransportOrder, setDraftTransportOrder] = useState<string[]>(DEFAULT_TRANSPORT_ORDER);

  // Stable ref so the flush effect can call updateQuery without it being a dep.
  // useQuerySync returns a new function every render; listing it as a dep would
  // re-fire the flush effect on every render and risk double-flushing.
  const updateQueryRef = useRef(updateQuery);
  useEffect(() => {
    updateQueryRef.current = updateQuery;
  });

  const prevActiveTabRef = useRef(activeTab);

  // Sync URL -> draft when entering details step
  useEffect(() => {
    if (activeTab === 'details') {
      setDraftOriginCountry(urlValues.originCountry);
      setDraftOriginCity(urlValues.originCity);
      setDraftStartDate(urlValues.startDate);
      setDraftNights(urlValues.nights);
      setDraftTransportOrder(urlValues.transportOrder);
      prevActiveTabRef.current = activeTab;
    }
  }, [
    activeTab,
    urlValues.originCity,
    urlValues.originCountry,
    urlValues.nights,
    urlValues.startDate,
    urlValues.transportOrder,
  ]);

  // Flush draft -> URL when leaving details step
  useEffect(() => {
    if (prevActiveTabRef.current === 'details' && activeTab !== 'details') {
      updateQueryRef.current({
        nights: String(draftNights),
        originCity: draftOriginCity || undefined,
        originCountry: draftOriginCountry || undefined,
        startDate: draftStartDate ?? undefined,
        transportOrder:
          draftTransportOrder.length === 4
            ? draftTransportOrder.join(',')
            : undefined,
      });
    }
    prevActiveTabRef.current = activeTab;
  }, [
    activeTab,
    draftOriginCity,
    draftOriginCountry,
    draftNights,
    draftStartDate,
    draftTransportOrder,
  ]);

  const effectiveOriginCountry =
    activeTab === 'details' ? draftOriginCountry : urlValues.originCountry;
  const effectiveOriginCity =
    activeTab === 'details' ? draftOriginCity : urlValues.originCity;
  const effectiveStartDate =
    activeTab === 'details' ? draftStartDate : urlValues.startDate;
  const effectiveNights =
    activeTab === 'details' ? draftNights : urlValues.nights;
  const effectiveTransportOrder =
    activeTab === 'details' ? draftTransportOrder : urlValues.transportOrder;

  return {
    draftOriginCountry,
    draftOriginCity,
    draftStartDate,
    draftNights,
    draftTransportOrder,
    setDraftOriginCountry,
    setDraftOriginCity,
    setDraftStartDate,
    setDraftNights,
    setDraftTransportOrder,
    effectiveOriginCountry,
    effectiveOriginCity,
    effectiveStartDate,
    effectiveNights,
    effectiveTransportOrder,
  };
}
