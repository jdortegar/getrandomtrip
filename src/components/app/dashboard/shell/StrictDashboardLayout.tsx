import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDefaultDashboardPath,
  hasStrictRole,
  type DashboardRole,
} from "@/lib/auth/dashboardPaths";
import { getAppRoles } from "@/lib/auth/roleAccess";
import { DashboardRoleShell } from "@/components/app/dashboard/shell/DashboardRoleShell";

interface StrictDashboardLayoutProps {
  children: React.ReactNode;
  locale: string;
  requiredRole: DashboardRole;
  shellRole?: "admin" | "client" | "tripper";
}

export async function StrictDashboardLayout({
  children,
  locale,
  requiredRole,
  shellRole,
}: StrictDashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const roles = getAppRoles(user);

  if (!hasStrictRole(roles, requiredRole)) {
    redirect(getDefaultDashboardPath(roles, locale));
  }

  // `requiredRole` and `shellRole` share the exact same type (DashboardRole),
  // so defaulting to `requiredRole` is always correct — no per-role
  // special-casing needed, and it stays correct if a 4th role is ever added.
  const resolvedShellRole = shellRole ?? requiredRole;

  return (
    <>
      <DashboardRoleShell role={resolvedShellRole} />
      {children}
    </>
  );
}
