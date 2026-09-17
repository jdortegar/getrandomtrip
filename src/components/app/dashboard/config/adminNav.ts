import {
  Bell,
  Briefcase,
  CreditCard,
  FilePlus2,
  LayoutDashboard,
  Newspaper,
  Package,
  PackagePlus,
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
      exact: true,
      href: base("/experiences"),
      icon: Package,
      label: copy.experiences,
    },
    {
      href: base("/experiences/new"),
      icon: PackagePlus,
      label: copy.newExperience,
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
      // Non-exact so /blog/[id] review pages keep this tab active.
      href: base("/blog"),
      icon: Newspaper,
      label: copy.blog,
    },
    {
      href: base("/blog/new"),
      icon: FilePlus2,
      label: copy.newPost,
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
