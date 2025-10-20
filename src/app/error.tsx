'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <>
      <Navbar />

      <Hero
        content={{
          title: '¡Ups! Algo salió mal',
          subtitle: 'Ha ocurrido un error inesperado',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-3xl mx-auto">
          {/* Error Card */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 mb-4 font-jost">
              Error Inesperado
            </h1>

            <p className="text-neutral-600 mb-8 text-lg">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado
              y está trabajando para solucionarlo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={reset} size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Ir al Inicio
                </Link>
              </Button>
            </div>
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900 mb-4">
                  🔧 Detalles del error (solo en desarrollo)
                </summary>
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-neutral-500 uppercase">
                      Mensaje:
                    </span>
                    <p className="text-sm text-red-600 font-mono mt-1">
                      {error.message}
                    </p>
                  </div>
                  {error.digest && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-neutral-500 uppercase">
                        Digest:
                      </span>
                      <p className="text-sm text-neutral-600 font-mono mt-1">
                        {error.digest}
                      </p>
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <span className="text-xs font-semibold text-neutral-500 uppercase">
                        Stack Trace:
                      </span>
                      <pre className="mt-2 p-3 bg-neutral-900 text-green-400 rounded text-xs overflow-auto max-h-64 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Help Info */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 ¿Necesitas ayuda?
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • Intenta recargar la página o volver a intentar la acción
              </li>
              <li>• Verifica tu conexión a internet</li>
              <li>
                • Si el problema persiste, contacta a soporte en{' '}
                <a
                  href="mailto:soporte@getrandomtrip.com"
                  className="underline hover:text-blue-900"
                >
                  soporte@getrandomtrip.com
                </a>
              </li>
            </ul>
          </div> */}
        </div>
      </Section>
    </>
  );
}
