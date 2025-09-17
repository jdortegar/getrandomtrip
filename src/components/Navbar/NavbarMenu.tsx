'use client';

import Link from 'next/link';
import { useMenuState } from '@/hooks/useMenuState';

const MENU_ITEMS = [
  {
    href: '/tripbuddy',
    label: 'IA TripBuddy',
  },
  {
    href: '/bitacoras',
    label: 'Off the Record: Bitácoras del Continente',
  },
] as const;

export function NavbarMenu() {
  const { isOpen, toggle, close, menuRef } = useMenuState();

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Abrir menú"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="p-2 rounded-lg hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-80 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
        >
          {MENU_ITEMS.map((item) => (
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
          <button
            role="menuitem"
            disabled
            className="block w-full text-left px-4 py-2 text-sm rounded opacity-60 cursor-not-allowed"
            title="Próximamente"
          >
            Coming soon
          </button>
        </div>
      )}
    </div>
  );
}
