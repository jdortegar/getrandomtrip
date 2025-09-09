'use client';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/ui/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/userStore';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { UserRole } from '@/store/userStore';
import { dashboardPathFromRole } from '@/lib/roles';

function LoginContent() {
  const { isAuthed, user, openAuth } = useUserStore();
  const router = useRouter();
  const search = useSearchParams();

  // Abrir modal si no hay sesión
  useEffect(() => {
    if (!isAuthed) openAuth('signin');
  }, [isAuthed, openAuth]);

  // Auto-redirect por rol o ?returnTo=
  useEffect(() => {
    if (!isAuthed) return;

    // Prevent redirect if already on /profile or /u/
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/profile') || currentPath.startsWith('/u/')) {
      return;
    }

    const role = (user?.role as UserRole) ?? 'client';
    const dest = search.get('returnTo') ?? dashboardPathFromRole(role);
    router.replace(dest);
  }, [isAuthed, user?.role, router, search]);

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