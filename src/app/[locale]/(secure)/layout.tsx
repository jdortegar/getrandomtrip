import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - RandomTrip',
  description: 'Tu panel personal de viajes',
};

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
