export const dynamic = 'force-dynamic';

import SecureRouteWrapper from '@/components/auth/SecureRouteWrapper';
import AdminShell from './AdminLayoutClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRouteWrapper requiredRole="admin">
      <AdminShell>{children}</AdminShell>
    </SecureRouteWrapper>
  );
}
