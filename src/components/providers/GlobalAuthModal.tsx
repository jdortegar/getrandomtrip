'use client';

import AuthModal from '@/components/auth/AuthModal';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { useUserStore } from '@/store/slices/userStore';

interface GlobalAuthModalProps {
  dict: Dictionary;
}

/**
 * Single AuthModal for the locale tree, driven by useUserStore.openAuth / closeAuth.
 * Mounted from [locale]/layout so login can open from any page.
 */
export function GlobalAuthModal({ dict }: GlobalAuthModalProps) {
  const { authModalOpen, closeAuth } = useUserStore();

  return (
    <AuthModal
      defaultMode="login"
      dict={dict}
      isOpen={authModalOpen}
      onClose={closeAuth}
    />
  );
}
