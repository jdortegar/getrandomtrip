"use client";

import { createContext, useContext } from "react";

export interface NavbarChromeContextValue {
  setNavbarBackgroundPrimary: (value: boolean) => void;
  /**
   * Page-level override: while true, the navbar uses its transparent hero
   * overlay variant even inside the solid dashboard chrome (e.g. the trip
   * reveal's full-viewport destination hero). Independent of
   * `setNavbarBackgroundPrimary`, so the two cleanups never race on unmount.
   */
  setNavbarOverlay?: (value: boolean) => void;
}

export const NavbarChromeContext =
  createContext<NavbarChromeContextValue | null>(null);

const noop = () => {};

export function useNavbarChrome() {
  const ctx = useContext(NavbarChromeContext);
  return {
    setNavbarBackgroundPrimary: ctx?.setNavbarBackgroundPrimary ?? noop,
    setNavbarOverlay: ctx?.setNavbarOverlay ?? noop,
  };
}
