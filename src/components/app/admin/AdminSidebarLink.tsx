import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarLinkProps {
  badge?: number;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
}

export function AdminSidebarLink({
  badge,
  href,
  icon: Icon,
  isActive,
  label,
}: AdminSidebarLinkProps) {
  return (
    <Link
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
        isActive
          ? 'bg-gray-100 font-bold text-gray-900'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
      )}
      href={href}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-gray-900 px-1.5 py-px text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
