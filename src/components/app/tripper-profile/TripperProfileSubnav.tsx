"use client";

import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

export const TRIPPER_PROFILE_ANCHORS = {
  about: "mirada",
  atlas: "recorrido",
  journeys: "como-viajar",
  stories: "historias",
} as const;

/** Display order of the anchor links, as in the prototype. */
const LINK_ORDER = ["journeys", "about", "atlas", "stories"] as const;

interface TripperProfileSubnavProps {
  copy: TripperPublicProfileDict["subnav"];
  firstName: string;
}

/** Sticky bar under the site navbar: "TRIPPER / Name", section anchors (a menu on mobile) and the travel CTA. */
export function TripperProfileSubnav({ copy, firstName }: TripperProfileSubnavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const links = LINK_ORDER.map((key) => [key, TRIPPER_PROFILE_ANCHORS[key]] as const);
  const linkClass = cn(
    "text-sm text-primary transition-colors",
    "hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  );

  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-ground/95 backdrop-blur" data-component="TripperProfileSubnav">
      <div className="rt-container flex h-16 items-center justify-between gap-4">
        <p className="shrink-0 font-barlow-condensed text-2xl font-bold text-ink">
          <span className="uppercase">{copy.label}</span> / {firstName}
        </p>
        <nav aria-label={copy.navLabel} className="hidden min-w-0 md:block">
          <ul className="flex gap-7">
            {links.map(([key, anchor]) => (
              <li key={key}>
                <a className={cn(linkClass, "flex min-h-11 items-center")} href={`#${anchor}`}>
                  {copy.links[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonV2 asChild className="hidden md:inline-flex" size="sm">
          <a href={`#${TRIPPER_PROFILE_ANCHORS.journeys}`}>
            {interpolateTemplate(copy.cta, { name: firstName })}
            <ArrowUpRight aria-hidden />
          </a>
        </ButtonV2>
        <ButtonV2
          aria-controls="tripper-profile-menu"
          aria-expanded={isOpen}
          className="md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          size="sm"
          variant="outline"
        >
          {isOpen ? copy.closeMenu : copy.menu}
          {isOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </ButtonV2>
      </div>
      {isOpen ? (
        <nav aria-label={copy.navLabel} className="border-t border-gray-200 md:hidden" id="tripper-profile-menu">
          <ul className="rt-container flex flex-col py-2">
            {links.map(([key, anchor]) => (
              <li key={key}>
                <a className={cn(linkClass, "flex min-h-11 items-center")} href={`#${anchor}`} onClick={() => setIsOpen(false)}>
                  {copy.links[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
