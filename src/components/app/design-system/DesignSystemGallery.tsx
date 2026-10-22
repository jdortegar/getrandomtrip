"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/Button";
import { BadgeExamples } from "@/components/app/design-system/BadgeExamples";
import { ButtonExamples } from "@/components/app/design-system/ButtonExamples";
import { ControlExamples } from "@/components/app/design-system/ControlExamples";
import { GalleryHero } from "@/components/app/design-system/GalleryHero";
import { GalleryNav } from "@/components/app/design-system/GalleryNav";
import { GallerySection } from "@/components/app/design-system/GallerySection";
import { LayoutExamples } from "@/components/app/design-system/LayoutExamples";
import { TableExamples } from "@/components/app/design-system/TableExamples";
import { BrandColor } from "@/components/app/design-system/brand/BrandColor";
import { BrandEssence } from "@/components/app/design-system/brand/BrandEssence";
import { BrandLogo } from "@/components/app/design-system/brand/BrandLogo";
import { BrandPhotography } from "@/components/app/design-system/brand/BrandPhotography";
import { BrandTypography } from "@/components/app/design-system/brand/BrandTypography";
import { BrandVoice } from "@/components/app/design-system/brand/BrandVoice";
import { VoiceStoriesCard } from "@/components/app/design-system/brand/VoiceStoriesCard";
import { useNavbarChrome } from "@/context/NavbarChromeContext";
import {
  DESIGN_SYSTEM_SECTIONS,
  type DesignSystemGalleryView,
} from "@/lib/constants/DESIGN_SYSTEM_GALLERY";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";
import styles from "@/components/app/design-system/DesignSystemGallery.module.css";

interface DesignSystemGalleryProps {
  agentDocsHref: string;
  brandHref: string;
  componentsHref: string;
  copy: DesignSystemDict;
  view: DesignSystemGalleryView;
}

export function DesignSystemGallery({
  agentDocsHref,
  brandHref,
  componentsHref,
  copy,
  view,
}: DesignSystemGalleryProps) {
  const sections = DESIGN_SYSTEM_SECTIONS[view];
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
  }, [sections]);

  useEffect(() => {
    const container = nav.current;
    const current =
      container?.querySelector<HTMLAnchorElement>("[aria-current=location]");
    if (!container || !current) return;
    const linkBox = current.getBoundingClientRect();
    const navBox = container.getBoundingClientRect();
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
    event.preventDefault();
    event.stopPropagation();
    window.history.pushState(window.history.state, "", link.hash);
    if (lenis) lenis.scrollTo(target, { immediate: true });
    else target.scrollIntoView({ behavior: "instant", block: "start" });
    target.focus({ preventScroll: true });
  }

  const numberOf = (id: (typeof sections)[number]) =>
    String(sections.indexOf(id) + 1).padStart(2, "0");

  return (
    <div
      className={cn(styles.gallery, "bg-ground min-w-0 text-ink")}
      data-gallery-view={view}
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
      <GalleryNav
        active={active}
        brandHref={brandHref}
        componentsHref={componentsHref}
        copy={copy}
        navRef={nav}
        view={view}
      />
      <div
        className="rt-container min-w-0 scroll-mt-36"
        id="gallery-content"
        tabIndex={-1}
      >
        {view === "brand" ? (
          <>
            <GalleryHero
              agentDocsHref={agentDocsHref}
              agentDocsLabel={copy.agentDocs}
              copy={copy.hero}
            />
            <GallerySection
              copy={copy.sections.essence}
              id="essence"
              number={numberOf("essence")}
            >
              <BrandEssence copy={copy.essence} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.logo}
              id="logo"
              number={numberOf("logo")}
            >
              <BrandLogo copy={copy.logo} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.color}
              id="color"
              number={numberOf("color")}
            >
              <BrandColor copy={copy.color} usageLabel={copy.usage} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.typography}
              id="typography"
              number={numberOf("typography")}
            >
              <BrandTypography copy={copy.typography} />
            </GallerySection>
            <GallerySection
              aside={<VoiceStoriesCard copy={copy.voice.stories} />}
              copy={copy.sections.voice}
              id="voice"
              lead="start"
              number={numberOf("voice")}
              subtitle={copy.voice.intro.title}
            >
              <BrandVoice copy={copy.voice} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.photography}
              id="photography"
              number={numberOf("photography")}
            >
              <BrandPhotography copy={copy.photography} />
            </GallerySection>
          </>
        ) : (
          <>
            <GalleryHero
              agentDocsHref={agentDocsHref}
              agentDocsLabel={copy.agentDocs}
              copy={copy.componentsHero}
            />
            <GallerySection
              copy={copy.sections.buttons}
              id="buttons"
              number={numberOf("buttons")}
            >
              <ButtonExamples copy={copy} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.controls}
              id="controls"
              number={numberOf("controls")}
            >
              <ControlExamples copy={copy} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.badges}
              id="badges"
              number={numberOf("badges")}
            >
              <BadgeExamples copy={copy} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.layout}
              id="layout"
              number={numberOf("layout")}
            >
              <LayoutExamples copy={copy} />
            </GallerySection>
            <GallerySection
              copy={copy.sections.tables}
              id="tables"
              number={numberOf("tables")}
            >
              <TableExamples copy={copy} />
            </GallerySection>
          </>
        )}
        <div className="border-gray-200 border-t flex flex-wrap gap-4 items-center justify-between py-8">
          <div>
            <p className="text-neutral-600 text-sm">{copy.footer}</p>
            <p className="mt-1">
              <a
                className="font-mono text-neutral-500 text-xs underline"
                href={agentDocsHref}
              >
                {copy.agentDocs}
              </a>
            </p>
          </div>
          <Button asChild variant="link">
            <a href="#gallery-content">{copy.backToTop}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
