"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { PageHeading } from "@/components/layout/PageHeading";
import { resolveAdminPageHeading } from "@/components/app/dashboard/config/adminHeadings";
import { resolveClientPageHeading } from "@/components/app/dashboard/config/clientHeadings";
import { resolveTripperPageHeading } from "@/components/app/dashboard/config/tripperHeadings";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface DashboardPageHeadingProps {
  role: "admin" | "client" | "tripper";
}

export function DashboardPageHeading({ role }: DashboardPageHeadingProps) {
  const rawPathname = usePathname();
  const locale = useLocale();
  const adminHeadings = useDictionary((d) => d.adminDashboard.pageHeadings);
  const clientHeadings = useDictionary((d) => d.clientDashboard.pageHeadings);
  const tripperHeadings = useDictionary(
    (d) => d.tripperDashboard.pageHeadings,
  );

  const pathname = rawPathname.startsWith(`/${locale}/`)
    ? rawPathname.slice(locale.length + 1)
    : rawPathname === `/${locale}`
      ? "/"
      : rawPathname;

  const { description, title } = useMemo(() => {
    if (role === "client") {
      return resolveClientPageHeading(pathname, clientHeadings);
    }
    if (role === "tripper") {
      return resolveTripperPageHeading(pathname, tripperHeadings);
    }
    return resolveAdminPageHeading(pathname, adminHeadings);
  }, [adminHeadings, clientHeadings, pathname, role, tripperHeadings]);

  return (
    <PageHeading
      className="text-center"
      description={description}
      title={title}
    />
  );
}
