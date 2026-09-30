"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/Button";
import { BadgeExamples } from "@/components/app/design-system/BadgeExamples";
import { ButtonExamples } from "@/components/app/design-system/ButtonExamples";
import { ControlExamples } from "@/components/app/design-system/ControlExamples";
import { FoundationExamples } from "@/components/app/design-system/FoundationExamples";
import { GalleryHero } from "@/components/app/design-system/GalleryHero";
import { GallerySection } from "@/components/app/design-system/GallerySection";
import { LayoutExamples } from "@/components/app/design-system/LayoutExamples";
import { TableExamples } from "@/components/app/design-system/TableExamples";
import { useNavbarChrome } from "@/context/NavbarChromeContext";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";
import styles from "@/components/app/design-system/DesignSystemGallery.module.css";

interface DesignSystemGalleryProps {
  copy: DesignSystemDict;
}
const sections = [
  "foundations",
  "buttons",
  "controls",
  "badges",
  "layout",
  "tables",
] as const;

export function DesignSystemGallery({ copy }: DesignSystemGalleryProps) {
  const [active, setActive] = useState<string>(sections[0]);
  const nav = useRef<HTMLDivElement>(null);
  const { setNavbarBackgroundPrimary } = useNavbarChrome();
  const lenis = useLenis();

  useEffect(() => {
    setNavbarBackgroundPrimary(true);
    return () => setNavbarBackgroundPrimary(false);
  }, [setNavbarBackgroundPrimary]);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      let current: string = sections[0];
      for (const id of sections) {
        const section = document.getElementById(id);
        if (
          section &&
          section.getBoundingClientRect().top <=
            (parseFloat(getComputedStyle(section).scrollMarginTop) || 144) + 1
        )
          current = id;
      }
      setActive(current);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const container = nav.current;
    const current =
      container?.querySelector<HTMLAnchorElement>("[aria-current]");
    if (!container || !current) return;
    const linkBox = current.getBoundingClientRect();
    const navBox = container.getBoundingClientRect();
    // Reveal the active section horizontally without stealing focus or scrolling the page.
    if (linkBox.left < navBox.left)
      container.scrollLeft += Math.floor(linkBox.left - navBox.left);
    else if (linkBox.right > navBox.right)
      container.scrollLeft += Math.ceil(linkBox.right - navBox.right);
  }, [active]);

  function handleAnchor(event: MouseEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!link || !event.currentTarget.contains(link)) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    // Keep the global Lenis anchor listener from animating this reduced-motion jump.
    event.preventDefault();
    event.stopPropagation();
    window.history.pushState(window.history.state, "", link.hash);
    if (lenis) lenis.scrollTo(target, { immediate: true });
    else target.scrollIntoView({ behavior: "instant", block: "start" });
    target.focus({ preventScroll: true });
  }

  return (
    <div
      className={cn(styles.gallery, "bg-ground min-w-0 text-ink")}
      onClickCapture={handleAnchor}
    >
      <Button
        asChild
        className={cn(
          "sr-only z-[60]",
          "focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
        )}
      >
        <a href="#gallery-content">{copy.skip}</a>
      </Button>
      <nav
        aria-label={copy.navigation}
        className="bg-ground border-b border-gray-200 sticky top-16 z-40"
      >
        <div className="rt-container">
          <div className="flex min-w-0 overflow-x-auto" ref={nav}>
            {sections.map((id, index) => (
              <Button
                asChild
                className={cn(
                  "border-0 border-b-2 border-transparent gap-2 h-16 px-4 rounded-none shrink-0 text-neutral-600 text-xs",
                  "hover:bg-accent",
                  "aria-[current=location]:border-primary aria-[current=location]:text-primary",
                )}
                key={id}
                variant="ghost"
              >
                <a
                  aria-current={active === id ? "location" : undefined}
                  href={`#${id}`}
                >
                  <span className="font-mono text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {copy.sections[id].nav}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </nav>
      <div
        className="rt-container min-w-0 scroll-mt-36"
        id="gallery-content"
        tabIndex={-1}
      >
        <GalleryHero copy={copy.hero} />
        <GallerySection
          copy={copy.sections.foundations}
          id="foundations"
          number="01"
        >
          <FoundationExamples copy={copy} />
        </GallerySection>
        <GallerySection copy={copy.sections.buttons} id="buttons" number="02">
          <ButtonExamples copy={copy} />
        </GallerySection>
        <GallerySection copy={copy.sections.controls} id="controls" number="03">
          <ControlExamples copy={copy} />
        </GallerySection>
        <GallerySection copy={copy.sections.badges} id="badges" number="04">
          <BadgeExamples copy={copy} />
        </GallerySection>
        <GallerySection copy={copy.sections.layout} id="layout" number="05">
          <LayoutExamples copy={copy} />
        </GallerySection>
        <GallerySection copy={copy.sections.tables} id="tables" number="06">
          <TableExamples copy={copy} />
        </GallerySection>
        <div className="border-gray-200 border-t flex flex-wrap gap-4 items-center justify-between py-8">
          <p className="text-neutral-600 text-sm">{copy.footer}</p>
          <Button asChild variant="link">
            <a href="#gallery-content">{copy.backToTop}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
