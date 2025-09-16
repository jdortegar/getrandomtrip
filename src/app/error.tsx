'use client';

import { useEffect } from 'react';
import Link from 'next/link';

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
    <html lang="es">
      <head>
        <title>Error - RandomTrip</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans bg-neutral-50 text-neutral-900 antialiased min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl mx-4">
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 text-center">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              ¡Ups! Algo salió mal
            </h1>

            <p className="text-neutral-600 mb-8">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado
              y está trabajando para solucionarlo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
              <Link
                href="/"
                className="px-6 py-3 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Ir al Inicio
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="mt-2 p-4 bg-neutral-100 rounded-lg text-xs overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
