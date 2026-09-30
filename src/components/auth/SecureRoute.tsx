"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/slices/userStore";
import GlassCard from "@/components/ui/GlassCard";
import BgCarousel from "@/components/media/BgCarousel";
import LoadingSpinner from "../layout/LoadingSpinner";
import { hasRoleAccess } from "@/lib/auth/roleAccess";

interface SecureRouteProps {
  children: React.ReactNode;
  requiredRole?: "traveler" | "tripper" | "admin";
  fallback?: React.ReactNode;
}

export default function SecureRoute({
  children,
  requiredRole,
  fallback,
}: SecureRouteProps) {
  const { data: session, status } = useSession();
  const { isAuthed, user } = useUserStore();
  const router = useRouter();

  const sessionUser = session?.user as
    | { role?: string; roles?: Array<"admin" | "traveler" | "tripper"> }
    | undefined;

  const subjectFromStore =
    user?.roles && user.roles.length > 0
      ? { role: user.role, roles: user.roles }
      : { role: user?.role };

  const subjectFromSession =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : { role: sessionUser?.role };

  const normalizedRequiredRole = requiredRole
    ? requiredRole.toLowerCase()
    : null;

  const allowed = !normalizedRequiredRole ||
    hasRoleAccess(subjectFromStore, requiredRole!) ||
    hasRoleAccess(subjectFromSession, requiredRole!);

  useEffect(() => {
    if (status === "loading") return;
    if (!session && !isAuthed) {
      useUserStore.getState().openAuth("signin");
    } else if (!allowed) {
      router.push("/unauthorized");
    }
  }, [allowed, isAuthed, router, session, status]);

  if (status === "loading") {
    return <LoadingSpinner data-component="SecureRoute" />;
  }

  // Not authenticated: show same page + auth modal (no full-page fallback)
  if (!session && !isAuthed) {
    return <>{children}</>;
  }

  // Check role if required (compare normalized roles)
  if (
    normalizedRequiredRole &&
    !hasRoleAccess(
      subjectFromStore,
      normalizedRequiredRole as "traveler" | "tripper" | "admin",
    ) &&
    !hasRoleAccess(
      subjectFromSession,
      normalizedRequiredRole as "traveler" | "tripper" | "admin",
    )
  ) {
    return (
      fallback || (
        <>
          <BgCarousel scrim={0.75} />
          <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16" data-component="SecureRoute">
            <GlassCard>
              <div className="p-6 text-center text-neutral-700">
                <div className="text-red-600 mb-4">⚠️ Acceso denegado</div>
                <p>No tienes permisos para acceder a esta página.</p>
              </div>
            </GlassCard>
          </main>
        </>
      )
    );
  }

  return <>{children}</>;
}
