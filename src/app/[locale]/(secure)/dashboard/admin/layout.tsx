export const dynamic = 'force-dynamic';

import SecureRouteWrapper from '@/components/auth/SecureRouteWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRouteWrapper requiredRole="admin">{children}</SecureRouteWrapper>
  );
}
