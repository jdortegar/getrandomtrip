import { DashboardNavbarPrimaryLayout } from '@/components/app/dashboard/DashboardNavbarPrimaryLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardNavbarPrimaryLayout>{children}</DashboardNavbarPrimaryLayout>;
}
