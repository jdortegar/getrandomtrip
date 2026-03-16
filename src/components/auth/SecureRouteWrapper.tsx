'use client';

import SecureRoute from '@/components/auth/SecureRoute';

interface SecureRouteWrapperProps {
  children: React.ReactNode;
}

export default function SecureRouteWrapper({ children }: SecureRouteWrapperProps) {
  return <SecureRoute>{children}</SecureRoute>;
}
