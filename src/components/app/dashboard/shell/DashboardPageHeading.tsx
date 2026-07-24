"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { PageHeading } from "@/components/layout/PageHeading";
import { resolveAdminPageHeading } from "@/components/app/dashboard/config/adminHeadings";
import { resolveTravelerPageHeading } from "@/components/app/dashboard/config/travelerHeadings";
import { resolveTripperPageHeading } from "@/components/app/dashboard/config/tripperHeadings";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface DashboardPageHeadingProps {
  role: "admin" | "traveler" | "tripper";
}

export function DashboardPageHeading({ role }: DashboardPageHeadingProps) {
  const rawPathname = usePathname();
  const locale = useLocale();
  const adminHeadings = useDictionary((d) => d.adminDashboard.pageHeadings);
  const travelerHeadings = useDictionary((d) => d.travelerDashboard.pageHeadings);
  const tripperHeadings = useDictionary(
    (d) => d.tripperDashboard.pageHeadings,
  );

  const pathname = rawPathname.startsWith(`/${locale}/`)
    ? rawPathname.slice(locale.length + 1)
    : rawPathname === `/${locale}`
      ? "/"
      : rawPathname;

  const { description, title } = useMemo(() => {
    if (role === "traveler") {
      return resolveTravelerPageHeading(pathname, travelerHeadings);
    }
    if (role === "tripper") {
      return resolveTripperPageHeading(pathname, tripperHeadings);
    }
    return resolveAdminPageHeading(pathname, adminHeadings);
  }, [adminHeadings, travelerHeadings, pathname, role, tripperHeadings]);

  return (
    <PageHeading
      className="text-center"
      description={description}
      title={title}
    />
  );
}
