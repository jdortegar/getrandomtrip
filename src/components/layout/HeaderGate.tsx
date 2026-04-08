'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { pathWithoutLocale } from '@/lib/i18n/pathForLocale';

export default function HeaderGate() {
  const pathname = usePathname();
  const pathNoLocale = pathWithoutLocale(pathname);

  if (pathNoLocale === '/experiences/build/basic-config') {
    return <Navbar variant="solid" />;
  }

  if (pathNoLocale.startsWith('/experiences/by-type')) {
    return null;
  }

  return <Navbar />;
}