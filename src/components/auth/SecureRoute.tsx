'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/slices/userStore';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/media/BgCarousel';
import LoadingSpinner from '../layout/LoadingSpinner';
import { hasRoleAccess } from '@/lib/auth/roleAccess';

interface SecureRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'tripper' | 'admin';
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
  const [isChecking, setIsChecking] = useState(true);

  const sessionUser = session?.user as
    | { role?: string; roles?: Array<'admin' | 'client' | 'tripper'> }
    | undefined;

  const subjectFromStore =
    user?.roles && user.roles.length > 0 ? { role: user.role, roles: user.roles } : { role: user?.role };

  const subjectFromSession =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : { role: sessionUser?.role };

  const normalizedRequiredRole = requiredRole ? requiredRole.toLowerCase() : null;

  // Stable keys for effect deps (object literals above change identity every render and would retrigger the effect)
  const storeRoleKey = user?.role ?? '';
  const storeRolesKey = user?.roles?.length ? user.roles.join(',') : '';
  const sessionRoleKey = sessionUser?.role ?? '';
  const sessionRolesKey = sessionUser?.roles?.length ? sessionUser.roles.join(',') : '';

  useEffect(() => {
    if (status === 'loading') return;

    const storeSubject =
      user?.roles && user.roles.length > 0 ? { role: user.role, roles: user.roles } : { role: user?.role };
    const sessionSubject =
      sessionUser?.roles && sessionUser.roles.length > 0
        ? { role: sessionUser.role, roles: sessionUser.roles }
        : { role: sessionUser?.role };

    // When not authenticated: open auth modal on the same page (no redirect)
    if (!session && !isAuthed) {
      useUserStore.getState().openAuth('signin');
      setIsChecking(false);
      return;
    }

    // Check role if required (compare normalized roles)
    if (
      normalizedRequiredRole &&
      !hasRoleAccess(storeSubject, normalizedRequiredRole as 'client' | 'tripper' | 'admin') &&
      !hasRoleAccess(sessionSubject, normalizedRequiredRole as 'client' | 'tripper' | 'admin')
    ) {
      router.push('/unauthorized');
      return;
    }

    setIsChecking(false);
  }, [
    isAuthed,
    normalizedRequiredRole,
    router,
    session,
    sessionRoleKey,
    sessionRolesKey,
    status,
    storeRoleKey,
    storeRolesKey,
  ]);

  if (status === 'loading' || isChecking) {
    return <LoadingSpinner />;
  }

  // Not authenticated: show same page + auth modal (no full-page fallback)
  if (!session && !isAuthed) {
    return <>{children}</>;
  }

  // Check role if required (compare normalized roles)
  if (
    normalizedRequiredRole &&
    !hasRoleAccess(subjectFromStore, normalizedRequiredRole as 'client' | 'tripper' | 'admin') &&
    !hasRoleAccess(subjectFromSession, normalizedRequiredRole as 'client' | 'tripper' | 'admin')
  ) {
    return (
      fallback || (
        <>
          <BgCarousel scrim={0.75} />
          <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16">
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
