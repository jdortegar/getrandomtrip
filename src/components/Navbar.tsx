'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, User, ChevronDown, LogOut, Search } from 'lucide-react';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import { useMenuState } from '@/hooks/useMenuState';
import EnhancedAuthModal from '@/components/auth/EnhancedAuthModal';
import { Button } from '@/components/ui/Button';
import {
  NAVBAR_CONSTANTS,
  NAVBAR_STYLES,
  NAVBAR_LINKS,
} from '@/lib/data/constants/navbar';

// Types
export type NavbarVariant = 'auto' | 'solid';

export interface User {
  name?: string;
  avatar?: string;
  role?: string;
}

export interface NavbarProps {
  variant?: NavbarVariant;
}

// Profile Menu Items
const PROFILE_MENU_ITEMS = [
  {
    href: '/profile',
    label: 'Mi perfil público',
  },
  {
    href: '/profile/edit',
    label: 'Editar perfil',
  },
] as const;

const TRIPPER_MENU_ITEM = {
  href: '/tripper',
  label: 'Tripper OS',
};

const DASHBOARD_MENU_ITEM = {
  href: '/dashboard',
  label: 'Bitácoras de Viajes',
};

// NavbarProfile Component
function NavbarProfile({
  user,
  session,
  onSignOut,
}: {
  user: User;
  session: any;
  onSignOut: () => void;
}) {
  const { isOpen, toggle, close, menuRef } = useMenuState();

  const avatarSrc = user?.avatar ?? 'https://placehold.co/64x64';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'R';

  const handleSignOut = () => {
    if (session) {
      nextAuthSignOut({ callbackUrl: '/' });
    } else {
      onSignOut();
    }
    close();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Abrir menú de perfil"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="p-1 rounded-full hover:bg-white/10 flex items-center justify-center"
      >
        {user?.avatar ? (
          <Image
            src={avatarSrc}
            alt={user?.name ?? 'avatar'}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border border-neutral-200"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-semibold">
            {userInitial}
          </div>
        )}
        <ChevronDown size={16} className="ml-1" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-48 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
        >
          {PROFILE_MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
              onClick={close}
            >
              {item.label}
            </Link>
          ))}

          {user?.role === 'tripper' && (
            <Link
              role="menuitem"
              href={TRIPPER_MENU_ITEM.href}
              className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
              onClick={close}
            >
              {TRIPPER_MENU_ITEM.label}
            </Link>
          )}

          <Link
            role="menuitem"
            href={DASHBOARD_MENU_ITEM.href}
            className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
            onClick={close}
          >
            {DASHBOARD_MENU_ITEM.label}
          </Link>

          <div className="my-1 h-px bg-neutral-200" />

          <button
            role="menuitem"
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
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
