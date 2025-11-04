// Route segment config to prevent static generation
// All tripper dashboard pages use client-side hooks and must be dynamic
export const dynamic = 'force-dynamic';

import TripperLayoutClient from './layout-client';

export default function TripperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TripperLayoutClient>{children}</TripperLayoutClient>;
}

