'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LogOut } from 'lucide-react';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useMenuState } from '@/hooks/useMenuState';
import type { User } from './navbar.types';

interface NavbarProfileProps {
  user: User;
  session: any;
  onSignOut: () => void;
}

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

export function NavbarProfile({
  user,
  session,
  onSignOut,
}: NavbarProfileProps) {
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
