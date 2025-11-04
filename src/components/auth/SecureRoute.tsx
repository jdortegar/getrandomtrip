'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/slices/userStore';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/media/BgCarousel';
import AuthModal from '@/components/auth/AuthModal';
import LoadingSpinner from '../layout/LoadingSpinner';

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
  const { isAuthed, user, authModalOpen, closeAuth } = useUserStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Normalize role - handle both uppercase (DB) and lowercase (store) formats
  const normalizeRole = (role: string | undefined): string | null => {
    if (!role) return null;
    return role.toLowerCase();
  };

  const userRoleFromStore = normalizeRole(user?.role);
  const userRoleFromSession = normalizeRole((session?.user as any)?.role);
  const normalizedRequiredRole = requiredRole ? requiredRole.toLowerCase() : null;

  useEffect(() => {
    if (status === 'loading') return;

    // Check authentication
    if (!session && !isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      return;
    }

    // Check role if required (compare normalized roles)
    if (
      normalizedRequiredRole &&
      userRoleFromStore !== normalizedRequiredRole &&
      userRoleFromSession !== normalizedRequiredRole
    ) {
      router.push('/unauthorized');
      return;
    }

    setIsChecking(false);
  }, [session, status, isAuthed, userRoleFromStore, userRoleFromSession, normalizedRequiredRole, router]);

  if (status === 'loading' || isChecking) {
    return <LoadingSpinner />;
  }

  if (!session && !isAuthed) {
    return (
      fallback || (
        <>
          <BgCarousel scrim={0.75} />
          <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16">
            <GlassCard>
              <div className="p-6 text-center text-neutral-700">
                Redirigiendo al login...
              </div>
            </GlassCard>
          </main>
        </>
      )
    );
  }

  // Check role if required (compare normalized roles)
  if (
    normalizedRequiredRole &&
    userRoleFromStore !== normalizedRequiredRole &&
    userRoleFromSession !== normalizedRequiredRole
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

  return (
    <>
      {children}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuth}
        defaultMode="login"
      />
    </>
  );
}
