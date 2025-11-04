// Route segment config to prevent static generation
// The blog page uses client-side hooks and must be dynamic
export const dynamic = 'force-dynamic';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

