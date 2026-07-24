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
  children: React.ReactNode;
  dict: Dictionary;
  locale: Locale;
}

export function GateAwareChrome({
  children,
  dict,
  locale,
}: GateAwareChromeProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [gateUnlocked, setGateUnlocked] = useState<boolean | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navbarBackgroundPrimary, setNavbarBackgroundPrimary] = useState(false);

  useEffect(() => {
    setGateUnlocked(getGateUnlocked());
  }, []);

  useEffect(() => {
    const role = session?.user?.role;
    if (!role || !GATE_ALLOWED_ROLES.has(role)) return;
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    setLoginModalOpen(false);
    setGateUnlocked(true);
  }, [session?.user?.role]);

  if (isGateExemptRoute(pathname, locale)) {
    return <>{children}</>;
  }

  if (gateUnlocked === null) return null;

  if (!gateUnlocked) {
    const role = session?.user?.role;
    const accessDenied = !!role && !GATE_ALLOWED_ROLES.has(role);

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
