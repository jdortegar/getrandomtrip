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
 * Resolves invalid accordion state when the active **step** (tab) changes.
 * Substep open/close is user-controlled; selection does not auto-advance substeps.
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

  // When the step (tab) changes, or the open substep id is invalid for this step,
  // align to a default substep. '' is valid: user may keep all substeps closed.
  useEffect(() => {
    if (activeTab === 'budget') {
      const valid =
        accordionValue === 'travel-type' ||
        accordionValue === 'experience' ||
        accordionValue === '';
      if (!valid) {
        setAccordionValue('travel-type');
      }
    } else if (activeTab === 'excuse') {
      const valid =
        accordionValue === 'excuse' ||
        accordionValue === 'refine-details' ||
        accordionValue === '';
      if (!valid) {
        setAccordionValue('excuse');
      }
    } else if (activeTab === 'details') {
      const valid =
        accordionValue === 'origin' ||
        accordionValue === 'dates' ||
        accordionValue === 'transport' ||
        accordionValue === '';
      if (!valid) {
        setAccordionValue('origin');
      }
    } else if (activeTab === 'preferences') {
      const valid =
        accordionValue === '' ||
        accordionValue === 'filters' ||
        (JOURNEY_ADDONS_ENABLED && accordionValue === 'addons');
      if (!valid) {
        setAccordionValue('filters');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accordionValue]);

  return { accordionValue, setAccordionValue };
}
