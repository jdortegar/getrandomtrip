"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/Navbar";
import { NavbarChromeContext } from "@/context/NavbarChromeContext";
import AuthModal from "@/components/auth/AuthModal";
import { WaitlistPage } from "@/components/waitlist/WaitlistPage";
import {
  getGateUnlocked,
  GATE_STORAGE_KEY,
} from "@/lib/constants/marketing-gate";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const GATE_ALLOWED_ROLES = new Set(["admin", "tripper"]);

/** Auth utility pages must stay reachable regardless of the marketing gate. */
const GATE_EXEMPT_ROUTES = [
  "/login",
  "/verify-email",
  "/reset-password",
  "/tripper-invite",
  "/invite",
];

function isGateExemptRoute(pathname: string | null, locale: Locale): boolean {
  if (!pathname) return false;
  const withLocalePrefix = `/${locale}`;
  const routePath = pathname.startsWith(withLocalePrefix)
    ? (pathname.slice(withLocalePrefix.length) || "/")
    : pathname;
  return GATE_EXEMPT_ROUTES.some(
    (route) => routePath === route || routePath.startsWith(`${route}/`),
  );
}

interface GateAwareChromeProps {
  /** Server-rendered pricing-mode banner (design ADR-9) — renders `null` when there is no live attribution to surface. */
  banner?: React.ReactNode;
  children: React.ReactNode;
  dict: Dictionary;
  /** Global admin toggle (site_settings.gateEnabled). False = gate is fully
   * off for everyone, regardless of role or the per-browser unlock below. */
  gateEnabled: boolean;
  locale: Locale;
}

export function GateAwareChrome({
  banner,
  children,
  dict,
  gateEnabled,
  locale,
}: GateAwareChromeProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [gateUnlocked, setGateUnlocked] = useState<boolean | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navbarBackgroundPrimary, setNavbarBackgroundPrimary] = useState(false);

  const role = session?.user?.role;
  const sessionGrantsAccess =
    (!!role && GATE_ALLOWED_ROLES.has(role)) || !!session?.user?.hasSiteAccess;

  useEffect(() => {
    setGateUnlocked(getGateUnlocked());
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") return;
    if (sessionGrantsAccess) {
      window.localStorage.setItem(GATE_STORAGE_KEY, "1");
      setLoginModalOpen(false);
      setGateUnlocked(true);
    } else {
      window.localStorage.removeItem(GATE_STORAGE_KEY);
      setGateUnlocked(false);
    }
  }, [status, sessionGrantsAccess]);

  const normalChrome = (
    <>
      {banner}
      <div className="relative">
        <Navbar
          backgroundPrimary={navbarBackgroundPrimary}
          dict={dict}
          locale={locale}
        />
        <NavbarChromeContext.Provider value={{ setNavbarBackgroundPrimary }}>
          <main className="min-h-screen">{children}</main>
        </NavbarChromeContext.Provider>
      </div>
      <Footer dict={dict} locale={locale} />
    </>
  );

  if (isGateExemptRoute(pathname, locale)) {
    return <>{children}</>;
  }

  if (!gateEnabled) {
    return normalChrome;
  }

  if (gateUnlocked === null) return null;

  if (!gateUnlocked) {
    const accessDenied = status === "authenticated" && !sessionGrantsAccess;

    return (
      <>
        <WaitlistPage
          accessDenied={accessDenied}
          dict={dict.waitlist}
          onOpenLogin={() => setLoginModalOpen(true)}
          onSignOut={() => signOut()}
        />
        <AuthModal
          allowRegister={false}
          defaultMode="login"
          dict={dict}
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </>
    );
  }

  return normalChrome;
}
