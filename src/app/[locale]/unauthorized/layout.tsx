import { DashboardNavbarPrimaryLayout } from '@/components/app/dashboard/DashboardNavbarPrimaryLayout';

/**
 * Match dashboard routes: primary (dark) navbar surface without `HeaderHero`.
 */
export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardNavbarPrimaryLayout>{children}</DashboardNavbarPrimaryLayout>;
}
