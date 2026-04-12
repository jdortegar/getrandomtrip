'use client';

import { createContext, useContext } from 'react';

export interface NavbarChromeContextValue {
  setNavbarBackgroundPrimary: (value: boolean) => void;
}

export const NavbarChromeContext =
  createContext<NavbarChromeContextValue | null>(null);

const noopSetNavbarBackgroundPrimary = () => {};

export function useNavbarChrome() {
  const ctx = useContext(NavbarChromeContext);
  return {
    setNavbarBackgroundPrimary:
      ctx?.setNavbarBackgroundPrimary ?? noopSetNavbarBackgroundPrimary,
  };
}
