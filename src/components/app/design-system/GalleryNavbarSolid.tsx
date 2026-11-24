"use client";

import { useEffect } from "react";
import { useNavbarChrome } from "@/context/NavbarChromeContext";

/** Forces the solid navbar on gallery pages, whose light ground can't carry the transparent one. */
export function GalleryNavbarSolid() {
  const { setNavbarBackgroundPrimary } = useNavbarChrome();

  useEffect(() => {
    setNavbarBackgroundPrimary(true);
    return () => setNavbarBackgroundPrimary(false);
  }, [setNavbarBackgroundPrimary]);

  return null;
}
