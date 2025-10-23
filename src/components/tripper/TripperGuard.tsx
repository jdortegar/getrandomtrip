'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/slices/userStore';
import AuthModal from '@/components/auth/AuthModal';

export default function TripperGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthed, user, authModalOpen, closeAuth } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      return;
    }
    if (user?.role !== 'tripper') {
      router.replace('/dashboard');
    }
  }, [isAuthed, user?.role, router, pathname]);

  if (!isAuthed || user?.role !== 'tripper') return null;
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
