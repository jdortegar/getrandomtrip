'use client';

import Link from 'next/link';
import { NAVBAR_LINKS } from '@/lib/data/constants/navbar';

export function NavbarLinks() {
  return (
    <>
      {NAVBAR_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-label={link.ariaLabel}
          // prefetch={link.prefetch}
          // className={link.className}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
