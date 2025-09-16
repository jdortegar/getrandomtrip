'use client';

import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export default function TripperPreviewBanner() {
  const role = typeof window !== 'undefined' ? getUserRole() : null;
  if (role === 'tripper') return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900">
      <div className="max-w-7xl mx-auto px-6 py-2 text-sm flex items-center gap-3">
        <span>Estás viendo el Tripper Panel en <strong>modo vista previa</strong>.</span>
        <Link href="/" className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-800 focus-visible:ring-offset-2 rounded">
          Ir al inicio
        </Link>
        <Link href="/login" className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-800 focus-visible:ring-offset-2 rounded">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
