import {
  Bell,
  LayoutDashboard,
  LayoutList,
  Settings,
  Star,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { ClientDashboardDict } from "@/lib/types/dictionary";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";

export function buildClientNavTabs(
  copy: ClientDashboardDict["nav"],
  locale: Locale,
): DashboardNavTabItem[] {
  function base(path: string) {
    return pathForLocale(locale, `/dashboard/client${path}`);
  }

  return [
    {
      exact: true,
      href: base(""),
      icon: LayoutDashboard,
      label: copy.dashboard,
    },
    {
      href: base("/trips"),
      icon: LayoutList,
      label: copy.trips,
    },
    {
      href: base("/reviews"),
      icon: Star,
      label: copy.reviews,
    },
    {
      audience: "CLIENT",
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
