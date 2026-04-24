'use client';
import SecureRoute from '@/components/auth/SecureRoute';

export default function TripperLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRoute requiredRole="tripper">
      {children}
    </SecureRoute>
  );
}

