'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function TripperGuard({ children }: { children: React.ReactNode }) {
  const { isAuthed, user } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthed) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user?.role !== 'tripper') {
      router.replace('/dashboard');
    }
  }, [isAuthed, user?.role, router, pathname]);

  if (!isAuthed || user?.role !== 'tripper') return null;
  return <>{children}</>;
}
