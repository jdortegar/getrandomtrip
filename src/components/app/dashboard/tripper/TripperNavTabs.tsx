'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LayoutList,
  Plus,
  Settings,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary, useLocale } from '@/hooks/useDictionary';

export function TripperNavTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const copy = useDictionary((d) => d.tripperDashboard.quickActions);

  function base(path: string) {
    return `/${locale}/dashboard/tripper${path}`;
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const tabs = [
    { href: base(''),                       icon: LayoutDashboard, label: copy.dashboard,        exact: true  },
    { href: base('/experiences/new'),        icon: Plus,            label: copy.createExperience, exact: false },
    { href: base('/experiences'),            icon: LayoutList,      label: copy.experiences,      exact: true  },
    { href: base('/earnings'),               icon: BarChart3,       label: copy.earnings,         exact: false },
    { href: base('/reviews'),                icon: Star,            label: copy.reviews,          exact: false },
    { href: base('/blogs'),                  icon: BookOpen,        label: copy.blogs,            exact: false },
    { href: `/${locale}/trippers/profile`,   icon: Settings,        label: copy.settings,         exact: false },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-center gap-3 pb-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              className={cn(
                'flex flex-col items-center gap-2.5 rounded-2xl px-5 pt-4 pb-8 text-center transition-all',
                active
                  ? 'bg-light-blue text-white shadow-md'
                  : 'bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:text-gray-700',
              )}
              href={tab.href}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  active ? 'bg-white' : 'ring-1 ring-gray-200',
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-light-blue' : 'text-gray-600')} />
              </span>
              <span className="text-xs font-medium leading-tight max-w-16">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
