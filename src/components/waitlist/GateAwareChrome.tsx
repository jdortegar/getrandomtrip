'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/Navbar';
import { NavbarChromeContext } from '@/context/NavbarChromeContext';
import { LoginModal } from '@/components/waitlist/LoginModal';
import { WaitlistPage } from '@/components/waitlist/WaitlistPage';
import { getGateUnlocked, GATE_STORAGE_KEY } from '@/lib/constants/marketing-gate';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface GateAwareChromeProps {
  children: React.ReactNode;
  dict: Dictionary;
  locale: Locale;
}

export function GateAwareChrome({ children, dict, locale }: GateAwareChromeProps) {
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navbarBackgroundPrimary, setNavbarBackgroundPrimary] = useState(false);

  useEffect(() => {
    setGateUnlocked(getGateUnlocked());
  }, []);

  const handleLoginSuccess = () => {
    window.localStorage.setItem(GATE_STORAGE_KEY, '1');
    setLoginModalOpen(false);
    setGateUnlocked(true);
  };

  if (!gateUnlocked) {
    return (
      <>
        <WaitlistPage
          dict={dict.waitlist}
          onOpenLogin={() => setLoginModalOpen(true)}
        />
        <LoginModal
          dict={dict.waitlist.loginModal}
          onOpenChange={setLoginModalOpen}
          onSuccess={handleLoginSuccess}
          open={loginModalOpen}
        />
      </>
    );
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
