"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AppTracking from "@/components/tracking/AppTracking";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/Navbar";
import { NavbarChromeContext } from "@/context/NavbarChromeContext";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Auth utility pages render on their own, without the site navbar/footer. */
const BARE_ROUTES = [
  "/login",
  "/verify-email",
  "/reset-password",
  "/tripper-invite",
  "/invite",
  "/unsubscribe",
];

function isBareRoute(pathname: string | null, locale: Locale): boolean {
  if (!pathname) return false;
  const withLocalePrefix = `/${locale}`;
  const routePath = pathname.startsWith(withLocalePrefix)
    ? pathname.slice(withLocalePrefix.length) || "/"
    : pathname;
  if (
    process.env.NODE_ENV === "development" &&
    routePath === "/sentry-example-page"
  )
    return true;
  return BARE_ROUTES.some(
    (route) => routePath === route || routePath.startsWith(`${route}/`),
  );
}

interface SiteChromeProps {
  /** Server-rendered pricing-mode banner (design ADR-9) — renders `null` when there is no live attribution to surface. */
  banner?: React.ReactNode;
  children: React.ReactNode;
  dict: Dictionary;
  locale: Locale;
}

/**
 * Navbar, footer and analytics around every localized page. Maintenance mode
 * is not handled here: the proxy answers with the maintenance page before any
 * page renders (`src/lib/maintenance/proxyGate.ts`).
 */
export function SiteChrome({
  banner,
  children,
  dict,
  locale,
}: SiteChromeProps) {
  const pathname = usePathname();
  const [navbarBackgroundPrimary, setNavbarBackgroundPrimary] = useState(false);

  if (isBareRoute(pathname, locale)) {
    return <>{children}</>;
  }

  return (
    <>
      <AppTracking />
      {banner}
      <div className="relative">
        <Navbar
          backgroundPrimary={navbarBackgroundPrimary}
          contained
          dict={dict}
          locale={locale}
        />
        <NavbarChromeContext.Provider value={{ setNavbarBackgroundPrimary }}>
          <main className="min-h-screen">{children}</main>
        </NavbarChromeContext.Provider>
        <Footer dict={dict} locale={locale} />
      </div>
    </>
  );
}
