export const dynamic = "force-dynamic";

import { StrictDashboardLayout } from "@/components/app/dashboard/shell/StrictDashboardLayout";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <StrictDashboardLayout
      locale={locale}
      requiredRole="admin"
      shellRole="admin"
    >
      {children}
    </StrictDashboardLayout>
  );
}
