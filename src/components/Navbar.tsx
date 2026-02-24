'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Phone, User, Search, Menu, Globe } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { NavbarProfile } from './NavbarProfile';
import { useMenuState } from '@/hooks/useMenuState';
import { NAVBAR_CONSTANTS } from '@/lib/data/constants/navbar';
import {
  COOKIE_LOCALE,
  LOCALE_LABELS,
  type Locale,
} from '@/lib/i18n/config';
import { pathForLocale, pathWithoutLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

// Types
export type NavbarVariant = 'overlay' | 'auto' | 'solid';

const PRIMARY_LINK_KEYS = [
  { href: '/trippers', labelKey: 'labelTrippers', ariaKey: 'ariaLabelTrippers' },
  { href: '/blog', labelKey: 'labelInspiration', ariaKey: 'ariaLabelInspiration' },
  { href: '/nosotros', labelKey: 'labelNosotros', ariaKey: 'ariaLabelNosotros' },
] as const;
const EXTRA_LINK_KEYS = [
  { href: '/tripbuddy', labelKey: 'labelTripbuddy', ariaKey: 'ariaLabelTripbuddy' },
  { href: '/bitacoras', labelKey: 'labelBitacoras', ariaKey: 'ariaLabelBitacoras' },
] as const;

export interface NavbarProps {
  dict?: Dictionary;
  locale?: Locale;
  variant?: NavbarVariant;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Main Navbar Component
export default function Navbar({
  dict,
  locale: localeProp,
  variant = 'auto',
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  useScrollDetection({ variant });
  const { isAuthed, user, signOut, session } = useUserStore();
  const { isOpen, mode, close, openLogin } = useAuthModal();
  const linksMenu = useMenuState();
  const languageMenu = useMenuState();
  const currentLocale: Locale = localeProp ?? 'es';
  const nav = dict?.nav;

  const headerClass =
    'absolute top-0 inset-x-0 z-50 bg-white/0 text-white backdrop-blur-md transition-all duration-500 ease-in-out';
  const logoSrc = '/assets/logos/logo_getrandomtrip_1.png';

  return (
    <>
      <header
        data-site-header
        className={`${headerClass} ${NAVBAR_CONSTANTS.HEIGHT}`}
      >
        <nav
          className={`mx-auto ${NAVBAR_CONSTANTS.HEIGHT}  ${NAVBAR_CONSTANTS.PADDING} flex items-center justify-between container`}
        >
          <Link
            aria-label={nav?.ariaLabelLogo ?? 'Randomtrip'}
            className="flex items-center gap-2 shrink-0 py-2"
            href={pathForLocale(currentLocale, '/')}
          >
            <Image
              alt={nav?.ariaLabelLogo ?? 'Randomtrip'}
              height={50}
              src={logoSrc}
              width={180}
            />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              aria-label={nav?.search ?? 'Search'}
              className="p-2 rounded-lg hover:bg-white/10"
              onClick={() => {}}
              type="button"
            >
              <Search className="h-5 w-5" />
            </button>
            {PRIMARY_LINK_KEYS.map((link) => (
              <Link
                key={link.href}
                aria-label={nav?.[link.ariaKey] ?? link.href}
                className="hover:underline underline-offset-4 uppercase text-base font-barlow "
                href={pathForLocale(currentLocale, link.href)}
              >
                {nav?.[link.labelKey] ?? link.href}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {EXTRA_LINK_KEYS.length > 0 && (
              <div className="relative" ref={linksMenu.menuRef}>
                <button
                  aria-expanded={linksMenu.isOpen}
                  aria-haspopup="menu"
                  aria-label={nav?.openMenu ?? 'Open menu'}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10"
                  onClick={linksMenu.toggle}
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {linksMenu.isOpen && (
                  <div
                    className="absolute right-0 mt-3 w-60 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                    role="menu"
                  >
                    {EXTRA_LINK_KEYS.map((link) => (
                      <Link
                        key={link.href}
                        aria-label={nav?.[link.ariaKey] ?? link.href}
                        className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                        href={pathForLocale(currentLocale, link.href)}
                        role="menuitem"
                        onClick={() => linksMenu.close()}
                      >
                        {nav?.[link.labelKey] ?? link.href}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a
              aria-label={nav?.whatsApp ?? 'WhatsApp'}
              className="p-2 rounded-lg hover:bg-white/10"
              href="https://wa.me/526241928208"
              rel="noopener"
              target="_blank"
            >
              <Phone className="h-5 w-5" />
            </a>

            {!isAuthed && (
              <button
                aria-label={nav?.signIn ?? 'Sign in'}
                className="p-2 rounded-lg hover:bg-white/10"
                onClick={() => openLogin()}
              >
                <User className="h-5 w-5" />
              </button>
            )}

            {isAuthed && user && (
              <NavbarProfile
                user={user}
                session={session}
                onSignOut={signOut}
              />
            )}
            <div className="relative" ref={languageMenu.menuRef}>
              <button
                aria-expanded={languageMenu.isOpen}
                aria-haspopup="menu"
                aria-label={nav?.selectLanguage ?? 'Select language'}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10"
                onClick={languageMenu.toggle}
                type="button"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden lg:inline text-sm font-medium">
                  {currentLocale === 'es' ? 'ES' : 'EN'}
                </span>
              </button>

              {languageMenu.isOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-40 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                >
                  {(['es', 'en'] as const).map((loc) => (
                    <button
                      key={loc}
                      role="menuitemradio"
                      aria-checked={currentLocale === loc}
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50 ${currentLocale === loc ? 'bg-neutral-100 font-semibold' : ''}`}
                      onClick={() => {
                        languageMenu.close();
                        document.cookie = `${COOKIE_LOCALE}=${loc}; path=/; max-age=${COOKIE_MAX_AGE}; sameSite=lax`;
                        const pathWithout = pathWithoutLocale(pathname);
                        router.push(pathForLocale(loc, pathWithout || '/'));
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
