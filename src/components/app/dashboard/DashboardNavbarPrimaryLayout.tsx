'use client';

import { useEffect } from 'react';
import { useNavbarChrome } from '@/context/NavbarChromeContext';

interface DashboardNavbarPrimaryLayoutProps {
  children: React.ReactNode;
}

/**
 * Enables the marketing Navbar primary surface for the whole dashboard subtree.
 * Must render under {@link NavbarChromeContext} (GateAwareChrome when gate is unlocked).
 */
export function DashboardNavbarPrimaryLayout({
  children,
}: DashboardNavbarPrimaryLayoutProps) {
  const { setNavbarBackgroundPrimary } = useNavbarChrome();

  useEffect(() => {
    setNavbarBackgroundPrimary(true);
    return () => setNavbarBackgroundPrimary(false);
  }, [setNavbarBackgroundPrimary]);

  return <>{children}</>;
}
