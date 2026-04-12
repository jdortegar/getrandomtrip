// Route segment config to prevent static generation
// Tripper dashboard is dynamic (auth, role guard, mixed server/client pages)
export const dynamic = 'force-dynamic';

import TripperLayoutClient from './layout-client';

export default function TripperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TripperLayoutClient>{children}</TripperLayoutClient>;
}

