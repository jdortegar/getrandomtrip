export const dynamic = "force-dynamic";

import { StrictDashboardLayout } from "@/components/app/dashboard/shell/StrictDashboardLayout";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <StrictDashboardLayout locale={locale} requiredRole="client" shellRole="client">
      {children}
    </StrictDashboardLayout>
  );
}
