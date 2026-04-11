import Link from "next/link";
import { Plus, BarChart3, Star, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TripperDashboardDict } from "@/lib/types/dictionary";

interface TripperQuickActionsProps {
  copy: TripperDashboardDict["quickActions"];
}

export function TripperQuickActions({ copy }: TripperQuickActionsProps) {
  const actions = [
    {
      href: "/dashboard/tripper/packages",
      icon: Plus,
      key: "packages",
      label: copy.createPackage,
      sub: copy.createPackageSub,
    },
    {
      href: "/dashboard/tripper/earnings",
      icon: BarChart3,
      key: "earnings",
      label: copy.earnings,
      sub: copy.earningsSub,
    },
    {
      href: "/dashboard/tripper/reviews",
      icon: Star,
      key: "reviews",
      label: copy.reviews,
      sub: copy.reviewsSub,
    },
    {
      href: "/dashboard/tripper/blogs",
      icon: BookOpen,
      key: "blogs",
      label: copy.blogs,
      sub: copy.blogsSub,
    },
    {
      href: "/trippers/profile",
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
