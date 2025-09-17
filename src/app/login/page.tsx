'use client';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/media/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/slices/userStore';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/store/slices/userStore';
import { dashboardPathFromRole } from '@/lib/roles';

function LoginContent() {
  const { data: session, status } = useSession();
  const { openAuth } = useUserStore();
  const router = useRouter();
  const search = useSearchParams();

  // Abrir modal si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      openAuth('signin');
    }
  }, [status, openAuth]);

  // Auto-redirect por rol o ?returnTo=
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    // Prevent redirect if already on /profile or /u/
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/profile') || currentPath.startsWith('/u/')) {
      return;
    }

    const role = (session.user?.role as UserRole) ?? 'client';
    const returnTo = search.get('returnTo');
    const dest = returnTo ?? dashboardPathFromRole(role);

    // Decode the returnTo URL if it exists
    const finalDest = returnTo ? decodeURIComponent(returnTo) : dest;
    router.replace(finalDest);
  }, [status, session, router, search]);

  // Mensaje breve mientras redirige
  return (
    <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16">
      <GlassCard>
        <div className="p-6 text-center text-neutral-700">Redirigiendo…</div>
      </GlassCard>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.75} />

      <Suspense
        fallback={
          <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16">
            <GlassCard>
              <div className="p-6 text-center text-neutral-700">Cargando…</div>
            </GlassCard>
          </main>
        }
      >
        <LoginContent />
      </Suspense>

      <ChatFab />
    </>
  );
}
