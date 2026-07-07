import type { TripperDashboardDict } from "@/lib/types/dictionary";
import type { PageHeadingCopy } from "@/components/app/dashboard/config/dashboardNavTypes";

export function resolveTripperPageHeading(
  pathname: string,
  headings: TripperDashboardDict["pageHeadings"],
): PageHeadingCopy {
  function base(path: string) {
    return `/dashboard/tripper${path}`;
  }

  if (pathname === base("/experiences/new")) return headings.experiencesNew;
  if (pathname.match(new RegExp(`^${base("/experiences/")}.+`))) {
    return headings.experiencesEdit;
  }
  if (
    pathname === base("/experiences") ||
    pathname.startsWith(base("/experiences/"))
  ) {
    return headings.experiences;
  }
  if (pathname.startsWith(base("/earnings"))) return headings.earnings;
  if (pathname.startsWith(base("/reviews"))) return headings.reviews;
  if (pathname.startsWith(base("/blog"))) return headings.blogs;
  if (pathname.startsWith(base("/notifications"))) return headings.notifications;
  if (pathname.startsWith(base("/settings"))) {
    return headings.dashboard;
  }
  return headings.dashboard;
}
