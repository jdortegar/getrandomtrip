import {
  Bell,
  Briefcase,
  Compass,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Star,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { AdminDashboardDict } from "@/lib/types/dictionary";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";

export function buildAdminNavTabs(
  copy: AdminDashboardDict["nav"],
  locale: Locale,
): DashboardNavTabItem[] {
  function base(path: string) {
    return pathForLocale(locale, `/dashboard/admin${path}`);
  }

  return [
    {
      exact: true,
      href: base(""),
      icon: LayoutDashboard,
      label: copy.dashboard,
    },
    {
      href: base("/trip-requests"),
      icon: Briefcase,
      label: copy.tripRequests,
    },
    {
      href: base("/experiences"),
      icon: Package,
      label: copy.experiences,
    },
    {
      href: base("/payments"),
      icon: CreditCard,
      label: copy.payments,
    },
    {
      href: base("/reviews"),
      icon: Star,
      label: copy.reviews,
    },
    {
      // Points at the /xsed index (which redirects to /xsed/new) rather than
      // /xsed/new directly, so the tab's active-match prefix ("/xsed/") also
      // covers /xsed/[id]/edit — matching the old sidebar's behavior.
      href: base("/xsed"),
      icon: Compass,
      label: copy.xsed,
    },
    {
      audience: "ADMIN",
      href: base("/notifications"),
      icon: Bell,
      label: copy.notifications,
      showUnreadDot: true,
    },
    {
      href: base("/settings"),
      icon: Settings,
      label: copy.settings,
    },
  ];
}
