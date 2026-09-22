import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className={cn(
        "mb-8 flex w-full items-center gap-2 text-sm text-neutral-600",
        className,
      )} data-component="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        // The last segment is the current page — often a long, unbounded
        // title (a post name) — so it's the one allowed to shrink and
        // truncate. Earlier segments are short, fixed nav labels that
        // should never wrap or lose space to it.
        const segment = item.href ? (
          <Link
            className={cn(
              "shrink-0 whitespace-nowrap transition-colors hover:text-ink",
              isLast && "min-w-0 flex-1 truncate",
            )}
            href={item.href}
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={cn(
              "shrink-0 whitespace-nowrap font-medium capitalize text-ink",
              isLast && "min-w-0 flex-1 truncate",
            )}
          >
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
