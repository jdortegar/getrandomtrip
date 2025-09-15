import Navbar from '@/components/Navbar';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/ui/BgCarousel';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <>
      <Navbar />
      <BgCarousel scrim={0.75} />

      <main className="container mx-auto max-w-2xl px-4 pt-24 md:pt-28 pb-16">
        <GlassCard>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              Acceso Denegado
            </h1>

            <p className="text-neutral-600 mb-8">
              No tienes permisos para acceder a esta página. Contacta al
              administrador si crees que esto es un error.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al Inicio
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Mi Dashboard
              </Link>
            </div>
          </div>
        </GlassCard>
      </main>
    </>
  );
}
