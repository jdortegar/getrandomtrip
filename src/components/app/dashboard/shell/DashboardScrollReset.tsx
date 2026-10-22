"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls the window to the top whenever the dashboard section (pathname) changes.
 * Next.js only scrolls when the new page segment is off-screen, which leaves the
 * persistent shell at arbitrary offsets. Back/forward navigations are skipped so
 * the browser's restored position is kept.
 */
export function DashboardScrollReset() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const isHistoryNavigationRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      isHistoryNavigationRef.current = true;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    if (isHistoryNavigationRef.current) {
      isHistoryNavigationRef.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
