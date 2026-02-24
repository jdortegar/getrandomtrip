'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserStore } from '@/store/slices/userStore';
import TripperGuard from '@/components/tripper/TripperGuard'; // Added import

export default function TripperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    if (user && user.role !== 'tripper') router.replace('/dashboard');
  }, [user, router]);

  return (
    <TripperGuard>
      {children}
    </TripperGuard>
  );
}