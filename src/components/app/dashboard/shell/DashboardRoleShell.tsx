"use client";

import { useSession } from "next-auth/react";
import { buildAdminNavTabs } from "@/components/app/dashboard/config/adminNav";
import { buildClientNavTabs } from "@/components/app/dashboard/config/clientNav";
import { buildTripperNavTabs } from "@/components/app/dashboard/config/tripperNav";
import { DashboardNavTabs } from "@/components/app/dashboard/shell/DashboardNavTabs";
import { DashboardPageHeading } from "@/components/app/dashboard/shell/DashboardPageHeading";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useStore } from "@/store/store";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import type { User } from "@/types/core";
import type { Locale } from "@/lib/i18n/config";

interface DashboardRoleShellProps {
  role: "admin" | "client" | "tripper";
}

export function DashboardRoleShell({ role }: DashboardRoleShellProps) {
  const locale = useLocale() as Locale;
  const adminNav = useDictionary((d) => d.adminDashboard.nav);
  const clientNav = useDictionary((d) => d.clientDashboard.nav);
  const tripperNav = useDictionary((d) => d.tripperDashboard.quickActions);
  const storeUser = useStore((s) => s.user);
  const { data: session } = useSession();
  const sessionUser = session?.user as
    | { role?: string; roles?: User["roles"] }
    | undefined;
  const adminSubject =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : storeUser?.roles && storeUser.roles.length > 0
        ? { role: storeUser.role, roles: storeUser.roles }
        : { role: sessionUser?.role ?? storeUser?.role };
  const isAdmin = hasRoleAccess(adminSubject, "admin");

  const tabs =
    role === "client"
      ? buildClientNavTabs(clientNav, locale)
      : role === "tripper"
        ? buildTripperNavTabs(tripperNav, isAdmin, locale)
        : buildAdminNavTabs(adminNav, locale);

  return (
    <div className="bg-neutral-50 pb-6 pt-8 sm:pb-10 sm:pt-16">
      <div className="rt-container">
        <DashboardPageHeading role={role} />
      </div>
      <div className="rt-container">
        <DashboardNavTabs tabs={tabs} />
      </div>
    </div>
  );
}
