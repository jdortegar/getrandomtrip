// Route segment config to prevent static generation
// This ensures the tripper page is always rendered dynamically
export const dynamic = 'force-dynamic';

export default function TripperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
