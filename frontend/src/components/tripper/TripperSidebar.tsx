
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/tripper' },
  { name: 'Mis Rutas', href: '/tripper/routes' },
  { name: 'Ganancias', href: '/tripper/earnings' },
  { name: 'Reseñas & NPS', href: '/tripper/reviews' },
  { name: 'Media', href: '/tripper/media' },
  { name: 'Promos', href: '/tripper/promos' }, // Assuming 'Promos' is a link, though not explicitly a page yet.
  { name: 'Perfil', href: '/tripper/profile' },
  { name: 'Settings', href: '/tripper/settings' },
];

export default function TripperSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white p-4 shadow-md fixed h-full">
      <nav>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name} className="mb-2">
                <Link
                  href={link.href}
                  className={`block p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
