'use client';
import TripperGuard from '@/components/tripper/TripperGuard';

export default function TripperLayout({ children }: { children: React.ReactNode }) {
  // Let TripperGuard handle all role checking and redirects
  // This prevents duplicate redirects and loops
  return (
    <TripperGuard>
      {children}
    </TripperGuard>
  );
}
