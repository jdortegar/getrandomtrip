'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, User, Search } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import EnhancedAuthModal from '@/components/auth/EnhancedAuthModal';
import { NavbarProfile } from './NavbarProfile';
import {
  NAVBAR_CONSTANTS,
  NAVBAR_STYLES,
  NAVBAR_LINKS,
} from '@/lib/data/constants/navbar';

// Types
export type NavbarVariant = 'auto' | 'solid';

export interface NavbarProps {
  variant?: NavbarVariant;
}

// Main Navbar Component
export default function Navbar({ variant = 'auto' }: NavbarProps) {
  const overlay = useScrollDetection({ variant });
  const { isAuthed, user, signOut, openAuth, session } = useUserStore();

  const headerClass = useMemo(() => {
    const isSolid = variant === 'solid' || (variant === 'auto' && !overlay);
    return isSolid ? NAVBAR_STYLES.SOLID : NAVBAR_STYLES.OVERLAY;
  }, [overlay, variant]);

  const logoSrc = overlay
    ? '/assets/logos/logo_getrandomtrip_white.png'
    : '/assets/logos/logo_getrandomtrip.png';

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
            {NAVBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className="hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
                  onClick={() => openAuth()}
                >
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>

            {isAuthed && user && (
              <NavbarProfile
                user={user}
                session={session}
                onSignOut={signOut}
              />
            )}
          </div>
        </nav>
      </header>

      <EnhancedAuthModal />
    </>
  );
}
