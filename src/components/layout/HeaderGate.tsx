'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function HeaderGate() {
  const pathname = usePathname();

  if (pathname === '/packages/build/basic-config') {
    return <Navbar variant="solid" />;
  }

  if (pathname.startsWith('/packages/by-type')) {
    return null;
  }

  return <Navbar />;
}