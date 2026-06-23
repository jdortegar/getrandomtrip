import Link from "next/link";
import {
  Plus,
  LayoutList,
  BarChart3,
  Star,
  BookOpen,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

interface TripperQuickActionsProps {
  copy: TripperDashboardDict["quickActions"];
  locale?: string;
}

export function TripperQuickActions({ copy, locale = "es" }: TripperQuickActionsProps) {
  const actions = [
    {
      href: pathForLocale(locale as Locale, "/dashboard/tripper/experiences/new"),
      icon: Plus,
      key: "packages",
      label: copy.createExperience,
      sub: copy.createExperienceSub,
    },
    {
      href: pathForLocale(locale as Locale, "/dashboard/tripper/experiences"),
      icon: LayoutList,
      key: "experiences",
      label: copy.experiences,
      sub: copy.experiencesSub,
    },
    {
      href: pathForLocale(locale as Locale, "/dashboard/tripper/earnings"),
      icon: BarChart3,
      key: "earnings",
      label: copy.earnings,
      sub: copy.earningsSub,
    },
    {
      href: pathForLocale(locale as Locale, "/dashboard/tripper/reviews"),
      icon: Star,
      key: "reviews",
      label: copy.reviews,
      sub: copy.reviewsSub,
    },
    {
      href: pathForLocale(locale as Locale, "/dashboard/tripper/blogs"),
      icon: BookOpen,
      key: "blogs",
      label: copy.blogs,
      sub: copy.blogsSub,
    },
    {
      href: pathForLocale(locale as Locale, "/trippers/profile"),
      icon: Settings,
      key: "settings",
      label: copy.settings,
      sub: copy.settingsSub,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.title}
      </h3>
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              asChild
              className="w-full justify-start"
              key={action.key}
              variant={index === 0 ? "default" : "ghost"}
            >
              <Link href={action.href}>
                <Icon className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
