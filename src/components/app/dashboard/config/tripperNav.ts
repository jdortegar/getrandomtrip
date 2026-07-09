import {
  BarChart3,
  Bell,
  BookOpen,
  LayoutDashboard,
  LayoutList,
  Plus,
  Settings,
  SquarePen,
  Star,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";

export function buildTripperNavTabs(
  copy: TripperDashboardDict["quickActions"],
  locale: Locale,
): DashboardNavTabItem[] {
  function base(path: string) {
    return pathForLocale(locale, `/dashboard/tripper${path}`);
  }

  return [
    {
      exact: true,
      href: base(""),
      icon: LayoutDashboard,
      label: copy.dashboard,
    },
    {
      exact: true,
      href: base("/experiences"),
      icon: LayoutList,
      label: copy.experiences,
    },
    {
      href: base("/experiences/new"),
      icon: Plus,
      label: copy.createExperience,
    },
    {
      exact: true,
      href: base("/blog"),
      icon: BookOpen,
      label: copy.blogs,
    },
    {
      href: base("/blog/new"),
      icon: SquarePen,
      label: copy.newPost,
    },
    {
      href: base("/earnings"),
      icon: BarChart3,
      label: copy.earnings,
    },
    {
      href: base("/reviews"),
      icon: Star,
      label: copy.reviews,
    },
    {
      audience: "TRIPPER",
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
