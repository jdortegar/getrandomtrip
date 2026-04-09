'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import { shouldRedirectHomeWhenLeavingAuthModal } from '@/lib/helpers/secureClientPaths';
import { useUserStore } from '@/store/slices/userStore';

interface GlobalAuthModalProps {
  dict: Dictionary;
}

/**
 * Single AuthModal for the locale tree, driven by useUserStore.openAuth / closeAuth.
 * Mounted from [locale]/layout so login can open from any page.
 */
export function GlobalAuthModal({ dict }: GlobalAuthModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { authModalOpen, closeAuth, isAuthed } = useUserStore();

  const handleClose = useCallback(() => {
    closeAuth();
    if (status === 'loading') return;
    if (session?.user || isAuthed) return;
    if (!shouldRedirectHomeWhenLeavingAuthModal(pathname)) return;
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    const locale: Locale = hasLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
    router.replace(pathForLocale(locale, '/'));
  }, [closeAuth, isAuthed, pathname, router, session?.user, status]);

  return (
    <AuthModal
      defaultMode="login"
      dict={dict}
      isOpen={authModalOpen}
      onClose={handleClose}
    />
  );
}
