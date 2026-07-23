import type { AdminDashboardDict } from "@/lib/types/dictionary";
import type { PageHeadingCopy } from "@/components/app/dashboard/config/dashboardNavTypes";

export function resolveAdminPageHeading(
  pathname: string,
  headings: AdminDashboardDict["pageHeadings"],
): PageHeadingCopy {
  function base(path: string) {
    return `/dashboard/admin${path}`;
  }

  if (pathname.startsWith(base("/notifications"))) return headings.notifications;
  if (pathname.startsWith(base("/xsed"))) return headings.xsedNew;
  if (pathname.startsWith(base("/trip-requests"))) return headings.tripRequests;
  if (pathname.startsWith(base("/settings"))) return headings.settings;
  if (pathname.startsWith(base("/experiences/new"))) return headings.experiencesNew;
  if (pathname.match(new RegExp(`^${base("/experiences/")}.+`))) {
    return headings.experiencesDetail;
  }
  if (
    pathname === base("/experiences") ||
    pathname.startsWith(base("/experiences/"))
  ) {
    return headings.experiences;
  }
  if (pathname.match(new RegExp(`^${base("/blog/")}.+`))) {
    return headings.blogDetail;
  }
  if (pathname === base("/blog") || pathname.startsWith(base("/blog/"))) {
    return headings.blog;
  }
  if (pathname.startsWith(base("/payments"))) return headings.payments;
  if (pathname.startsWith(base("/reviews"))) return headings.reviews;
  return headings.home;
}
