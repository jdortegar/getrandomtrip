import type { LucideIcon } from "lucide-react";

export type NotificationAudience = "TRAVELER" | "TRIPPER" | "ADMIN";

export interface DashboardNavTabItem {
  audience?: NotificationAudience;
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
  showUnreadDot?: boolean;
}

export interface PageHeadingCopy {
  description: string;
  title: string;
}
