import type { RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  DESIGN_SYSTEM_SECTIONS,
  type DesignSystemGalleryView,
} from "@/lib/constants/DESIGN_SYSTEM_GALLERY";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface GalleryNavProps {
  active: string;
  brandHref: string;
  componentsHref: string;
  copy: DesignSystemDict;
  navRef: RefObject<HTMLDivElement | null>;
  view: DesignSystemGalleryView;
}

const linkClass = cn(
  "border-0 border-b-2 border-transparent gap-2 h-16 px-4 rounded-none shrink-0 text-neutral-600 text-xs",
  "hover:bg-accent",
  "aria-[current]:border-primary aria-[current]:text-primary",
);

export function GalleryNav({
  active,
  brandHref,
  componentsHref,
  copy,
  navRef,
  view,
}: GalleryNavProps) {
  const sections = DESIGN_SYSTEM_SECTIONS[view];
  const numberOf = (id: (typeof sections)[number]) =>
    String(sections.indexOf(id) + 1).padStart(2, "0");

  return (
    <nav
      aria-label={copy.navigation}
      className="bg-ground border-b border-gray-200 sticky top-16 z-40"
    >
      <div className="rt-container">
        <div className="flex min-w-0 overflow-x-auto" ref={navRef}>
          <div
            className="flex items-center shrink-0"
            role="group"
          >
            <Button asChild className={linkClass} variant="ghost">
              <Link
                aria-current={view === "brand" ? "page" : undefined}
                href={brandHref}
              >
                {copy.groups.brand}
              </Link>
            </Button>
            <Button asChild className={linkClass} variant="ghost">
              <Link
                aria-current={view === "components" ? "page" : undefined}
                href={componentsHref}
              >
                {copy.groups.components}
              </Link>
            </Button>
          </div>
          <div
            className="border-gray-300 border-l flex items-center ml-2 pl-2 shrink-0"
            role="group"
          >
            {sections.map((id) => (
              <Button
                asChild
                className={linkClass}
                key={id}
                variant="ghost"
              >
                <a
                  aria-current={active === id ? "location" : undefined}
                  href={`#${id}`}
                >
                  <span className="font-mono text-xs">{numberOf(id)}</span>
                  {copy.sections[id].nav}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
