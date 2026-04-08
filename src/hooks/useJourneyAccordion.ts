'use client';

import { useState, useEffect } from 'react';
import { JOURNEY_ADDONS_ENABLED } from 'config/journey-features';

export interface JourneyAccordionResult {
  accordionValue: string;
  setAccordionValue: (v: string) => void;
}

/**
 * Manages accordion open/close state for the journey flow.
 *
 * Supports both controlled mode (openSectionId + onOpenSection provided by parent)
 * and uncontrolled mode (internal state).
 *
 * Automatically opens the appropriate section when the active tab changes.
 */
export function useJourneyAccordion(
  activeTab: string,
  openSectionId: string | undefined,
  onOpenSection: ((sectionId: string) => void) | undefined,
): JourneyAccordionResult {
  const [internalAccordion, setInternalAccordion] = useState<string>('');
  const isControlled = openSectionId !== undefined && onOpenSection !== undefined;
  const accordionValue = isControlled ? (openSectionId ?? '') : internalAccordion;
  const setAccordionValue = isControlled ? onOpenSection! : setInternalAccordion;

  // Auto-open the first section of each tab when the tab changes
  useEffect(() => {
    if (
      activeTab === 'budget' &&
      accordionValue !== 'travel-type' &&
      accordionValue !== 'experience'
    ) {
      setAccordionValue('travel-type');
    } else if (
      activeTab === 'excuse' &&
      accordionValue !== 'excuse' &&
      accordionValue !== 'refine-details'
    ) {
      setAccordionValue('excuse');
    } else if (
      activeTab === 'details' &&
      accordionValue !== 'dates' &&
      accordionValue !== 'origin' &&
      accordionValue !== 'transport'
    ) {
      setAccordionValue('origin');
    } else if (
      activeTab === 'preferences' &&
      accordionValue !== '' &&
      accordionValue !== 'filters' &&
      !(JOURNEY_ADDONS_ENABLED && accordionValue === 'addons')
    ) {
      setAccordionValue('filters');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accordionValue]);

  return { accordionValue, setAccordionValue };
}
