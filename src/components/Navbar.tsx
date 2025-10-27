'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, User, Search } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
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
  const { isAuthed, user, signOut, session } = useUserStore();
  const { isOpen, mode, close, openLogin } = useAuthModal();
  const pathname = usePathname();
  const [hasHeroSection, setHasHeroSection] = useState(true);

  // Check for hero section on route change
  useEffect(() => {
    const checkHeroSection = () => {
      if (typeof window === 'undefined') return;

      // Small delay to ensure DOM is updated after route change
      setTimeout(() => {
        const heroSentinel = document.getElementById('hero-sentinel');
        setHasHeroSection(heroSentinel !== null);
      }, 100);
    };

    checkHeroSection();
  }, [pathname]);

  const headerClass = useMemo(() => {
    // If no hero section exists, always use solid variant
    if (!hasHeroSection) {
      return NAVBAR_STYLES.SOLID;
    }

    // For pages with hero sections, use the original logic
    // This allows transparent navbar on home page, etc.
    const isSolid = variant === 'solid' || (variant === 'auto' && !overlay);
    return isSolid ? NAVBAR_STYLES.SOLID : NAVBAR_STYLES.OVERLAY;
  }, [overlay, variant, hasHeroSection]);

  const logoSrc = useMemo(() => {
    // If no hero section, always use the regular logo (solid navbar)
    if (!hasHeroSection) {
      return '/assets/logos/logo_getrandomtrip.png';
    }

    // Original logic for pages with hero sections
    return overlay
      ? '/assets/logos/logo_getrandomtrip_white.png'
      : '/assets/logos/logo_getrandomtrip.png';
  }, [overlay, hasHeroSection]);

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
                  onClick={() => openLogin()}
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

      <AuthModal isOpen={isOpen} onClose={close} defaultMode={mode} />
    </>
  );
}
