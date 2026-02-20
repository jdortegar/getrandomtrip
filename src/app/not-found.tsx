import Link from 'next/link';
import {
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plane,
  Users,
} from 'lucide-react';

export const metadata = {
  description:
    'La página que buscas no existe. Descubre increíbles destinos con RandomTrip.',
  title: 'Página No Encontrada - RandomTrip',
};

export default function NotFoundPage() {
  return (
    <div className="relative font-sans min-h-screen bg-gray-50 text-gray-900 antialiased">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 opacity-30 mix-blend-multiply filter blur-xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 opacity-30 mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute left-1/2 top-40 h-80 w-80 rounded-full bg-primary/8 opacity-30 mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-4xl">
            {/* Main Content Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-8 md:p-12 text-center">
              {/* 404 Number with Animation */}
              <div className="mb-8">
                <div className="relative inline-block">
                  <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 animate-pulse">
                    404
                  </h1>
                  <div className="absolute inset-0 text-8xl md:text-9xl font-black text-primary/20 -z-10 blur-sm">
                    404
                  </div>
                </div>
              </div>

              {/* Icon with Animation */}
              <div className="mb-8">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-primary rounded-full blur-md opacity-30 animate-ping"></div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ¡Ups! Te has perdido
              </h2>

              {/* Subtitle */}
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                La página que buscas no existe o ha sido movida. Pero no te
                preocupes, tenemos muchos destinos increíbles esperándote. ¿Por
                qué no exploras nuestras aventuras?
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/"
                  className="group relative px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  <span className="relative z-10">Ir al Inicio</span>
                  <div className="absolute inset-0 bg-primary rounded-xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                </Link>

                <Link
                  href="/packages"
                  className="group px-8 py-4 border-2 border-primary/20 text-primary rounded-xl font-semibold hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plane className="w-5 h-5" />
                  Ver Paquetes
                </Link>
              </div>

              {/* Quick Links */}
              <div className="border-t border-neutral-200 pt-8">
                <p className="text-sm text-gray-600 mb-4">
                  O explora estas secciones populares:
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/packages/by-type/solo"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Viajes Solo
                  </Link>
                  <Link
                    href="/packages/by-type/couple"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    En Pareja
                  </Link>
                  <Link
                    href="/packages/by-type/family"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    En Familia
                  </Link>
                  <Link
                    href="/trippers"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Nuestros Trippers
                  </Link>
                </div>
              </div>

              {/* Fun Message */}
              <div className="mt-8 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> ¿Sabías que nuestros trippers han
                    visitado más de 50 países? ¡Descubre sus experiencias
                    únicas!
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" />
                ¿Necesitas ayuda?{' '}
                <Link
                  href="/contact"
                  className="text-primary hover:text-primary/80 underline"
                >
                  Contáctanos
                </Link>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
