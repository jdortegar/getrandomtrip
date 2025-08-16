'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function HeaderGate() {
  const pathname = usePathname();

  if (pathname.startsWith('/packages/by-type')) {
    return null;
  }

  return <Navbar />;
}
