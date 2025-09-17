'use client';

import Link from 'next/link';
import Image from 'next/image';

interface NavbarBrandProps {
  isOverlay: boolean;
}

export function NavbarBrand({ isOverlay }: NavbarBrandProps) {
  const logoSrc = isOverlay
    ? '/assets/logos/logo_getrandomtrip_white.png'
    : '/assets/logos/logo_getrandomtrip.png';

  return (
    <Link
      href="/"
      aria-label="Randomtrip"
      className="flex items-center gap-2 shrink-0 py-2"
    >
      <Image src={logoSrc} alt="Randomtrip" width={160} height={50} />
    </Link>
  );
}
