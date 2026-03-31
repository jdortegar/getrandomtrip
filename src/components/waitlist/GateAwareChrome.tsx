'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/Navbar';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { getGateUnlocked } from '@/lib/constants/marketing-gate';

interface GateAwareChromeProps {
  children: React.ReactNode;
  dict: Dictionary;
  locale: Locale;
}

/**
 * Renders Navbar and Footer only when the gate is unlocked (GATE_STORAGE_KEY in localStorage).
 * When locked, only children are shown (e.g. waitlist view).
 */
export function GateAwareChrome({ children, dict, locale }: GateAwareChromeProps) {
  const [gateUnlocked, setGateUnlocked] = useState(false);

  useEffect(() => {
    setGateUnlocked(getGateUnlocked());
  }, []);

  if (!gateUnlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main className="min-h-screen">{children}</main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
