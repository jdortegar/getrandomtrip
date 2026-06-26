"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Phone, User, Search, Menu, Globe } from "lucide-react";
import { useUserStore } from "@/store/slices/userStore";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import AuthModal from "@/components/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";
import { NavbarProfile, type NavbarProfileLabels } from "./NavbarProfile";
import { useMenuState } from "@/hooks/useMenuState";
import { COOKIE_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale, pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";

export type NavbarVariant = "overlay" | "auto" | "solid";

type NavKeys = keyof NonNullable<Dictionary["nav"]>;

type NavLink = {
  href: string;
  labelKey: NavKeys;
  ariaKey: NavKeys;
  displayPosition: "navbar" | "button";
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/trippers",
    labelKey: "labelTrippers",
    ariaKey: "ariaLabelTrippers",
    displayPosition: "navbar",
  },
  {
    href: "/experiences",
    labelKey: "labelExperiences",
    ariaKey: "ariaLabelExperiences",
    displayPosition: "navbar",
  },
  {
    href: "/xsed",
    labelKey: "labelXsed",
    ariaKey: "ariaLabelXsed",
    displayPosition: "navbar",
  },
  {
    href: "/blog",
    labelKey: "labelInspiration",
    ariaKey: "ariaLabelInspiration",
    displayPosition: "button",
  },
  {
    href: "/about-us",
    labelKey: "labelNosotros",
    ariaKey: "ariaLabelNosotros",
    displayPosition: "button",
  },
  {
    href: "/contact",
    labelKey: "labelContact",
    ariaKey: "ariaLabelContact",
    displayPosition: "button",
  },
];

export interface NavbarProps {
  backgroundPrimary?: boolean;
  dict?: Dictionary;
  locale?: Locale;
  variant?: NavbarVariant;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function Navbar({
  backgroundPrimary = false,
  dict,
  locale: localeProp,
  variant = "auto",
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  useScrollDetection({ variant: backgroundPrimary ? "solid" : variant });
  const { isAuthed, user, signOut, session } = useUserStore();
  const { isOpen, mode, close, openLogin } = useAuthModal();
  const languageMenu = useMenuState();
  const mobileMenu = useMenuState();
  const currentLocale: Locale = localeProp ?? "es";
  const nav = dict?.nav;
  const profileLabels = dict?.navbarProfile as NavbarProfileLabels;

  const headerClass = cn(
    "duration-500 ease-in-out h-16 top-0 transition-all z-50",
    backgroundPrimary
      ? "bg-primary ring-1 ring-black/10 shadow-sm sticky text-primary-foreground w-full"
      : "absolute backdrop-blur-md bg-white/0 inset-x-0 text-white",
  );

  const desktopLinks = NAV_LINKS.filter(
    (link) => link.displayPosition === "navbar",
  );

  return (
    <>
      <header className={headerClass} data-site-header>
        <nav className="rt-container h-16 flex items-center justify-between gap-1">
          <Link
            aria-label={nav?.ariaLabelLogo ?? "Randomtrip"}
            className="flex items-center gap-2 shrink-0 py-2"
            href={pathForLocale(currentLocale, "/")}
          >
            <Image
              alt="Randomtrip"
              width={45}
              height={45}
              src="/assets/logos/iso-randomtrip.svg"
              className="sm:hidden"
            />
            <Image
              alt="Randomtrip"
              height={50}
              priority
              src="/assets/logos/logo_getrandomtrip_1.png"
              style={{ height: "auto" }}
              width={180}
              className="hidden sm:block"
            />
          </Link>

          {/* Desktop nav — navbar links only */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button
              aria-label={nav?.search ?? "Search"}
              className="p-2 rounded-lg hover:bg-white/10"
              onClick={() => {}}
              type="button"
            >
              <Search className="h-5 w-5" />
            </button>
            {desktopLinks.map((link) => (
              <Link
                key={link.href}
                aria-label={nav?.[link.ariaKey]}
                className="hover:underline underline-offset-4 uppercase text-base font-barlow"
                href={pathForLocale(currentLocale, link.href)}
              >
                {nav?.[link.labelKey]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              aria-label={nav?.whatsApp ?? "WhatsApp"}
              className="p-2 rounded-lg hover:bg-white/10"
              href="https://wa.me/526241928208"
              rel="noopener"
              target="_blank"
            >
              <Phone className="h-5 w-5" />
            </a>

            {/* Hamburger — always present; shows all links (navbar links included for mobile) */}
            <div className="relative" ref={mobileMenu.menuRef}>
              <button
                aria-expanded={mobileMenu.isOpen}
                aria-haspopup="menu"
                aria-label={nav?.openMenu ?? "Open menu"}
                className="p-2 rounded-lg hover:bg-white/10"
                onClick={mobileMenu.toggle}
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>

              {mobileMenu.isOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-48 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                >
                  {/* navbar links: hidden on desktop (already in the nav bar), visible on mobile */}
                  <div className="lg:hidden">
                    {NAV_LINKS.filter(
                      (l) => l.displayPosition === "navbar",
                    ).map((link) => (
                      <Link
                        key={link.href}
                        aria-label={nav?.[link.ariaKey]}
                        className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                        href={pathForLocale(currentLocale, link.href)}
                        role="menuitem"
                        onClick={mobileMenu.close}
                      >
                        {nav?.[link.labelKey]}
                      </Link>
                    ))}
                  </div>
                  {/* button links: always in the hamburger */}
                  {NAV_LINKS.filter((l) => l.displayPosition === "button").map(
                    (link) => (
                      <Link
                        key={link.href}
                        aria-label={nav?.[link.ariaKey]}
                        className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                        href={pathForLocale(currentLocale, link.href)}
                        role="menuitem"
                        onClick={mobileMenu.close}
                      >
                        {nav?.[link.labelKey]}
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>

            {!isAuthed && (
              <button
                aria-label={nav?.signIn ?? "Sign in"}
                className="p-2 rounded-lg hover:bg-white/10"
                onClick={() => openLogin()}
              >
                <User className="h-5 w-5" />
              </button>
            )}

            {isAuthed && user && profileLabels && (
              <NavbarProfile
                labels={profileLabels}
                onSignOut={signOut}
                session={session}
                user={user}
              />
            )}

            <div className="relative" ref={languageMenu.menuRef}>
              <button
                aria-expanded={languageMenu.isOpen}
                aria-haspopup="menu"
                aria-label={nav?.selectLanguage ?? "Select language"}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10"
                onClick={languageMenu.toggle}
                type="button"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden lg:inline text-sm font-medium">
                  {currentLocale === "es" ? "ES" : "EN"}
                </span>
              </button>

              {languageMenu.isOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-40 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                >
                  {(["es", "en"] as const).map((loc) => (
                    <button
                      key={loc}
                      role="menuitemradio"
                      aria-checked={currentLocale === loc}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50",
                        currentLocale === loc && "bg-neutral-100 font-semibold",
                      )}
                      onClick={() => {
                        languageMenu.close();
                        document.cookie = `${COOKIE_LOCALE}=${loc}; path=/; max-age=${COOKIE_MAX_AGE}; sameSite=lax`;
                        const pathWithout = pathWithoutLocale(pathname);
                        router.push(pathForLocale(loc, pathWithout || "/"));
                      }}
                    >
                      {LOCALE_LABELS[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        defaultMode={mode}
        dict={dict}
        isOpen={isOpen}
        onClose={close}
      />
    </>
  );
}
