import type { Metadata } from "next";
import { resolveAdminPageHeading } from "@/components/app/dashboard/config/adminHeadings";
import { resolveTravelerPageHeading } from "@/components/app/dashboard/config/travelerHeadings";
import { resolveTripperPageHeading } from "@/components/app/dashboard/config/tripperHeadings";
import type { PageHeadingCopy } from "@/components/app/dashboard/config/dashboardNavTypes";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface DashboardMetadataProps {
  params: Promise<{ locale: string }>;
}

/**
 * Builds a `generateMetadata` for a dashboard page from the same localized
 * heading the page renders (DashboardPageHeading), so every dashboard route
 * gets a distinct browser-tab / history title. `route` is the locale-less
 * dashboard path, e.g. "/dashboard/tripper/blog".
 */
export function dashboardPageMetadata(route: string) {
  return async function generateMetadata(
    props: DashboardMetadataProps,
  ): Promise<Metadata & PageHeadingCopy> {
    const params = await props.params;
    const locale = hasLocale(params.locale) ? params.locale : "es";
    const dict = await getDictionary(locale);

    const heading = route.startsWith("/dashboard/admin")
      ? resolveAdminPageHeading(route, dict.adminDashboard.pageHeadings)
      : route.startsWith("/dashboard/tripper")
        ? resolveTripperPageHeading(route, dict.tripperDashboard.pageHeadings)
        : resolveTravelerPageHeading(route, dict.travelerDashboard.pageHeadings);

    return { title: heading.title, description: heading.description };
  };
}
