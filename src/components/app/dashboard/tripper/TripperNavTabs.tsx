"use client";

import { useSession } from "next-auth/react";
import { buildTripperNavTabs } from "@/components/app/dashboard/config/tripperNav";
import { DashboardNavTabs } from "@/components/app/dashboard/shell/DashboardNavTabs";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useStore } from "@/store/store";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import type { User } from "@/types/core";
import type { Locale } from "@/lib/i18n/config";

export function TripperNavTabs() {
  const locale = useLocale() as Locale;
  const copy = useDictionary((d) => d.tripperDashboard.quickActions);
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
  const tabs = buildTripperNavTabs(copy, isAdmin, locale);

  return <DashboardNavTabs tabs={tabs} />;
}
