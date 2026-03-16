import type { Metadata } from 'next';
import SecureRouteWrapper from '@/components/auth/SecureRouteWrapper';

export const metadata: Metadata = {
  description: 'Tu panel personal de viajes',
  title: 'Dashboard - RandomTrip',
};

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SecureRouteWrapper>{children}</SecureRouteWrapper>;
}
