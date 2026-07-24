"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import AuthModal from "@/components/auth/AuthModal";
import { WaitlistPage } from "@/components/waitlist/WaitlistPage";
import {
  getGateUnlocked,
  GATE_STORAGE_KEY,
} from "@/lib/constants/marketing-gate";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const GATE_ALLOWED_ROLES = new Set(["admin", "tripper"]);

/** Auth utility pages must stay reachable regardless of the marketing gate. */
const GATE_EXEMPT_ROUTES = ["/login", "/verify-email", "/reset-password"];

function isGateExemptRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const routePath = pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/";
  return GATE_EXEMPT_ROUTES.some(
    (route) => routePath === route || routePath.startsWith(`${route}/`),
  );
}

interface HomeWrapperProps {
  children: React.ReactNode;
  dict: MarketingDictionary;
}

/**
 * Wraps the home content with a waitlist gate. When the gate is locked, shows
 * WaitlistPage + AuthModal. When unlocked (after an admin/tripper login), shows children.
 */
export function HomeWrapper({ children, dict }: HomeWrapperProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    setIsUnlocked(getGateUnlocked());
  }, []);

  useEffect(() => {
    const role = session?.user?.role;
    if (!role || !GATE_ALLOWED_ROLES.has(role)) return;
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    setLoginModalOpen(false);
    setIsUnlocked(true);
  }, [session?.user?.role]);

  if (isGateExemptRoute(pathname)) {
    return <>{children}</>;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

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
