export const dynamic = 'force-dynamic';

import SecureRouteWrapper from '@/components/auth/SecureRouteWrapper';

export default function TripperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRouteWrapper requiredRole="tripper">{children}</SecureRouteWrapper>
  );
}
