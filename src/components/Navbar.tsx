"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Phone, User, Menu, Globe } from "lucide-react";
import { useUserStore } from "@/store/slices/userStore";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import AuthModal from "@/components/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";
import { NavbarProfile, type NavbarProfileLabels } from "./NavbarProfile";
import { NavMobileDrawer, DRAWER_ID } from "./NavMobileDrawer";
import { useMenuState } from "@/hooks/useMenuState";
import { COOKIE_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale, pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";

export type NavbarVariant = "overlay" | "auto" | "solid";

export type NavKeys = keyof NonNullable<Dictionary["nav"]>;

export type NavLink = {
  href: string;
  labelKey: NavKeys;
  ariaKey: NavKeys;
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/trippers",
    labelKey: "labelTrippers",
    ariaKey: "ariaLabelTrippers",
  },
  {
    href: "/experiences",
    labelKey: "labelExperiences",
    ariaKey: "ariaLabelExperiences",
  },
  {
    href: "/xsed",
    labelKey: "labelXsed",
    ariaKey: "ariaLabelXsed",
  },
  {
    href: "/blog",
    labelKey: "labelInspiration",
    ariaKey: "ariaLabelInspiration",
  },
  {
    href: "/about-us",
    labelKey: "labelNosotros",
    ariaKey: "ariaLabelNosotros",
  },
  {
    href: "/contact",
    labelKey: "labelContact",
    ariaKey: "ariaLabelContact",
  },
];

export interface NavbarProps {
  backgroundPrimary?: boolean;
  dict?: Dictionary;
  locale?: Locale;
  variant?: NavbarVariant;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const WHATSAPP_URL = "https://wa.me/526241928208";

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
  const currentPath = pathWithoutLocale(pathname);
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);

  const switchLocale = (loc: Locale) => {
    document.cookie = `${COOKIE_LOCALE}=${loc}; path=/; max-age=${COOKIE_MAX_AGE}; sameSite=lax`;
    const pathWithout = pathWithoutLocale(pathname);
    router.push(pathForLocale(loc, pathWithout || "/"));
  };

  const headerClass = cn(
    "duration-500 ease-in-out h-16 top-0 transition-all z-50",
    backgroundPrimary
      ? "bg-ground ring-1 ring-gray-200 shadow-sm sticky text-primary w-full"
      : "absolute backdrop-blur-md bg-white/0 inset-x-0 text-white",
  );
  // Solid state sits on the new Off-White ground — Deep Teal is reserved for
  // text/icons/focus states there, never as a big-area fill (brand book
  // "0-5% Ochre / 5-10% Deep Teal" ratio). The transparent hero-overlay
  // state keeps white-on-photo, so its hover wash and wordmark stay as-is.
  const iconHoverClass = backgroundPrimary ? "hover:bg-secondary/10" : "hover:bg-white/10";
  const wordmarkSrc = backgroundPrimary
    ? "/assets/logos/logo_randomtrip_no_tag.svg"
    : "/assets/logos/logo_white_no_tag_ochre_icon.svg";

  return (
    <>
      <header className={headerClass} data-site-header data-component="Navbar">
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
              src={wordmarkSrc}
              style={{ height: "auto" }}
              width={180}
              className="hidden sm:block"
            />
          </Link>

          {/* Desktop nav — visible from xl (1280px) up */}
          <div className="hidden xl:flex items-center gap-6 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={nav?.[link.ariaKey]}
                  className={cn(
                    "hover:underline underline-offset-4 uppercase text-base font-barlow",
                    active && "underline",
                  )}
                  href={pathForLocale(currentLocale, link.href)}
                >
                  {nav?.[link.labelKey]}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <a
              aria-label={nav?.whatsApp ?? "WhatsApp"}
              className={cn("p-2 rounded-lg", iconHoverClass)}
              href={WHATSAPP_URL}
              rel="noopener"
              target="_blank"
            >
              <Phone className="h-5 w-5" />
            </a>

            {/* Hamburger — visible below xl (1280px); desktop nav shows all links */}
            <button
              aria-controls={mobileMenu.isOpen ? DRAWER_ID : undefined}
              aria-expanded={mobileMenu.isOpen}
              aria-label={nav?.openMenu ?? "Open menu"}
              className={cn("p-2 rounded-lg xl:hidden", iconHoverClass)}
              onClick={mobileMenu.toggle}
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>

            {!isAuthed && (
              <button
                aria-label={nav?.signIn ?? "Sign in"}
                className={cn("hidden xl:block p-2 rounded-lg", iconHoverClass)}
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

            <div className="relative hidden xl:flex" ref={languageMenu.menuRef}>
              <button
                aria-expanded={languageMenu.isOpen}
                aria-haspopup="menu"
                aria-label={nav?.selectLanguage ?? "Select language"}
                className={cn("flex items-center gap-2 p-2 rounded-lg", iconHoverClass)}
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
                  className="absolute right-0 mt-3 w-40 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-ink"
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
                        switchLocale(loc);
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

      <NavMobileDrawer
        currentLocale={currentLocale}
        isActive={isActive}
        isAuthed={isAuthed}
        isOpen={mobileMenu.isOpen}
        links={NAV_LINKS}
        nav={nav}
        onClose={mobileMenu.close}
        onLocaleChange={switchLocale}
        onSignIn={() => openLogin()}
        whatsappHref={WHATSAPP_URL}
      />

      <AuthModal
        defaultMode={mode}
        dict={dict}
        isOpen={isOpen}
        onClose={close}
      />
    </>
  );
}
