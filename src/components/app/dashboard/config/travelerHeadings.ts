import type { TravelerDashboardDict } from "@/lib/types/dictionary";
import type { PageHeadingCopy } from "@/components/app/dashboard/config/dashboardNavTypes";

export function resolveTravelerPageHeading(
  pathname: string,
  headings: TravelerDashboardDict["pageHeadings"],
): PageHeadingCopy {
  function base(path: string) {
    return `/dashboard/traveler${path}`;
  }

  if (pathname.startsWith(base("/trips"))) return headings.trips;
  if (pathname.startsWith(base("/reviews"))) return headings.reviews;
  if (pathname.startsWith(base("/notifications"))) return headings.notifications;
  if (pathname.startsWith(base("/settings"))) return headings.settings;
  return headings.dashboard;
}
