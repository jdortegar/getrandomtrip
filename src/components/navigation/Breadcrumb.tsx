import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface BreadcrumbProps {
  className?: string;
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ className, items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('mb-8 flex items-center gap-2 text-sm text-neutral-600', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const segment = item.href ? (
          <Link
            className="inline-flex items-center gap-1 transition-colors hover:text-neutral-900"
            href={item.href}
          >
            {item.label}
          </Link>
        ) : (
          <span className="font-medium capitalize text-neutral-900">
            {item.label.toLowerCase()}
          </span>
        );
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
            {segment}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
