"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  LayoutDashboard,
  LayoutList,
  Plus,
  Settings,
  Star,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useStore } from "@/store/store";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { TripperUnreadDot } from "@/components/app/dashboard/tripper/TripperUnreadDot";
import type { User } from "@/types/core";

export function TripperNavTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const copy = useDictionary((d) => d.tripperDashboard.quickActions);
  const storeUser = useStore((s) => s.user);
  const { data: session } = useSession();
  const sessionUser = session?.user as
    | { role?: string; roles?: User["roles"] }
    | undefined;
  const adminSubject =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : storeUser?.roles && storeUser.roles.length > 0
        ? { role: storeUser.role, roles: storeUser.roles }
        : { role: sessionUser?.role ?? storeUser?.role };
  const isAdmin = hasRoleAccess(adminSubject, "admin");

  function base(path: string) {
    return `/${locale}/dashboard/tripper${path}`;
  }

  function isActive(href: string, exact = false) {
    const slug = href.startsWith(`/${locale}`) ? href.slice(locale.length + 1) : href;
    if (exact) return pathname === slug;
    return pathname === slug || pathname.startsWith(`${slug}/`);
  }

  const tabs = [
    {
      href: base(""),
      icon: LayoutDashboard,
      label: copy.dashboard,
      exact: true,
    },
    {
      href: base("/experiences"),
      icon: LayoutList,
      label: copy.experiences,
      exact: true,
    },
    {
      href: base("/experiences/new"),
      icon: Plus,
      label: copy.createExperience,
      exact: false,
    },
    {
      href: `/${locale}/dashboard/admin/xsed/new`,
      icon: Zap,
      label: copy.createDrop,
      exact: false,
      adminOnly: true,
    },
    { href: base("/blogs"), icon: BookOpen, label: copy.blogs, exact: false },
    {
      href: base("/earnings"),
      icon: BarChart3,
      label: copy.earnings,
      exact: false,
    },
    { href: base("/reviews"), icon: Star, label: copy.reviews, exact: false },
    {
      href: base("/notifications"),
      icon: Bell,
      label: copy.notifications,
      exact: false,
      showUnreadDot: true,
    },
    {
      href: `/${locale}/trippers/profile`,
      icon: Settings,
      label: copy.settings,
      exact: false,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-safe-center gap-2 sm:gap-3 pb-1">
        {tabs
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => {
            const active = isActive(tab.href, tab.exact);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                className={cn(
                  "flex flex-col items-center gap-2 sm:gap-2.5 rounded-2xl px-3 sm:px-5 pt-3 sm:pt-4 pb-4 sm:pb-8 text-center transition-all",
                  active
                    ? "bg-light-blue text-white shadow-md"
                    : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:text-gray-700",
                )}
                href={tab.href}
              >
                <span className="relative">
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
                  {tab.showUnreadDot && <TripperUnreadDot />}
                </span>
                <span className="text-xs font-medium leading-tight max-w-16">
                  {tab.label}
                </span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
