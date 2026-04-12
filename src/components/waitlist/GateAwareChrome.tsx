'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/Navbar';
import { NavbarChromeContext } from '@/context/NavbarChromeContext';
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
  const [navbarBackgroundPrimary, setNavbarBackgroundPrimary] = useState(false);

  useEffect(() => {
    setGateUnlocked(getGateUnlocked());
  }, []);

  if (!gateUnlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar
        backgroundPrimary={navbarBackgroundPrimary}
        dict={dict}
        locale={locale}
      />
      <NavbarChromeContext.Provider value={{ setNavbarBackgroundPrimary }}>
        <main className="min-h-screen">{children}</main>
      </NavbarChromeContext.Provider>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
