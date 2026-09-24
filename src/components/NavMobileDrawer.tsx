"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Img from "@/components/common/Img";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";
import type { NavLink } from "./Navbar";

const DRAWER_ID = "nav-mobile-drawer";
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_ANIMATION_MS = 420;

interface NavMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  nav: Dictionary["nav"] | undefined;
  currentLocale: Locale;
  isActive: (href: string) => boolean;
  isAuthed: boolean;
  onSignIn: () => void;
  onLocaleChange: (locale: Locale) => void;
  whatsappHref: string;
}

export function NavMobileDrawer({
  isOpen,
  onClose,
  links,
  nav,
  currentLocale,
  isActive,
  isAuthed,
  onSignIn,
  onLocaleChange,
  whatsappHref,
}: NavMobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    const timeout = setTimeout(() => setShouldRender(false), EXIT_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    document.body.classList.add("overflow-hidden");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
      previouslyFocused.current?.focus();
    };
    // `onClose` is read through `onCloseRef` so a new function identity on
    // every parent render doesn't tear down/re-run this effect (which would
    // re-steal focus onto the close button on every unrelated re-render).

  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      id={DRAWER_ID}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={nav?.menuLabel}
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-ground xl:hidden",
        isOpen ? "animate-drawer-panel-in" : "animate-drawer-panel-out",
      )} data-component="NavMobileDrawer"
    >
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-secondary-200 bg-ground px-4">
        <Img
          alt="Randomtrip"
          height={40}
          src="/assets/logos/logo_randomtrip_no_tag.svg"
          width={144}
          style={{ height: "auto" }}
        />
        <button
          aria-label={nav?.closeMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-secondary-200"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {links.map((link, index) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              aria-current={active ? "page" : undefined}
              aria-label={nav?.[link.ariaKey]}
              className={cn(
                "flex min-h-[56px] items-center justify-between border-b border-secondary-200 px-4 py-[15px] font-barlow-condensed text-[30px] font-bold uppercase leading-none text-primary hover:text-feature animate-drawer-link",
                active && "text-feature",
              )}
              href={pathForLocale(currentLocale, link.href)}
              onClick={onClose}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {nav?.[link.labelKey]}
              <ArrowRight
                className={cn("h-4 w-4 shrink-0 text-secondary-300", active && "text-feature")}
              />
            </Link>
          );
        })}
      </div>

      <div
        className="shrink-0 bg-secondary-100 px-4 pt-5"
        style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}
      >
        {!isAuthed && (
          <Button
            className="w-full"
            onClick={() => {
              onClose();
              onSignIn();
            }}
            size="lg"
            variant="feature"
          >
            {nav?.signIn}
          </Button>
        )}

        <div className="mt-4 flex items-center justify-between">
          <a
            aria-label={nav?.whatsApp}
            className="flex h-11 items-center gap-2 rounded-lg px-2 text-primary"
            href={whatsappHref}
            rel="noopener"
            target="_blank"
          >
            <Phone className="h-6 w-6" />
          </a>

          <div className="flex h-[38px] min-w-[92px] rounded-full bg-secondary-200 p-1">
            {(["es", "en"] as const).map((loc) => (
              <button
                key={loc}
                aria-label={nav?.selectLanguage}
                aria-pressed={currentLocale === loc}
                className={cn(
                  "flex-1 rounded-full px-3 text-xs font-semibold uppercase",
                  currentLocale === loc ? "bg-white text-primary" : "text-primary/70",
                )}
                onClick={() => onLocaleChange(loc)}
                type="button"
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DRAWER_ID };
