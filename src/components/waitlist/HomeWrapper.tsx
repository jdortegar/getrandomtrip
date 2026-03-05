'use client';

import { useEffect, useState } from 'react';

import { LoginModal } from '@/components/waitlist/LoginModal';
import { WaitlistPage } from '@/components/waitlist/WaitlistPage';
import { getGateUnlocked, GATE_STORAGE_KEY } from '@/lib/constants/marketing-gate';
import type { MarketingDictionary } from '@/lib/types/dictionary';

interface HomeWrapperProps {
  children: React.ReactNode;
  dict: MarketingDictionary;
}

/**
 * Wraps the home content with a waitlist gate. When the gate is locked, shows
 * WaitlistPage + LoginModal. When unlocked (after successful admin login), shows children.
 */
export function HomeWrapper({ children, dict }: HomeWrapperProps) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    setIsUnlocked(getGateUnlocked());
  }, []);

  const handleLoginSuccess = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GATE_STORAGE_KEY, '1');
    }
    setLoginModalOpen(false);
    setIsUnlocked(true);
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

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
