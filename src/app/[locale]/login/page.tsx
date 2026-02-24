'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import AuthModal from '@/components/auth/AuthModal';
import Hero from '@/components/Hero';
import Section from '@/components/layout/Section';
import type { UserRole } from '@/store/slices/userStore';
import { dashboardPathFromRole } from '@/lib/roles';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

function LoginContent() {
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
  const router = useRouter();
  const search = useSearchParams();

  // Auto-redirect if authenticated
  useEffect(() => {
    if (status !== 'authenticated' && !isAuthed) return;

    const role = (session?.user?.role as UserRole) ?? 'client';
    const returnTo = search.get('returnTo');
    const dest = returnTo
      ? decodeURIComponent(returnTo)
      : dashboardPathFromRole(role);

    router.replace(dest);
  }, [status, session, isAuthed, router, search]);

  // Show auth modal if not authenticated
  const showModal = status !== 'loading' && !session && !isAuthed;

  return (
    <>
      <Section>
        {status === 'loading' ? (
          <LoadingSpinner />
        ) : (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center text-neutral-700">
              {session || isAuthed ? 'Redirigiendo...' : 'Cargando...'}
            </div>
          </div>
        )}
      </Section>
      <AuthModal isOpen={showModal} onClose={() => {}} defaultMode="login" />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginContent />
    </Suspense>
  );
}
