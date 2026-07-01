"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useDictionary";
import { DashboardUnreadDot } from "@/components/app/dashboard/shell/DashboardUnreadDot";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";

const TAB_WIDTH = "w-[5.75rem] sm:w-24";
const TAB_MIN_HEIGHT = "min-h-[7.5rem] sm:min-h-[8.75rem]";

interface DashboardNavTabsProps {
  tabs: DashboardNavTabItem[];
}

export function DashboardNavTabs({ tabs }: DashboardNavTabsProps) {
  const rawPathname = usePathname();
  const locale = useLocale();
  const pathname = rawPathname.startsWith(`/${locale}/`)
    ? rawPathname.slice(locale.length + 1)
    : rawPathname === `/${locale}`
      ? "/"
      : rawPathname;

  function isActive(href: string, exact = false) {
    const slug = href.startsWith(`/${locale}`)
      ? href.slice(locale.length + 1)
      : href;
    if (exact) return pathname === slug;
    return pathname === slug || pathname.startsWith(`${slug}/`);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-safe-center gap-2 pb-1 sm:gap-3">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              className={cn(
                "flex shrink-0 flex-col items-center justify-start gap-2 rounded-2xl px-3 pb-4 pt-3 text-center transition-all sm:gap-2.5 sm:pb-8 sm:pt-4",
                TAB_WIDTH,
                TAB_MIN_HEIGHT,
                active
                  ? "bg-light-blue text-white shadow-md"
                  : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-700 hover:shadow-md",
              )}
              href={tab.href}
            >
              <span className="relative shrink-0">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    active ? "bg-white" : "ring-1 ring-gray-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-light-blue" : "text-gray-600",
                    )}
                  />
                </span>
                {tab.showUnreadDot && tab.audience && (
                  <DashboardUnreadDot audience={tab.audience} />
                )}
              </span>
              <span className="w-full text-balance text-xs font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
