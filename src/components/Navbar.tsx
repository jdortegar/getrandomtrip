'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, User, Search, Menu, Globe } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { NavbarProfile } from './NavbarProfile';
import { useMenuState } from '@/hooks/useMenuState';
import {
  NAVBAR_CONSTANTS,
  NAVBAR_STYLES,
  NAVBAR_LINKS,
} from '@/lib/data/constants/navbar';

// Types
export type NavbarVariant = 'overlay' | 'auto' | 'solid';

export interface NavbarProps {
  variant?: NavbarVariant;
}

// Main Navbar Component
export default function Navbar({ variant = 'auto' }: NavbarProps) {
  const overlay = useScrollDetection({ variant });
  const { isAuthed, user, signOut, session } = useUserStore();
  const { isOpen, mode, close, openLogin } = useAuthModal();
  const linksMenu = useMenuState();
  const languageMenu = useMenuState();
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const headerClass = useMemo(() => {
    return overlay ? NAVBAR_STYLES.OVERLAY : NAVBAR_STYLES.SOLID;
  }, [overlay]);

  const logoSrc = useMemo(() => {
    return overlay
      ? '/assets/logos/logo_getrandomtrip_1.png'
      : '/assets/logos/logo_getrandomtrip.png';
  }, [overlay]);

  const primaryLinks = NAVBAR_LINKS.slice(0, 3);
  const extraLinks = NAVBAR_LINKS.slice(3);

  return (
    <>
      <header
        data-site-header
        className={`${headerClass} ${NAVBAR_CONSTANTS.HEIGHT}`}
      >
        <nav
          className={`mx-auto ${NAVBAR_CONSTANTS.HEIGHT} ${NAVBAR_CONSTANTS.MAX_WIDTH} ${NAVBAR_CONSTANTS.PADDING} flex items-center justify-between`}
        >
          <Link
            href="/"
            aria-label="Randomtrip"
            className="flex items-center gap-2 shrink-0 py-2"
          >
            <Image src={logoSrc} alt="Randomtrip" width={160} height={50} />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Buscar"
              onClick={() => {}}
            >
              <Search className="h-5 w-5" />
            </button>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className="hover:underline underline-offset-4 uppercase text-base font-barlow "
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {extraLinks.length > 0 && (
              <div className="relative" ref={linksMenu.menuRef}>
                <button
                  type="button"
                  onClick={linksMenu.toggle}
                  aria-label="Abrir menú de navegación"
                  aria-haspopup="menu"
                  aria-expanded={linksMenu.isOpen}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {linksMenu.isOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-60 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                  >
                    {extraLinks.map((link) => (
                      <Link
                        key={link.href}
                        role="menuitem"
                        href={link.href}
                        aria-label={link.ariaLabel}
                        className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                        onClick={() => linksMenu.close()}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a
              href="https://wa.me/526241928208"
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
            </a>

            {!isAuthed && (
              <button
                aria-label="Iniciar sesión"
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
                type="button"
                onClick={languageMenu.toggle}
                aria-label="Seleccionar idioma"
                aria-haspopup="menu"
                aria-expanded={languageMenu.isOpen}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden lg:inline text-sm font-medium">
                  {language === 'es' ? 'ES' : 'EN'}
                </span>
              </button>

              {languageMenu.isOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-40 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                >
                  <button
                    role="menuitemradio"
                    aria-checked={language === 'es'}
                    className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50 ${language === 'es' ? 'bg-neutral-100 font-semibold' : ''}`}
                    onClick={() => {
                      setLanguage('es');
                      languageMenu.close();
                    }}
                  >
                    Español
                  </button>
                  <button
                    role="menuitemradio"
                    aria-checked={language === 'en'}
                    className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50 ${language === 'en' ? 'bg-neutral-100 font-semibold' : ''}`}
                    onClick={() => {
                      setLanguage('en');
                      languageMenu.close();
                    }}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal isOpen={isOpen} onClose={close} defaultMode={mode} />
    </>
  );
}
